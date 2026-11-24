"""Bounded legacy image challenges; login protection uses Turnstile separately."""
import hmac
import io
import secrets
import string
import threading
import time
import uuid
from collections import OrderedDict

from captcha.image import ImageCaptcha

CAPTCHA_TTL_SECONDS = 300
MAX_CAPTCHA_ENTRIES = 1024
captcha_store = OrderedDict()
_store_lock = threading.Lock()


def generate_random_code(length=5):
    characters = "".join(c for c in string.ascii_uppercase + string.digits if c not in "0O1I")
    return "".join(secrets.choice(characters) for _ in range(length))


def create_captcha():
    code = generate_random_code()
    key = str(uuid.uuid4())
    raw = ImageCaptcha(width=160, height=60).generate(code)
    image = io.BytesIO(raw.read() if hasattr(raw, "read") else raw)
    with _store_lock:
        now = time.monotonic()
        expired = [stored_key for stored_key, (_, expiry) in captcha_store.items() if expiry <= now]
        for stored_key in expired:
            del captcha_store[stored_key]
        while len(captcha_store) >= MAX_CAPTCHA_ENTRIES:
            captcha_store.popitem(last=False)
        captcha_store[key] = (code.upper(), now + CAPTCHA_TTL_SECONDS)
    return key, image


def verify_captcha(captcha_key: str, user_input: str) -> bool:
    if not captcha_key or not user_input:
        return False
    with _store_lock:
        stored = captcha_store.pop(captcha_key, None)
    if stored is None:
        return False
    code, expiry = stored
    return time.monotonic() < expiry and hmac.compare_digest(
        code.encode("ascii"), user_input.strip().upper().encode("utf-8")
    )
