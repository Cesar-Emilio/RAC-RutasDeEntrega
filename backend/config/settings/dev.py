import os

from .base import *

DEBUG = True

# Local development defaults (no .env required). Can be overridden via env vars.
DATABASES["default"].update(
	{
		"NAME": os.getenv("DB_NAME", "rac_db"),
		"USER": os.getenv("DB_USER", "root"),
		"PASSWORD": os.getenv("DB_PASSWORD", "root"),
		"HOST": os.getenv("DB_HOST", "127.0.0.1"),
		"PORT": os.getenv("DB_PORT", "3306"),
	}
)
