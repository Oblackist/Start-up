"""WSGI entry point for the private API behind the direct Compose Caddy hop."""
from werkzeug.middleware.proxy_fix import ProxyFix

from wsgi import application

application.wsgi_app = ProxyFix(application.wsgi_app, x_for=1, x_proto=1)
