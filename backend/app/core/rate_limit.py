from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import get_settings


def get_limiter() -> Limiter:
    settings = get_settings()
    return Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit])
