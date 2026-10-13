"""Supabase JWT verification via JWKS, exposed as FastAPI dependencies.

Python counterpart of @supabase/server's `auth: 'user'` mode. Tokens are verified
against the project's public signing keys, so no JWT secret is needed here.
"""
import logging
from functools import lru_cache
from typing import Annotated

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from pydantic import BaseModel

from .config import get_settings
from .errors import AppError

logger = logging.getLogger("mccms.security")

# auto_error=False so a missing header goes through our envelope handler (401).
_bearer = HTTPBearer(auto_error=False)

# Supabase signs with ES256 (default) or RS256. HS256 is deliberately excluded.
_ALGORITHMS = ["ES256", "RS256"]


class AuthUser(BaseModel):
    id: str
    email: str | None = None
    role: str | None = None
    claims: dict


@lru_cache
def get_jwks_client() -> PyJWKClient:
    # Keys are cached in-process (default 5 minutes lifespan) and refreshed on rotation.
    return PyJWKClient(get_settings().supabase_jwks_url, cache_keys=True, timeout=5)


def _unauthenticated(message: str) -> AppError:
    return AppError(401, "UNAUTHENTICATED", message)


def verify_token(token: str) -> dict:
    settings = get_settings()
    try:
        signing_key = get_jwks_client().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=_ALGORITHMS,
            audience=settings.supabase_jwt_audience,
            issuer=settings.supabase_issuer,
            options={"require": ["exp", "sub", "aud", "iss"]},
        )
    except jwt.ExpiredSignatureError:
        raise _unauthenticated("Token has expired")
    except jwt.PyJWKClientConnectionError as exc:
        logger.error("Could not fetch JWKS: %s", exc)
        raise AppError(503, "AUTH_UNAVAILABLE", "Authentication service is unavailable")
    except jwt.PyJWTError as exc:
        logger.info("Rejected token: %s", exc)
        raise _unauthenticated("Invalid authentication token")


def get_current_user(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> AuthUser:
    """Dependency: require a valid Supabase user JWT."""
    if creds is None or not creds.credentials:
        raise _unauthenticated("Missing bearer token")
    claims = verify_token(creds.credentials)
    return AuthUser(
        id=claims["sub"],
        email=claims.get("email"),
        role=claims.get("role"),
        claims=claims,
    )


CurrentUser = Annotated[AuthUser, Depends(get_current_user)]
