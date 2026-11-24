"""RFC 6238 TOTP and encrypted MFA-secret helpers."""
from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import struct
import time

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from flask import current_app


_AAD = b"career-arena:totp-secret:v1"


def generate_totp_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def totp_code(secret: str, timestamp: int | None = None, digits: int = 6) -> str:
    key = base64.b32decode(secret.upper() + "=" * (-len(secret) % 8), casefold=True)
    counter = int((time.time() if timestamp is None else timestamp) // 30)
    digest = hmac.new(key, struct.pack(">Q", counter), hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    binary = struct.unpack(">I", digest[offset : offset + 4])[0] & 0x7FFFFFFF
    return str(binary % (10**digits)).zfill(digits)


def matching_totp_counter(
    secret: str, code: str, timestamp: int | None = None, window: int = 1
) -> int | None:
    if not code.isdigit() or len(code) != 6:
        return None
    now = int(time.time() if timestamp is None else timestamp)
    counter = now // 30
    for candidate in range(counter - window, counter + window + 1):
        expected = totp_code(secret, timestamp=candidate * 30)
        if hmac.compare_digest(expected, code):
            return candidate
    return None


def verify_totp(secret: str, code: str, timestamp: int | None = None, window: int = 1) -> bool:
    return matching_totp_counter(secret, code, timestamp, window) is not None


def _encryption_key() -> bytes:
    configured = str(current_app.config.get("MFA_ENCRYPTION_KEY") or "").strip()
    if configured:
        key = base64.urlsafe_b64decode(configured.encode("ascii"))
        if len(key) != 32:
            raise RuntimeError("MFA_ENCRYPTION_KEY must encode exactly 32 bytes")
        return key
    if current_app.config.get("ENV_NAME") == "production":
        raise RuntimeError("MFA_ENCRYPTION_KEY is required")
    dev_secret = str(current_app.config.get("SECRET_KEY") or "dev-only").encode("utf-8")
    return hmac.new(dev_secret, b"career-arena:totp-encryption:v1", hashlib.sha256).digest()


def encrypt_totp_secret(secret: str) -> str:
    nonce = secrets.token_bytes(12)
    ciphertext = AESGCM(_encryption_key()).encrypt(nonce, secret.encode("ascii"), _AAD)
    return "v1." + base64.urlsafe_b64encode(nonce + ciphertext).decode("ascii")


def decrypt_totp_secret(encrypted: str) -> str:
    try:
        version, payload = encrypted.split(".", 1)
        if version != "v1":
            raise ValueError("Unsupported TOTP secret envelope")
        raw = base64.urlsafe_b64decode(payload.encode("ascii"))
        if len(raw) < 12 + 16:
            raise ValueError("Invalid TOTP secret envelope")
        return AESGCM(_encryption_key()).decrypt(raw[:12], raw[12:], _AAD).decode("ascii")
    except (InvalidTag, UnicodeDecodeError, ValueError) as exc:
        raise ValueError("Unable to decrypt TOTP secret") from exc


def generate_recovery_codes(count: int = 10) -> list[str]:
    return [base64.b32encode(secrets.token_bytes(16)).decode("ascii").rstrip("=") for _ in range(count)]


def hash_recovery_code(code: str) -> str:
    normalized = "".join(code.split()).upper()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

