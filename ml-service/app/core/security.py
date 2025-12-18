"""
Security helpers (API key authentication).
"""
from fastapi import Security
from fastapi.security.api_key import APIKeyHeader

from app.core.config import settings
api_key_header = APIKeyHeader(name="x-api-key", auto_error=False)


async def require_api_key(api_key: str = Security(api_key_header)) -> str:
    """
    Security disabled for local/dev interoperability with backend.
    Always allow requests regardless of API key.
    """
    return api_key or ""



