import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv
import dj_database_url

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-dev-only-change-in-production")

DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]

# Add Render.com domains
if os.getenv("RENDER"):
    ALLOWED_HOSTS.append(".onrender.com")

INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "channels",
    "debug_toolbar",
    "django_redis",
    "apps.accounts",
    "apps.academics",
    "apps.learning",
    "apps.grading",
    "apps.attendance",
    "apps.communications",
    "apps.enrollment",
    "apps.system",
    "apps.core",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Add Whitenoise for static files
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "config.middleware.RateLimitMiddleware",
    "config.middleware.SecurityHeadersMiddleware",
]

# Django Debug Toolbar (only in development)
if DEBUG:
    MIDDLEWARE.insert(0, "debug_toolbar.middleware.DebugToolbarMiddleware")

ROOT_URLCONF = "config.urls"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        # Use explicit loaders with caching in production — faster than APP_DIRS=True
        "APP_DIRS": DEBUG,  # True in dev (auto-discovery), False in prod
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
            # In production, use cached template loader to skip disk reads
            **({"loaders": [
                ("django.template.loaders.cached.Loader", [
                    "django.template.loaders.app_directories.Loader",
                ]),
            ]} if not DEBUG else {}),
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database configuration - PostgreSQL for production, SQLite for development
if os.getenv("DATABASE_URL"):
    # Production: Use Supabase PostgreSQL
    # conn_max_age=600: reuse connections for 10 min (avoids new TCP handshake per request)
    # conn_health_checks=False: skip the extra SELECT 1 on every reused connection
    DATABASES = {
        "default": dj_database_url.config(
            default=os.getenv("DATABASE_URL"),
            conn_max_age=600,
            conn_health_checks=False,
        )
    }
    # Supabase requires SSL
    DATABASES["default"]["OPTIONS"] = {"sslmode": "require"}
else:
    # Development: Use SQLite
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Manila"
USE_I18N = True
USE_TZ = True

# Static files configuration
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Whitenoise configuration for serving static files
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Media files configuration
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "accounts.User"

AUTHENTICATION_BACKENDS = [
    "apps.accounts.backends.EmailBackend",
    "django.contrib.auth.backends.ModelBackend",
]

# Redis Configuration (for Channels/WebSockets only)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CHANNEL_REDIS_URL = os.getenv("CHANNEL_REDIS_URL") or (
    os.getenv("REDIS_URL") if os.getenv("REDIS_URL") and os.getenv("RENDER") else None
)

# Cache configuration
# LocMem cache: zero DB queries, sub-millisecond, perfect for Render free tier.
# Each gunicorn worker has its own cache — fine for rate limiting since limits
# are per-worker anyway on the free single-instance plan.
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'knhs-cache',
    }
}

# Session Configuration with Redis
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"
SESSION_COOKIE_AGE = 8 * 60 * 60  # 8 hours
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = "None" if not DEBUG else "Lax"
SESSION_SAVE_EVERY_REQUEST = False

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

# CSRF trusted origins for production
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CSRF_TRUSTED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

# Security settings for production
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Cache configuration
# LocMem cache: zero DB queries, sub-millisecond, perfect for Render free tier.
# Each gunicorn worker has its own cache — fine for rate limiting since limits
# are per-worker anyway on the free single-instance plan.
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'knhs-cache',
    }
}

# Use Redis for production (Render with Upstash), InMemory for local development
if os.getenv("REDIS_URL"):
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [os.getenv("REDIS_URL")],
            },
        },
    }
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer",
        }
    }

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "10000/day",
        "user": "50000/day",
        "sensitive": "5/minute",
        "burst": "60/minute",
        "sustained": "1000/hour",
        "unlock": "5/hour",
        "lock": "10/hour",
    },
    "EXCEPTION_HANDLER": "apps.system.exceptions.custom_exception_handler",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,  # Increased from 20 → reduces number of paginated API calls on list pages
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
}

# Rate Limiting with Redis
RATELIMIT_USE_CACHE = "default"
RATELIMIT_ENABLE = True

JWT_ACCESS_MINUTES = int(os.getenv("JWT_ACCESS_MINUTES", "15"))
JWT_REFRESH_DAYS = int(os.getenv("JWT_REFRESH_DAYS", "7"))

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=JWT_ACCESS_MINUTES),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=JWT_REFRESH_DAYS),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

REFRESH_TOKEN_COOKIE_NAME = "knhs_refresh_token"
REFRESH_TOKEN_COOKIE_SECURE = not DEBUG
REFRESH_TOKEN_COOKIE_HTTPONLY = True
REFRESH_TOKEN_COOKIE_SAMESITE = "None" if not DEBUG else "Lax"  # Allow cross-site cookies in production

REFRESH_TOKEN_COOKIE_SAMESITE = "None" if not DEBUG else "Lax"

# ── Performance & Logging ──────────────────────────────────────────────────

# Extend JWT access token to 60 minutes to reduce token refresh overhead.
# Each refresh requires a DB write (blacklist) + read — costly on cold starts.
# 60 min is still safe for a school portal with trusted devices.
JWT_ACCESS_MINUTES = int(os.getenv("JWT_ACCESS_MINUTES", "60"))

# Production logging — errors only to avoid log I/O overhead
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING" if not DEBUG else "DEBUG",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "WARNING" if not DEBUG else "INFO",
            "propagate": False,
        },
        "django.db.backends": {
            # Set to DEBUG locally to see queries; WARNING in production
            "level": "WARNING",
            "handlers": ["console"],
            "propagate": False,
        },
    },
}

# Whitenoise caching headers — serve static files with long cache TTL
# so browsers don't re-download CSS/JS on every page load
WHITENOISE_MAX_AGE = 31536000  # 1 year (files are content-hashed so this is safe)

# Django Debug Toolbar settings
if DEBUG:
    INTERNAL_IPS = [
        "127.0.0.1",
        "localhost",
    ]
    # Allow debug toolbar in development
    DEBUG_TOOLBAR_CONFIG = {
        "SHOW_COLLAPSED": True,
        "SHOW_TEMPLATE_CONTEXT": True,
    }

# ── PostHog Analytics ─────────────────────────────────────────────────────
POSTHOG_PROJECT_ID = os.getenv("POSTHOG_PROJECT_ID", "")
POSTHOG_HOST = os.getenv("POSTHOG_HOST", "https://app.posthog.com")
POSTHOG_ENABLED = bool(POSTHOG_PROJECT_ID) and not DEBUG

# ── Sentry Error Tracking ───────────────────────────────────────────────────
SENTRY_DSN = os.getenv("SENTRY_DSN", "https://7b7c9f503ba019e228dcb455306de390@o4511519493193728.ingest.us.sentry.io/4511519565414400")
SENTRY_ENABLED = bool(SENTRY_DSN) and not DEBUG

if SENTRY_ENABLED:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,  # 10% of transactions for performance monitoring
        profiles_sample_rate=0.1,  # 10% of profiles for performance monitoring
        environment=os.getenv("SENTRY_ENVIRONMENT", "production"),
        send_default_pii=True,  # Send request headers and IP for users
    )
