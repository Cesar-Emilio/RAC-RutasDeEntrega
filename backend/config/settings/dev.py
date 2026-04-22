import os
from datetime import timedelta
from .base import *

DEBUG = True

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
}

DATABASES["default"].update({
    "NAME": os.getenv("DB_NAME", "rac_db"),
    "USER": os.getenv("DB_USER", "root"),
    "PASSWORD": os.getenv("DB_PASSWORD", "root"),
    "HOST": os.getenv("DB_HOST", "127.0.0.1"),
    "PORT": os.getenv("DB_PORT", "3306"),
})