"""Provider-neutral SMTP delivery for verification and account recovery."""
from __future__ import annotations

import logging
import smtplib
import ssl
from email.message import EmailMessage
from urllib.parse import urlencode

from flask import current_app

_log = logging.getLogger(__name__)


class EmailDeliveryError(RuntimeError):
    """SMTP delivery failed; intentionally contains no provider details."""


class EmailService:
    def is_configured(self) -> bool:
        if current_app.config.get("ENV_NAME") == "testing":
            return True
        cfg = current_app.config
        has_login = bool(cfg.get("SMTP_USERNAME"))
        has_password = bool(cfg.get("SMTP_PASSWORD"))
        # Local inboxes such as Mailpit run without TLS or credentials.
        local_inbox = (
            cfg.get("ENV_NAME") == "development"
            and cfg.get("SMTP_HOST") in {"127.0.0.1", "::1"}
            and not has_login
            and not has_password
        )
        return bool(
            cfg.get("SMTP_HOST")
            and cfg.get("SMTP_FROM")
            and (cfg.get("SMTP_USE_SSL") or cfg.get("SMTP_STARTTLS") or local_inbox)
            and (has_login == has_password)
            and (str(cfg.get("SMTP_HOST", "")).lower() != "smtp.gmail.com" or has_login)
        )

    def send_message(self, recipient: str, subject: str, text: str) -> None:
        message = EmailMessage()
        message["From"] = current_app.config["SMTP_FROM"]
        message["To"] = recipient
        message["Subject"] = subject
        message.set_content(text)

        if current_app.config.get("ENV_NAME") == "testing":
            current_app.extensions.setdefault("test_mail_outbox", []).append(message)
            return
        if not self.is_configured():
            raise EmailDeliveryError("E-poçt göndərişi konfiqurasiya edilməyib")

        cfg = current_app.config
        timeout = int(cfg.get("SMTP_TIMEOUT_SECONDS", 10))
        tls_context = ssl.create_default_context()
        server = None
        try:
            if cfg.get("SMTP_USE_SSL"):
                server = smtplib.SMTP_SSL(
                    cfg["SMTP_HOST"], int(cfg["SMTP_PORT"]),
                    timeout=timeout, context=tls_context,
                )
            else:
                server = smtplib.SMTP(
                    cfg["SMTP_HOST"], int(cfg["SMTP_PORT"]), timeout=timeout
                )
                if cfg.get("SMTP_STARTTLS"):
                    server.ehlo()
                    server.starttls(context=tls_context)
                    server.ehlo()
            username, password = cfg.get("SMTP_USERNAME"), cfg.get("SMTP_PASSWORD")
            if username and password:
                server.login(username, password)
            server.send_message(message)
        except Exception as exc:
            _log.error("email delivery failed error_type=%s", type(exc).__name__)
            raise EmailDeliveryError("E-poçt göndərişi uğursuz oldu") from None
        finally:
            if server is not None:
                try:
                    server.quit()
                except Exception:
                    pass

    def send_verification(self, recipient: str, code: str) -> None:
        expires_in = current_app.config.get("OTP_TTL_MIN", 5)
        self.send_message(
            recipient,
            "Career Arena e-poçt təsdiqi",
            f"Career Arena hesabınızı təsdiqləmək üçün bu kodu daxil edin: {code}\n"
            f"Kod {expires_in} dəqiqə ərzində etibarlıdır. "
            "Bu sorğunu siz etməmisinizsə, mesajı nəzərə almayın.",
        )

    def send_password_reset(self, recipient: str, token: str) -> None:
        reset_url = str(current_app.config["FRONTEND_ORIGIN"]).rstrip("/") + "/reset-password#" + urlencode({"token": token})
        self.send_message(
            recipient,
            "Career Arena parolun yenilənməsi",
            "Parolunuzu yeniləmək üçün bu təhlükəsiz keçidi açın:\n"
            f"{reset_url}\nKeçid 30 dəqiqə ərzində etibarlıdır. Bu sorğunu siz etməmisinizsə, mesajı nəzərə almayın.",
        )


email_service = EmailService()

__all__ = ["EmailDeliveryError", "EmailService", "email_service"]
