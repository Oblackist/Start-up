FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN python -m pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY migrations ./migrations
COPY scripts/init_db.py scripts/seed.py ./scripts/
COPY wsgi.py wsgi_caddy.py ./

USER 10001:10001
EXPOSE 5000
CMD ["gunicorn", "--workers", "2", "--bind", "0.0.0.0:5000", "--forwarded-allow-ips=", "wsgi_caddy:application"]
