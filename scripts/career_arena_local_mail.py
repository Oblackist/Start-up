"""Private local SMTP inbox for the Career Arena development preview."""

from collections import deque
from email import policy
from email.parser import BytesParser
from html import escape
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import os
from threading import Lock
from time import monotonic

from aiosmtpd.controller import Controller

messages = deque(maxlen=50)
lock = Lock()
http_port = int(os.environ.get("CAREER_INBOX_HTTP_PORT", "8025"))
smtp_port = int(os.environ.get("SMTP_PORT", "1025"))


class Mailbox:
    async def handle_DATA(self, server, session, envelope):
        message = BytesParser(policy=policy.default).parsebytes(envelope.content)
        body = message.get_body(preferencelist=("plain",))
        text = body.get_content() if body else ""
        entry = (monotonic(), ", ".join(envelope.rcpt_tos), str(message.get("Subject", "")), text)
        with lock:
            messages.appendleft(entry)
        return "250 Message stored"


class InboxPage(BaseHTTPRequestHandler):
    def do_GET(self):
        if (
            self.path != "/"
            or self.headers.get("Host") != f"127.0.0.1:{http_port}"
            or self.headers.get("Sec-Fetch-Site") == "cross-site"
        ):
            self.send_error(403)
            return
        with lock:
            recent = [row for row in messages if monotonic() - row[0] < 900]
        body = "".join(
            f"<article><h2>{escape(subject)}</h2><p>Kimə: {escape(recipient)}</p>"
            f"<pre>{escape(text)}</pre></article>"
            for _, recipient, subject, text in recent
        ) or "<p>Poçt qutusu boşdur. Qeydiyyatdan sonra bu səhifəni yenilə.</p>"
        page = (
            '<!doctype html><html lang="az"><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width, initial-scale=1">'
            '<title>Career Arena · Lokal poçt</title>'
            '<style>body{font:16px system-ui;background:#f5f7f6;color:#172725;'
            'max-width:720px;margin:42px auto;padding:0 18px}article{background:white;'
            'padding:16px 22px;border-radius:12px;margin:16px 0}pre{white-space:pre-wrap}</style>'
            f'<h1>Career Arena · Lokal poçt</h1>{body}</html>'
        ).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(page)


if __name__ == "__main__":
    with ThreadingHTTPServer(("127.0.0.1", http_port), InboxPage) as http:
        smtp = Controller(Mailbox(), hostname="127.0.0.1", port=smtp_port, data_size_limit=131072)
        smtp.start()
        print(f"Local inbox: http://127.0.0.1:{http_port}/", flush=True)
        try:
            http.serve_forever()
        finally:
            smtp.stop()
