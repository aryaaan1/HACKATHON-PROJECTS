"""Authentication: password hashing and JWT bearer tokens.

Deliberately built on the standard library only (hashlib/hmac/base64/json) —
no new dependency is needed for either PBKDF2 password hashing or HS256 JWTs,
which keeps this a minimal addition to the existing FastAPI + SQLite stack.
"""
import base64
import hashlib
import hmac
import json
import os
import time
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# --- Password hashing (PBKDF2-HMAC-SHA256 with a random per-password salt) ---

_HASH_ALGORITHM = "pbkdf2_sha256"
_HASH_ITERATIONS = 260_000
_SALT_BYTES = 16


def hash_password(password: str) -> str:
    salt = os.urandom(_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _HASH_ITERATIONS)
    return f"{_HASH_ALGORITHM}${_HASH_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = stored_hash.split("$")
        if algorithm != _HASH_ALGORITHM:
            return False
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
    except (ValueError, AttributeError):
        return False
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, int(iterations))
    return hmac.compare_digest(actual, expected)


# --- Minimal HS256 JWT ---

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-only-insecure-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_SECONDS = 8 * 60 * 60  # 8 hours


class TokenError(Exception):
    pass


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_access_token(username: str, role: str) -> str:
    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
    payload = {"sub": username, "role": role, "exp": int(time.time()) + JWT_EXPIRY_SECONDS}
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    signature = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    return f"{header_b64}.{payload_b64}.{_b64url_encode(signature)}"


def decode_access_token(token: str) -> dict:
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
    except ValueError:
        raise TokenError("Malformed token")

    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    expected_signature = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    try:
        actual_signature = _b64url_decode(signature_b64)
    except Exception:
        raise TokenError("Malformed token signature")

    if not hmac.compare_digest(expected_signature, actual_signature):
        raise TokenError("Invalid token signature")

    try:
        payload = json.loads(_b64url_decode(payload_b64))
    except Exception:
        raise TokenError("Malformed token payload")

    if payload.get("exp", 0) < time.time():
        raise TokenError("Token expired")

    return payload


# --- FastAPI dependencies ---

_bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser:
    def __init__(self, username: str, role: str):
        self.username = username
        self.role = role


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_access_token(credentials.credentials)
    except TokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return CurrentUser(username=payload["sub"], role=payload["role"])


def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return user
