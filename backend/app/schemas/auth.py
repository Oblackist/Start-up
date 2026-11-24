"""Auth request schemas. Strict (unknown=EXCLUDE): reject unknown fields."""
from __future__ import annotations

import re

from marshmallow import Schema, fields, validate, ValidationError, EXCLUDE, pre_load


_EMAIL_RE = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,253}\.[^@\s]{2,}$")


class _EmailField(fields.String):
    """String field that normalizes the email on load (strip + lowercase)."""

    def _deserialize(self, value, attr, data, **kwargs):  # type: ignore[override]
        if not isinstance(value, str):
            raise ValidationError("Düzgün e-poçt daxil edin")
        v = value.strip().lower()
        if not _EMAIL_RE.match(v):
            raise ValidationError("Düzgün e-poçt daxil edin")
        return v


class _NameField(fields.String):
    """String field that strips + validates name length 1–80."""

    def _deserialize(self, value, attr, data, **kwargs):  # type: ignore[override]
        if not isinstance(value, str):
            raise ValidationError("Ad yararsızdır")
        v = value.strip()
        if not v:
            raise ValidationError("Ad boş ola bilməz")
        if not (1 <= len(v) <= 80):
            raise ValidationError("Ad 1–80 simvol olmalıdır")
        return v


class _PasswordField(fields.String):
    """String field that validates the password rules."""

    def _deserialize(self, value, attr, data, **kwargs):  # type: ignore[override]
        if not isinstance(value, str):
            raise ValidationError("Parol yararsızdır")
        if len(value) < 8 or len(value) > 72:
            raise ValidationError("Parol 8–72 simvol olmalıdır")
        if not re.search(r"[A-Za-z\u0400-\u04FFÀ-ÿİıŞĞ]", value):
            raise ValidationError("Paroldə ən azı bir hərf olmalıdır")
        if not re.search(r"\d", value):
            raise ValidationError("Paroldə ən azı bir rəqəm olmalıdır")
        return value


def _validate_password(value: str) -> None:
    """Stand-alone validator for password fields (used by schemas)."""
    if not isinstance(value, str):
        raise ValidationError("Parol yararsızdır")
    if len(value) < 8 or len(value) > 72:
        raise ValidationError("Parol 8–72 simvol olmalıdır")
    if not re.search(r"[A-Za-z\u0400-\u04FFÀ-ÿİıŞĞ]", value):
        raise ValidationError("Paroldə ən azı bir hərf olmalıdır")
    if not re.search(r"\d", value):
        raise ValidationError("Paroldə ən azı bir rəqəm olmalıdır")


def _validate_email(value: str) -> str:
    if not isinstance(value, str) or not _EMAIL_RE.match(value.strip()):
        raise ValidationError("Düzgün e-poçt daxil edin")
    return value.strip().lower()


def _validate_name(value: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValidationError("Ad boş ola bilməz")
    v = value.strip()
    if not (1 <= len(v) <= 80):
        raise ValidationError("Ad 1–80 simvol olmalıdır")
    return v


class RegisterSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    name = _NameField(required=True)
    email = _EmailField(required=True)
    password = _PasswordField(required=True)
    confirm = fields.String(required=True)
    captcha_key = fields.String(required=False, allow_none=True)
    captcha_text = fields.String(required=False, allow_none=True)
    captcha_token = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=2048),
    )

    @pre_load
    def _check_unknown(self, data, **kwargs):
        # marshmallow EXCLUDE silently drops unknown — we want to RAISE.
        if not isinstance(data, dict):
            return data
        allowed = {"name", "email", "password", "confirm", "captcha_key", "captcha_text", "captcha_token"}
        unknown = set(data.keys()) - allowed
        if unknown:
            raise ValidationError({k: ["Naməlum sahə"] for k in unknown})
        return data

    def load(self, *args, **kwargs):  # type: ignore[override]
        data = super().load(*args, **kwargs)
        if data["confirm"] != data["password"]:
            raise ValidationError({"confirm": ["Parol təsdiqi uyğun gəlmir"]})
        return data


class LoginSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    email = _EmailField(required=True)
    password = fields.String(required=True)
    # Cloudflare Turnstile token (docs/CONTRACT.md §7). Optional: NOT required
    # when captcha is disabled (TURNSTILE_SECRET_KEY unset). Empty/None is
    # allowed through the schema and validated lazily in the service, which
    # turns it into 400 captcha_required when captcha is enabled.
    captcha_token = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=2048),
    )

    @pre_load
    def _check_unknown(self, data, **kwargs):
        if not isinstance(data, dict):
            return data
        allowed = {"email", "password", "captcha_token"}
        unknown = set(data.keys()) - allowed
        if unknown:
            raise ValidationError({k: ["Naməlum sahə"] for k in unknown})
        return data


class ChangePasswordSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    current_password = fields.String(required=True)
    new_password = _PasswordField(required=True)

    @pre_load
    def _check_unknown(self, data, **kwargs):
        if not isinstance(data, dict):
            return data
        allowed = {"current_password", "new_password"}
        unknown = set(data.keys()) - allowed
        if unknown:
            raise ValidationError({k: ["Naməlum sahə"] for k in unknown})
        return data


class PasswordResetRequestSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    email = _EmailField(required=True)

    @pre_load
    def _check_unknown(self, data, **kwargs):
        if not isinstance(data, dict):
            return data
        allowed = {"email"}
        unknown = set(data.keys()) - allowed
        if unknown:
            raise ValidationError({k: ["Naməlum sahə"] for k in unknown})
        return data


class PasswordResetConfirmSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    token = fields.String(required=True, validate=validate.Length(min=10, max=200))
    new_password = _PasswordField(required=True)

    @pre_load
    def _check_unknown(self, data, **kwargs):
        if not isinstance(data, dict):
            return data
        allowed = {"token", "new_password"}
        unknown = set(data.keys()) - allowed
        if unknown:
            raise ValidationError({k: ["Naməlum sahə"] for k in unknown})
        return data


class ProfileUpdateSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    name = _NameField(required=False)
    email = _EmailField(required=False)
    current_password = fields.String(required=True, validate=validate.Length(min=8, max=72))
    mfa_code = fields.String(required=False, validate=validate.Regexp(r"^\d{6}$"))

    @pre_load
    def _check_unknown(self, data, **kwargs):
        if isinstance(data, dict):
            allowed = {"name", "email", "current_password", "mfa_code"}
            unknown = set(data) - allowed
            if unknown:
                raise ValidationError({k: ["Naməlum sahə"] for k in unknown})
        return data

    def load(self, *args, **kwargs):  # type: ignore[override]
        data = super().load(*args, **kwargs)
        if not any(key in data for key in ("name", "email")):
            raise ValidationError({"_schema": ["Dəyişdiriləcək profil məlumatı yoxdur"]})
        return data


class ProfileEmailVerifySchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    email = _EmailField(required=True)
    code = fields.String(required=True, validate=validate.Regexp(r"^\d{6}$"))

    @pre_load
    def _check_unknown(self, data, **kwargs):
        if isinstance(data, dict):
            allowed = {"email", "code"}
            unknown = set(data) - allowed
            if unknown:
                raise ValidationError({k: ["Naməlum sahə"] for k in unknown})
        return data


class MfaCodeSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    code = fields.String(required=True, validate=validate.Length(min=6, max=64))

    @pre_load
    def _check_unknown(self, data, **kwargs):
        if isinstance(data, dict) and set(data) - {"code"}:
            raise ValidationError({k: ["Naməlum sahə"] for k in set(data) - {"code"}})
        return data


class MfaEnrollSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    current_password = fields.String(required=True, validate=validate.Length(min=8, max=72))

    @pre_load
    def _check_unknown(self, data, **kwargs):
        if isinstance(data, dict) and set(data) - {"current_password"}:
            raise ValidationError({k: ["Naməlum sahə"] for k in set(data) - {"current_password"}})
        return data


class MfaChallengeSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    challenge_token = fields.String(required=True, validate=validate.Length(min=20, max=128))
    code = fields.String(required=True, validate=validate.Length(min=6, max=64))

    @pre_load
    def _check_unknown(self, data, **kwargs):
        if isinstance(data, dict):
            allowed = {"challenge_token", "code"}
            unknown = set(data) - allowed
            if unknown:
                raise ValidationError({k: ["Naməlum sahə"] for k in unknown})
        return data


class MfaDisableSchema(MfaCodeSchema):
    current_password = fields.String(required=True, validate=validate.Length(min=8, max=72))

    @pre_load
    def _check_unknown(self, data, **kwargs):
        if isinstance(data, dict):
            allowed = {"code", "current_password"}
            unknown = set(data) - allowed
            if unknown:
                raise ValidationError({k: ["Naməlum sahə"] for k in unknown})
        return data


class MfaRecoveryRotateSchema(MfaCodeSchema):
    current_password = fields.String(required=True, validate=validate.Length(min=8, max=72))

    @pre_load
    def _check_unknown(self, data, **kwargs):
        if isinstance(data, dict):
            allowed = {"code", "current_password"}
            unknown = set(data) - allowed
            if unknown:
                raise ValidationError({k: ["Naməlum sahə"] for k in unknown})
        return data


__all__ = [
    "RegisterSchema",
    "LoginSchema",
    "ChangePasswordSchema",
    "PasswordResetRequestSchema",
    "PasswordResetConfirmSchema",
    "ProfileUpdateSchema",
    "ProfileEmailVerifySchema",
    "MfaCodeSchema",
    "MfaEnrollSchema",
    "MfaChallengeSchema",
    "MfaDisableSchema",
    "MfaRecoveryRotateSchema",
    "_validate_password",
    "_validate_email",
    "_validate_name",
]
