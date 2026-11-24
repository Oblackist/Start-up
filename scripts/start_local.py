"""Start the local Career Arena preview from the extracted package."""

import argparse
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
LOOPBACK = "127.0.0.1"


def local_port(preferred):
    with socket.socket() as listener:
        try:
            listener.bind((LOOPBACK, preferred))
        except OSError:
            listener.bind((LOOPBACK, 0))
        return listener.getsockname()[1]


def python_environment():
    home = ROOT / ".venv"
    executable = home / "Scripts" / "python.exe"
    existing = ROOT.parent / "venv" / "Scripts" / "python.exe"
    if not executable.is_file():
        if existing.is_file():
            executable = existing
        else:
            subprocess.run([sys.executable, "-m", "venv", str(home)], check=True)
    check = subprocess.run(
        [str(executable), "-c",
         "import flask, flask_sqlalchemy, flask_migrate, flask_cors, marshmallow, dotenv, argon2, cryptography, email_validator, redis, psycopg, PIL, captcha"],
        capture_output=True,
    )
    if check.returncode:
        subprocess.run([executable, "-m", "pip", "install", "-r", BACKEND / "requirements.txt"], check=True)
    return executable


def select_gmail(python, dotenv_path, requested=None):
    if requested is False:
        return False
    # Inspect settings in the backend interpreter. Return a status only.
    check_settings = """
import os
import sys
from dotenv import dotenv_values

cfg = {**dotenv_values(sys.argv[1]), **os.environ}
host = (cfg.get("SMTP_HOST") or "").strip().lower()
sender = (cfg.get("SMTP_FROM") or "").strip()
user = (cfg.get("SMTP_USERNAME") or "").strip()
password = (cfg.get("SMTP_PASSWORD") or "").strip()
gmail_configured = host == "smtp.gmail.com" or not host and user.lower().endswith("@gmail.com")
if not gmail_configured and sys.argv[2] != "explicit":
    sys.exit(0)
sys.exit(10 if sender and user and password else 11)
"""
    check = subprocess.run(
        [python, "-c", check_settings, str(dotenv_path), "explicit" if requested else "auto"],
        capture_output=True,
    )
    if check.returncode == 11:
        raise RuntimeError("Gmail SMTP: set SMTP_FROM, SMTP_USERNAME and SMTP_PASSWORD in backend/.env.")
    if check.returncode not in (0, 10):
        raise RuntimeError("Could not read mail settings from backend/.env.")
    return check.returncode == 10


def wait_ready(url, child):
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if child.poll() is not None:
            raise RuntimeError(f"Server exited before {url} became ready.")
        try:
            with urllib.request.urlopen(url, timeout=1):
                return
        except (urllib.error.URLError, TimeoutError):
            time.sleep(0.25)
    raise RuntimeError(f"Server did not respond at {url} within 30 seconds.")


def mail_environment(use_gmail, inbox_port=None, smtp_port=None):
    env = dict(os.environ)
    env.pop("CAREER_INBOX_HTTP_PORT", None)
    if use_gmail:
        # Flask reads the sender and credentials from backend/.env.
        env.update(SMTP_HOST="smtp.gmail.com", SMTP_PORT="587",
                   SMTP_STARTTLS="true", SMTP_USE_SSL="false")
    else:
        env.update(SMTP_HOST=LOOPBACK, SMTP_PORT=str(smtp_port), SMTP_FROM="noreply@example.com",
                   SMTP_USERNAME="", SMTP_PASSWORD="", SMTP_STARTTLS="false", SMTP_USE_SSL="false",
                   SMTP_TIMEOUT_SECONDS="5", CAREER_INBOX_HTTP_PORT=str(inbox_port))
    return env


def initialize_database(python, database, env):
    if database.is_file():
        return

    database.parent.mkdir(parents=True, exist_ok=True)
    print("Hazırlanır: yerli baza və sual bankı...", flush=True)
    with tempfile.TemporaryDirectory(prefix="career-arena-init-", dir=database.parent) as temp:
        pending = Path(temp) / "app.db"
        setup_env = {**env, "FLASK_DATABASE_URL": f"sqlite:///{pending.as_posix()}"}
        subprocess.run([python, "-B", "scripts/init_db.py"], cwd=BACKEND, env=setup_env, check=True)
        subprocess.run([python, "-B", "scripts/replace_question_bank.py", "--replace"],
                       cwd=BACKEND, env=setup_env, check=True)
        try:
            # Windows rename keeps any database created by another launcher.
            pending.rename(database)
        except FileExistsError:
            pass


def main(mail_mode=None):
    database = BACKEND / "instance" / "app.db"
    node = shutil.which("node")
    npm = shutil.which("npm.cmd")
    if not node or not npm:
        raise RuntimeError("Install Node.js and reopen this terminal.")
    python = python_environment()
    use_gmail = select_gmail(python, BACKEND / ".env", mail_mode)
    if not use_gmail and subprocess.run(
        [python, "-c", "import aiosmtpd"], capture_output=True,
    ).returncode:
        subprocess.run([python, "-m", "pip", "install", "-r",
                        ROOT / "scripts/requirements-local-mail.txt"], check=True)
    vite = FRONTEND / "node_modules/vite/bin/vite.js"
    if not vite.is_file():
        subprocess.run([npm, "ci"], cwd=FRONTEND, check=True)

    frontend_port, backend_port = local_port(5180), local_port(5010)
    inbox_port, smtp_port = (None, None) if use_gmail else (local_port(8026), local_port(1026))
    site = f"http://{LOOPBACK}:{frontend_port}"
    api = f"http://{LOOPBACK}:{backend_port}"
    env = mail_environment(use_gmail, inbox_port, smtp_port)
    env.update(FLASK_ENV="development", FRONTEND_ORIGIN=site,
               FLASK_DATABASE_URL=f"sqlite:///{database.as_posix()}", PORT=str(backend_port),
               CAREER_LOCAL_API_PORT=str(backend_port), VITE_API_URL="", PYTHONUTF8="1")

    initialize_database(python, database, env)
    children = []
    try:
        if not use_gmail:
            inbox = f"http://{LOOPBACK}:{inbox_port}"
            mail = subprocess.Popen([python, "-B", ROOT / "scripts/career_arena_local_mail.py"],
                                    cwd=ROOT, env=env)
            children.append(mail)
            wait_ready(inbox, mail)
        backend = subprocess.Popen([python, "-B", "run.py"], cwd=BACKEND, env=env)
        children.append(backend)
        wait_ready(f"{api}/api/v1/subjects", backend)
        frontend = subprocess.Popen(
            [node, vite, "--host", LOOPBACK, "--port", str(frontend_port), "--strictPort"],
            cwd=FRONTEND, env={key: value for key, value in env.items() if not key.startswith("SMTP_")},
        )
        children.append(frontend)
        wait_ready(f"{site}/", frontend)
        wait_ready(f"{site}/api/v1/subjects", frontend)
        mail_status = "Verification mail: Gmail SMTP" if use_gmail else f"Verification inbox: {inbox}/"
        print(f"\nCareer Arena: {site}/\nLogin: {site}/login\n"
              f"Registration: {site}/register\n{mail_status}", flush=True)
        print("Keep this window open. Press Ctrl+C to stop.", flush=True)
        while all(child.poll() is None for child in children):
            time.sleep(0.5)
        raise RuntimeError("A local service stopped. See the terminal output.")
    finally:
        for child in reversed(children):
            if child.poll() is None:
                child.terminate()
        for child in reversed(children):
            child.wait()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    mail_options = parser.add_mutually_exclusive_group()
    mail_options.add_argument("--gmail", dest="mail_mode", action="store_true",
                              help="Use Gmail SMTP credentials from backend/.env")
    mail_options.add_argument("--local-mail", dest="mail_mode", action="store_false",
                              help="Use the local verification inbox")
    parser.set_defaults(mail_mode=None)
    args = parser.parse_args()
    try:
        main(mail_mode=args.mail_mode)
    except KeyboardInterrupt:
        pass
    except (OSError, RuntimeError, subprocess.CalledProcessError) as error:
        print(error, file=sys.stderr)
        raise SystemExit(1)
