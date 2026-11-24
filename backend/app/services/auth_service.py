"""Auth orchestration: register / login / logout / me / change-password / reset."""
from __future__ import annotations

import datetime as _dt
import hashlib
import hmac
import logging
import re
import secrets
from typing import Any

from flask import current_app, request
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from ..extensions import db
from ..models.user import User, Session, PasswordResetToken
from ..models.mfa import MfaChallenge, MfaRecoveryCode
from ..models.audit import AuditLog
from ..security.password import hash_password, verify_password
from ..security.session import (
    rotate_session,
    invalidate_session,
    invalidate_all_user_sessions,
    get_current_session,
    set_session_cookies,
    clear_session_cookies,
    issue_csrf_cookie,
    create_session,
)
from ..security.audit import audit_log
from ..security import captcha as captcha_security
from .email_service import EmailDeliveryError, email_service
from ..utils.errors import ApiError, ErrorCode
from ..security.totp import (
    decrypt_totp_secret,
    encrypt_totp_secret,
    generate_recovery_codes,
    generate_totp_secret,
    hash_recovery_code,
    matching_totp_counter,
)
from urllib.parse import quote

_log = logging.getLogger(__name__)


def hash_verification_code(email: str, code: str, purpose: str = "registration") -> str:
    """Key a short OTP before hashing so a DB leak cannot brute-force 10^6 codes."""
    pepper = str(current_app.config.get("PASSWORD_PEPPER") or "").encode("utf-8")
    if not pepper:
        raise RuntimeError("OTP hashing key is not configured")
    normalized = email.strip().lower()
    payload = f"email-otp:v1:{purpose}:{normalized}:{code}".encode("utf-8")
    return hmac.new(pepper, payload, hashlib.sha256).hexdigest()

def _utcnow() -> _dt.datetime:
    return _dt.datetime.now(_dt.timezone.utc)


def _aware(dt: _dt.datetime) -> _dt.datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=_dt.timezone.utc)
    return dt


def _iso(dt: _dt.datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=_dt.timezone.utc)
    return dt.astimezone(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _lock_security_user(user_id: int) -> User | None:
    """Serialize credential consumption per account until transaction end.

    A no-op UPDATE locks on both PostgreSQL and SQLite (which ignores SELECT
    FOR UPDATE). Always lock the user before challenges/proofs, then refresh
    any object cached by an earlier read in this request.
    """
    updated = db.session.query(User).filter(User.id == user_id).update(
        {User.id: User.id}, synchronize_session=False
    )
    if updated != 1:
        return None
    return db.session.get(User, user_id, populate_existing=True)


class AuthService:
    """Stateless orchestration; instances are just namespace holders."""

    # ----- register -------------------------------------------------------
    def register(self, payload: dict[str, Any]) -> tuple[dict, dict, str]:
        captcha_security.enforce_captcha(payload.get("captcha_token"))
        if not email_service.is_configured():
            raise ApiError(503, ErrorCode.INTERNAL, "E-poçtla hesab təsdiqi hazırda əlçatan deyil")
        name = payload["name"]
        email = str(payload["email"]).strip().lower()
        password = payload["password"]

        # 1. Standart e-poçt formatı yoxlaması (Regex düzəldildi)[cite: 7]
        email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not email or not re.match(email_regex, email):
            raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Düzgün və etibarlı e-poçt ünvanı daxil edin")

        # A syntactically valid email can use a custom/work/school domain.
        # Ownership is established by the email challenge, not a provider list.
        otp_code = f"{secrets.randbelow(1000000):06d}"
        otp_ttl_min = int(current_app.config.get("OTP_TTL_MIN", 5))
        now = _utcnow()

        user = User(
            name=name, 
            email=email, 
            password_hash=hash_password(password),
            is_verified=False,
            otp_hash=hash_verification_code(email, otp_code),
            otp_expires_at=now + _dt.timedelta(minutes=otp_ttl_min)
        )
        db.session.add(user)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            audit_log(action="register_failure", details={"reason": "email_exists", "email_hash": hashlib.sha256(email.encode()).hexdigest()})
            raise ApiError(
                409,
                ErrorCode.EMAIL_EXISTS,
                "Bu e-poçt artıq qeydiyyatlıdır",
                fields={"email": ["Artıq qeydiyyatlıdır"]},
            )

        try:
            email_service.send_verification(email, otp_code)
        except EmailDeliveryError as exc:
            audit_log(action="verification_email_failure", user_id=user.id,
                      details={"error_type": type(exc).__name__})
            raise ApiError(503, ErrorCode.INTERNAL,
                           "Təsdiq e-poçtu göndərilə bilmədi. Yeni kod istəyə bilərsiniz.",
                           fields={"verification_pending": "true"}) from None

        audit_log(action="register_pending_verification", user_id=user.id)
        return {"user": user.to_public_dict(), "requires_verification": True}, {}, None

    # ----- verify_otp -----------------------------------------------------
    def verify_otp(self, payload: dict[str, Any]) -> tuple[dict, dict, str]:
        email = str(payload.get("email", "")).strip().lower()
        code = str(payload.get("code", "")).strip()

        user = db.session.query(User).filter(User.email == email).first()
        if (user is None or user.is_verified or user.otp_hash is None
                or not re.fullmatch(r"\d{6}", code) or user.otp_expires_at is None
                or not hmac.compare_digest(
                    user.otp_hash, hash_verification_code(email, code)
                )):
            raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Daxil edilən təsdiq kodu yanlışdır")

        if _utcnow() >= _aware(user.otp_expires_at):
            raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Təsdiq kodunun vaxtı bitib. Yenisini tələb edin.")

        user.is_verified = True
        user.otp_hash = None
        user.otp_expires_at = None
        user.last_login_at = _utcnow()

        # Kod təsdiqlənən kimi avtomatik sessiya yaradılır ki, istifadəçi birbaşa login olsun[cite: 7]
        old_session = get_current_session()
        raw_token, csrf, _ = rotate_session(user, old_session=old_session)
        db.session.commit()
        audit_log(action="otp_verify_success", user_id=user.id)
        audit_log(action="login_success", user_id=user.id)

        return {"user": user.to_public_dict()}, {"raw_token": raw_token, "csrf": csrf}, None

    def resend_verification(self, email: str) -> dict:
        email = email.strip().lower()
        user = db.session.query(User).filter(User.email == email).first()
        if user is None or user.is_verified or not email_service.is_configured():
            return {"ok": True}
        code = f"{secrets.randbelow(1_000_000):06d}"
        user.otp_hash = hash_verification_code(email, code)
        user.otp_expires_at = _utcnow() + _dt.timedelta(
            minutes=int(current_app.config.get("OTP_TTL_MIN", 5))
        )
        db.session.commit()
        try:
            email_service.send_verification(email, code)
        except EmailDeliveryError as exc:
            _log.error("verification resend failed error_type=%s", type(exc).__name__)
            return {"ok": True}
        audit_log(action="verification_email_resent", user_id=user.id)
        return {"ok": True}

    # ----- update profile with otp -----------------------------------------
    def update_profile_request(self, user_id: int, payload: dict[str, Any]) -> dict:
        user = db.session.get(User, user_id)
        if user is None:
            raise ApiError(404, ErrorCode.NOT_FOUND, "İstifadəçi tapılmadı")
        if not verify_password(payload["current_password"], user.password_hash):
            audit_log(action="profile_update_failure", user_id=user.id,
                      details={"reason": "invalid_current_password"})
            raise ApiError(400, ErrorCode.INVALID_CURRENT_PASSWORD, "Cari parol yanlışdır")
        if user.mfa_enabled:
            if not user.totp_secret_encrypted:
                raise ApiError(400, ErrorCode.BAD_REQUEST, "Authenticator məlumatı mövcud deyil")
            code = str(payload.get("mfa_code") or "").strip()
            counter = matching_totp_counter(decrypt_totp_secret(user.totp_secret_encrypted), code)
            if counter is None or (user.mfa_last_counter is not None and counter <= user.mfa_last_counter):
                raise ApiError(400, ErrorCode.VALIDATION_FAILED,
                               "Həssas profil dəyişikliyi üçün təzə authenticator kodu tələb olunur")
            user.mfa_last_counter = counter

        if "name" in payload:
            name = str(payload["name"]).strip()
            if not 1 <= len(name) <= 80:
                raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Ad 1–80 simvol olmalıdır")
            user.name = name

        changed_email = "email" in payload and str(payload["email"]).strip().lower() != user.email
        if changed_email:
            if not email_service.is_configured():
                raise ApiError(503, ErrorCode.INTERNAL, "E-poçtla hesab təsdiqi hazırda əlçatan deyil")
            email = str(payload["email"]).strip().lower()
            
            email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
            if not email or not re.match(email_regex, email):
                raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Düzgün və etibarlı e-poçt ünvanı daxil edin")

            existing = db.session.query(User).filter(User.email == email, User.id != user.id).first()
            if existing:
                raise ApiError(409, ErrorCode.EMAIL_EXISTS, "Bu e-poçt ünvanı artıq istifadədədir")

            otp_code = f"{secrets.randbelow(1000000):06d}"
            otp_ttl_min = int(current_app.config.get("OTP_TTL_MIN", 5))
            now = _utcnow()

            user.pending_email = email
            user.otp_hash = hash_verification_code(email, otp_code, "profile-email")
            user.otp_expires_at = now + _dt.timedelta(minutes=otp_ttl_min)

        db.session.commit()
        if changed_email:
            try:
                email_service.send_verification(email, otp_code)
            except EmailDeliveryError as exc:
                _log.error("profile verification delivery failed error_type=%s", type(exc).__name__)
                raise ApiError(503, ErrorCode.INTERNAL,
                               "Təsdiq e-poçtu göndərilə bilmədi") from None
        return {"ok": True, "requires_otp": changed_email, "message": "Profil yeniləndi"}

    def verify_profile_otp(self, user_id: int, payload: dict[str, Any]) -> dict:
        user = db.session.get(User, user_id)
        if user is None:
            raise ApiError(404, ErrorCode.NOT_FOUND, "İstifadəçi tapılmadı")

        code = str(payload.get("code", "")).strip()
        new_email = str(payload.get("email", "")).strip().lower()

        if (not user.pending_email or new_email != user.pending_email or not user.otp_hash
                or not re.fullmatch(r"\d{6}", code)
                or not hmac.compare_digest(
                    user.otp_hash, hash_verification_code(new_email, code, "profile-email")
                )):
            raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Daxil edilən təsdiq kodu yanlışdır")

        if user.otp_expires_at is None or _utcnow() >= _aware(user.otp_expires_at):
            raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Təsdiq kodunun vaxtı bitib")

        current_session = get_current_session()
        if current_session is None or current_session.user_id != user.id:
            raise ApiError(401, ErrorCode.UNAUTHORIZED, "Giriş tələb olunur")

        user.email = new_email
        user.is_verified = True
        user.pending_email = None
        user.otp_hash = None
        user.otp_expires_at = None
        revoked_sessions = (db.session.query(Session)
                            .filter(Session.user_id == user.id,
                                    Session.id != current_session.id)
                            .delete(synchronize_session=False))
        try:
            db.session.commit()
        except IntegrityError as exc:
            db.session.rollback()
            raise ApiError(409, ErrorCode.EMAIL_EXISTS, "Bu e-poçt ünvanı artıq istifadədədir") from exc
        audit_log(action="profile_email_changed", user_id=user.id,
                  details={"other_sessions_revoked": revoked_sessions})
        return {"user": user.to_public_dict(), "ok": True}

    # ----- login ----------------------------------------------------------
    def login(self, payload: dict[str, Any]) -> tuple[dict, dict, str]:
        email = payload["email"]
        password = payload["password"]
        captcha_security.enforce_captcha(payload.get("captcha_token"))
        user = db.session.query(User).filter(User.email == email).first()
        if user is None or not user.is_verified or not verify_password(password, user.password_hash):
            audit_log(action="login_failure", user_id=user.id if user else None,
                      details={"email_hash": hashlib.sha256(email.encode()).hexdigest()})
            raise ApiError(
                401,
                ErrorCode.INVALID_CREDENTIALS,
                "E-poçt və ya parol yanlışdır",
            )

        if user.mfa_enabled:
            now = _utcnow()
            (db.session.query(MfaChallenge)
             .filter_by(user_id=user.id, consumed_at=None)
             .update({MfaChallenge.consumed_at: now}, synchronize_session=False))
            raw_challenge = secrets.token_urlsafe(32)
            challenge = MfaChallenge(
                user_id=user.id,
                challenge_hash=hashlib.sha256(raw_challenge.encode("ascii")).hexdigest(),
                created_at=now,
                expires_at=now + _dt.timedelta(minutes=5),
            )
            db.session.add(challenge)
            db.session.commit()
            audit_log(action="login_mfa_required", user_id=user.id)
            return {"mfa_required": True, "challenge_token": raw_challenge, "expires_in": 300}, {}, None

        old_sess = get_current_session()
        raw_token, csrf, sess = rotate_session(user, old_session=old_sess)
        user.last_login_at = _utcnow()
        db.session.commit()
        audit_log(action="login_success", user_id=user.id)
        return {"user": user.to_public_dict()}, {"raw_token": raw_token, "csrf": csrf}, None

    # ----- multi-factor authentication ----------------------------------
    def mfa_enroll(self, user_id: int, current_password: str) -> dict:
        user = db.session.get(User, user_id)
        if user is None:
            raise ApiError(404, ErrorCode.NOT_FOUND, "İstifadəçi tapılmadı")
        if user.mfa_enabled:
            raise ApiError(409, ErrorCode.BAD_REQUEST, "İki mərhələli doğrulama artıq aktivdir")
        if not verify_password(current_password, user.password_hash):
            raise ApiError(400, ErrorCode.INVALID_CURRENT_PASSWORD, "Cari parol yanlışdır")
        secret = generate_totp_secret()
        user.totp_secret_encrypted = encrypt_totp_secret(secret)
        db.session.query(MfaRecoveryCode).filter_by(user_id=user.id).delete()
        db.session.commit()
        label = quote(f"Career Arena:{user.email}")
        issuer = quote("Career Arena")
        uri = f"otpauth://totp/{label}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30"
        audit_log(action="mfa_enrollment_started", user_id=user.id)
        return {"secret": secret, "otpauth_uri": uri, "issuer": "Career Arena"}

    def mfa_confirm(self, user_id: int, code: str) -> tuple[dict, dict]:
        user = db.session.get(User, user_id)
        if user is None:
            raise ApiError(404, ErrorCode.NOT_FOUND, "İstifadəçi tapılmadı")
        if user.mfa_enabled or not user.totp_secret_encrypted:
            raise ApiError(400, ErrorCode.BAD_REQUEST, "Əvvəlcə iki mərhələli doğrulamanı başladın")
        secret = decrypt_totp_secret(user.totp_secret_encrypted)
        counter = matching_totp_counter(secret, code)
        if counter is None:
            raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Təsdiq kodu yanlışdır və ya vaxtı bitib")
        codes = generate_recovery_codes()
        now = _utcnow()
        user.mfa_enabled = True
        user.mfa_last_counter = counter
        for recovery_code in codes:
            db.session.add(MfaRecoveryCode(user_id=user.id, code_hash=hash_recovery_code(recovery_code), created_at=now))
        invalidate_all_user_sessions(user.id)
        raw_token, csrf, _sess = create_session(user)
        db.session.commit()
        audit_log(action="mfa_enabled", user_id=user.id)
        return {"ok": True, "recovery_codes": codes, "user": user.to_public_dict()}, {
            "raw_token": raw_token, "csrf": csrf
        }

    def mfa_challenge(self, payload: dict[str, Any]) -> tuple[dict, dict, str]:
        challenge_hash = hashlib.sha256(payload["challenge_token"].encode("ascii")).hexdigest()
        challenge = db.session.query(MfaChallenge).filter_by(challenge_hash=challenge_hash).first()
        user = _lock_security_user(challenge.user_id) if challenge is not None else None
        if challenge is not None:
            db.session.refresh(challenge)
        now = _utcnow()
        if (challenge is None or challenge.consumed_at is not None
                or now >= _aware(challenge.expires_at) or challenge.attempts >= 5):
            raise ApiError(400, ErrorCode.INVALID_CREDENTIALS, "Doğrulama sorğusu etibarsızdır və ya vaxtı bitib")
        if user is None or not user.mfa_enabled or not user.totp_secret_encrypted:
            raise ApiError(400, ErrorCode.INVALID_CREDENTIALS, "Doğrulama sorğusu etibarsızdır və ya vaxtı bitib")

        # Reserve an attempt atomically before examining a proof.
        reserved = db.session.query(MfaChallenge).filter(
            MfaChallenge.id == challenge.id,
            MfaChallenge.consumed_at.is_(None),
            MfaChallenge.expires_at > now,
            MfaChallenge.attempts < 5,
        ).update({MfaChallenge.attempts: MfaChallenge.attempts + 1}, synchronize_session=False)
        if reserved != 1:
            db.session.rollback()
            raise ApiError(400, ErrorCode.INVALID_CREDENTIALS, "Doğrulama sorğusu etibarsızdır və ya vaxtı bitib")
        db.session.refresh(challenge)

        code = payload["code"].strip()
        method = "totp"
        counter = matching_totp_counter(decrypt_totp_secret(user.totp_secret_encrypted), code)
        valid = counter is not None and (user.mfa_last_counter is None or counter > user.mfa_last_counter)
        recovery = None
        if not valid:
            code_hash = hash_recovery_code(code)
            recovery = (db.session.query(MfaRecoveryCode)
                        .filter_by(user_id=user.id, code_hash=code_hash, used_at=None).first())
            valid = recovery is not None
            method = "recovery_code"

        if valid and method == "totp":
            valid = db.session.query(User).filter(
                User.id == user.id,
                User.mfa_enabled.is_(True),
                or_(User.mfa_last_counter.is_(None), User.mfa_last_counter < counter),
            ).update({User.mfa_last_counter: counter}, synchronize_session=False) == 1
        elif valid:
            valid = db.session.query(MfaRecoveryCode).filter(
                MfaRecoveryCode.id == recovery.id,
                MfaRecoveryCode.used_at.is_(None),
            ).update({MfaRecoveryCode.used_at: now}, synchronize_session=False) == 1

        if not valid:
            locked = challenge.attempts >= 5
            db.session.commit()
            if locked:
                audit_log(action="mfa_challenge_locked", user_id=user.id)
                raise ApiError(429, ErrorCode.RATE_LIMITED, "Doğrulama cəhdlərinin limiti bitdi")
            raise ApiError(400, ErrorCode.INVALID_CREDENTIALS, "Doğrulama kodu yanlışdır")

        challenge.consumed_at = now
        user.last_login_at = now
        old_session = get_current_session()
        raw_token, csrf, _sess = rotate_session(user, old_session=old_session)
        db.session.commit()
        audit_log(action="login_success", user_id=user.id, details={"mfa_method": method})
        return {"user": user.to_public_dict()}, {"raw_token": raw_token, "csrf": csrf}, None

    def mfa_disable(self, user_id: int, payload: dict[str, str]) -> tuple[dict, dict]:
        user = db.session.get(User, user_id)
        if user is None:
            raise ApiError(404, ErrorCode.NOT_FOUND, "İstifadəçi tapılmadı")
        if not user.mfa_enabled or not user.totp_secret_encrypted:
            raise ApiError(400, ErrorCode.BAD_REQUEST, "İki mərhələli doğrulama aktiv deyil")
        if not verify_password(payload["current_password"], user.password_hash):
            raise ApiError(400, ErrorCode.INVALID_CURRENT_PASSWORD, "Cari parol yanlışdır")
        counter = matching_totp_counter(decrypt_totp_secret(user.totp_secret_encrypted), payload["code"])
        if counter is None or (user.mfa_last_counter is not None and counter <= user.mfa_last_counter):
            raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Təsdiq kodu yanlışdır və ya vaxtı bitib")

        user.mfa_enabled = False
        user.totp_secret_encrypted = None
        user.mfa_last_counter = None
        db.session.query(MfaRecoveryCode).filter_by(user_id=user.id).delete()
        db.session.query(MfaChallenge).filter_by(user_id=user.id, consumed_at=None).update(
            {MfaChallenge.consumed_at: _utcnow()}, synchronize_session=False
        )
        invalidate_all_user_sessions(user.id)
        raw_token, csrf, _sess = create_session(user)
        db.session.commit()
        audit_log(action="mfa_disabled", user_id=user.id)
        return {"ok": True, "user": user.to_public_dict()}, {"raw_token": raw_token, "csrf": csrf}

    def mfa_recovery_codes_rotate(self, user_id: int, payload: dict[str, str]) -> dict:
        user = db.session.get(User, user_id)
        if user is None:
            raise ApiError(404, ErrorCode.NOT_FOUND, "İstifadəçi tapılmadı")
        if not user.mfa_enabled or not user.totp_secret_encrypted:
            raise ApiError(400, ErrorCode.BAD_REQUEST, "İki mərhələli doğrulama aktiv deyil")
        if not verify_password(payload["current_password"], user.password_hash):
            raise ApiError(400, ErrorCode.INVALID_CURRENT_PASSWORD, "Cari parol yanlışdır")

        counter = matching_totp_counter(decrypt_totp_secret(user.totp_secret_encrypted), payload["code"])
        if counter is None:
            raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Authenticator kodu yanlışdır və ya vaxtı bitib")

        # Atomic compare-and-set prevents concurrent requests from reusing the
        # same TOTP counter to replace the recovery set more than once.
        updated = db.session.query(User).filter(
            User.id == user.id,
            or_(User.mfa_last_counter.is_(None), User.mfa_last_counter < counter),
        ).update({User.mfa_last_counter: counter}, synchronize_session=False)
        if updated != 1:
            db.session.rollback()
            raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Authenticator kodu artıq istifadə olunub")

        codes = generate_recovery_codes()
        db.session.query(MfaRecoveryCode).filter_by(user_id=user.id).delete(synchronize_session=False)
        now = _utcnow()
        db.session.add_all(
            MfaRecoveryCode(user_id=user.id, code_hash=hash_recovery_code(code), created_at=now)
            for code in codes
        )
        db.session.commit()
        audit_log(action="mfa_recovery_codes_rotated", user_id=user.id)
        return {"ok": True, "recovery_codes": codes}

    def list_sessions(self, user_id: int, current_session_id: int) -> dict:
        rows = (db.session.query(Session)
                .filter(Session.user_id == user_id)
                .order_by(Session.created_at.desc(), Session.id.desc())
                .all())
        active = [session for session in rows if not session.is_expired]
        return {"sessions": [{
            "id": session.id,
            "current": session.id == current_session_id,
            "user_agent": session.user_agent,
            "ip": session.ip,
            "created_at": _iso(session.created_at),
            "expires_at": _iso(session.expires_at),
        } for session in active]}

    def revoke_session(self, user_id: int, session_id: int) -> bool:
        session = db.session.query(Session).filter_by(id=session_id, user_id=user_id).first()
        if session is None:
            raise ApiError(404, ErrorCode.NOT_FOUND, "Sessiya tapılmadı")
        was_current = session.id == getattr(get_current_session(), "id", None)
        db.session.delete(session)
        db.session.commit()
        audit_log(action="session_revoked", user_id=user_id,
                  details={"scope": "current" if was_current else "one"})
        return was_current

    def revoke_other_sessions(self, user_id: int, current_session_id: int) -> int:
        count = (db.session.query(Session)
                 .filter(Session.user_id == user_id, Session.id != current_session_id)
                 .delete(synchronize_session=False))
        db.session.commit()
        audit_log(action="sessions_revoked", user_id=user_id, details={"scope": "others", "count": count})
        return count

    def revoke_all_sessions(self, user_id: int) -> int:
        count = db.session.query(Session).filter_by(user_id=user_id).delete(synchronize_session=False)
        db.session.commit()
        audit_log(action="sessions_revoked", user_id=user_id, details={"scope": "all", "count": count})
        return count

    # ----- logout ---------------------------------------------------------
    def logout(self) -> dict:
        sess = get_current_session()
        if sess is not None:
            uid = sess.user_id
            invalidate_session(sess)
            db.session.commit()
            audit_log(action="logout", user_id=uid)
        return {"ok": True}

    # ----- me -------------------------------------------------------------
    def me(self) -> dict:
        sess = get_current_session()
        if sess is None:
            raise ApiError(401, ErrorCode.UNAUTHORIZED, "Autentifikasiya tələb olunur")
        user = db.session.get(User, sess.user_id)
        if user is None:
            raise ApiError(401, ErrorCode.UNAUTHORIZED, "Autentifikasiya tələb olunur")
        return {"user": user.to_public_dict()}

    # ----- csrf -----------------------------------------------------------
    def csrf(self) -> tuple[dict, str]:
        sess = get_current_session()
        if sess is None:
            raise ApiError(401, ErrorCode.UNAUTHORIZED, "Autentifikasiya tələb olunur")
        return {"csrf_token": sess.csrf_token}, sess.csrf_token

    # ----- change password ----------------------------------------------
    def change_password(self, payload: dict[str, Any]) -> tuple[dict, dict, str]:
        sess = get_current_session()
        if sess is None:
            raise ApiError(401, ErrorCode.UNAUTHORIZED, "Autentifikasiya tələb olunur")
        user = db.session.get(User, sess.user_id)
        if user is None:
            raise ApiError(401, ErrorCode.UNAUTHORIZED, "Autentifikasiya tələb olunur")
        current = payload.get("current_password", "")
        if not verify_password(current, user.password_hash):
            audit_log(action="password_change_failure", user_id=user.id)
            raise ApiError(400, ErrorCode.INVALID_CURRENT_PASSWORD, "Hazırki parol yanlışdır")
        user.password_hash = hash_password(payload["new_password"])
        raw_token, csrf, new_sess = rotate_session(user, old_session=sess)
        other_sessions = (db.session.query(Session)
                          .filter(Session.user_id == user.id, Session.id != new_sess.id)
                          .delete(synchronize_session=False))
        db.session.commit()
        audit_log(action="password_change", user_id=user.id,
                  details={"other_sessions_revoked": other_sessions})
        return {"ok": True}, {"raw_token": raw_token, "csrf": csrf}, None

    # ----- password reset (request + confirm) ----------------------------
    def password_reset_request(self, email: str) -> dict:
        user = db.session.query(User).filter(User.email == email).first()
        if user is None:
            audit_log(action="password_reset_request",
                      details={"email_hash": hashlib.sha256(email.encode()).hexdigest(),
                               "found": False})
            return {"ok": True}
        if not email_service.is_configured():
            audit_log(action="password_reset_delivery_unavailable", user_id=user.id)
            return {"ok": True}
        ttl_min = int(current_app.config.get("PASSWORD_RESET_TTL_MIN", 30))
        now = _utcnow()
        raw = secrets.token_urlsafe(32)
        row = PasswordResetToken(
            user_id=user.id,
            token_hash=PasswordResetToken.hash_token(raw),
            created_at=now,
            expires_at=now + _dt.timedelta(minutes=ttl_min),
        )
        db.session.add(row)
        db.session.commit()
        try:
            email_service.send_password_reset(user.email, raw)
        except EmailDeliveryError as exc:
            _log.error("password reset delivery failed error_type=%s", type(exc).__name__)
        audit_log(action="password_reset_request", user_id=user.id,
                  details={"token_hash_prefix": row.token_hash[:12]})
        return {"ok": True}

    def password_reset_confirm(self, token: str, new_password: str) -> dict:
        row = db.session.query(PasswordResetToken).filter(
            PasswordResetToken.token_hash == PasswordResetToken.hash_token(token)
        ).first()
        user = _lock_security_user(row.user_id) if row is not None else None
        if row is not None:
            db.session.refresh(row)
        if row is None or row.is_expired or row.is_used:
            audit_log(action="password_reset_confirm_failure",
                      user_id=row.user_id if row else None,
                      details={"reason": "invalid_or_expired"})
            raise ApiError(400, ErrorCode.INVALID_OR_EXPIRED_TOKEN,
                           "Token yanlışdır və ya vaxtı keçib")
        if user is None:
            raise ApiError(400, ErrorCode.INVALID_OR_EXPIRED_TOKEN,
                           "Token yanlışdır və ya vaxtı keçib")
        user.password_hash = hash_password(new_password)
        now = _utcnow()
        # All recovery links and pending password-accepted MFA challenges are
        # revoked with the password change in the same transaction.
        db.session.query(PasswordResetToken).filter_by(user_id=user.id, used_at=None).update(
            {PasswordResetToken.used_at: now}, synchronize_session=False
        )
        db.session.query(MfaChallenge).filter_by(user_id=user.id, consumed_at=None).update(
            {MfaChallenge.consumed_at: now}, synchronize_session=False
        )
        n = invalidate_all_user_sessions(user.id)
        db.session.commit()
        audit_log(action="password_reset_confirm", user_id=user.id,
                  details={"sessions_invalidated": n})
        return {"ok": True}


auth_service = AuthService()
