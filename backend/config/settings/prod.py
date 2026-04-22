import os
from datetime import timedelta
from django.core.exceptions import ImproperlyConfigured
from loguru import logger
from .base import *

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set in production.")

DEBUG = False

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = False 
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

logger.configure(handlers=[
    {
        "sink": BASE_DIR / "logs/warning.log",
        "level": "WARNING",
        "format": "{time:YYYY-MM-DD HH:mm:ss} | {level:<8} | {name}:{function}:{line} - {message}",
        "rotation": "10 MB",
        "retention": "30 days",
        "compression": "zip",
    },
    {
        "sink": BASE_DIR / "logs/error.log",
        "level": "ERROR",
        "format": "{time:YYYY-MM-DD HH:mm:ss} | {level:<8} | {name}:{function}:{line} - {message}",
        "rotation": "10 MB",
        "retention": "30 days",
        "compression": "zip",
        "backtrace": True,
        "diagnose": False,
    },
])