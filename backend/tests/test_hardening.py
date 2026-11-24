"""Targeted regression checks for public security-sensitive routes."""
from __future__ import annotations

import unittest
import io
import sys
import types
from contextlib import redirect_stdout
from unittest.mock import patch

# Keep this route-error test independent of the optional image renderer.
if "captcha.image" not in sys.modules:
    captcha_pkg = types.ModuleType("captcha")
    captcha_image = types.ModuleType("captcha.image")
    captcha_image.ImageCaptcha = object
    captcha_pkg.image = captcha_image
    sys.modules["captcha"] = captcha_pkg
    sys.modules["captcha.image"] = captcha_image

from app import create_app
from app.config import TestingConfig
from app.extensions import db


class CaptchaErrorSanitizationTests(unittest.TestCase):
    def setUp(self):
        cfg = TestingConfig()
        cfg.SQLALCHEMY_DATABASE_URI = "sqlite://"
        self.app = create_app(config_object=cfg)
        self.app.config["TESTING"] = False
        with self.app.app_context():
            db.create_all()
        self.client = self.app.test_client()
        from app.security.rate_limit import limiter
        limiter.clear_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_captcha_generation_error_does_not_leak_exception(self):
        secret_detail = "database path C:/private/secret.db"
        with patch("app.routes.captcha_routes.create_captcha", side_effect=RuntimeError(secret_detail)):
            output = io.StringIO()
            with redirect_stdout(output):
                response = self.client.get("/api/v1/captcha/generate")

        self.assertEqual(response.status_code, 500)
        self.assertNotIn(secret_detail, response.get_data(as_text=True))
        self.assertNotIn(secret_detail, output.getvalue())
        self.assertEqual(response.get_json()["error"]["message"], "Daxili server xətası")

    def test_captcha_generation_is_rate_limited(self):
        import io

        self.app.config["RATE_LIMIT_CAPTCHA_GENERATE_MAX"] = 1
        with patch("app.routes.captcha_routes.create_captcha", return_value=("key", io.BytesIO(b"png"))):
            first = self.client.get("/api/v1/captcha/generate")
            second = self.client.get("/api/v1/captcha/generate")

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 429)
        self.assertEqual(second.get_json()["error"]["code"], "rate_limited")


if __name__ == "__main__":
    unittest.main()
