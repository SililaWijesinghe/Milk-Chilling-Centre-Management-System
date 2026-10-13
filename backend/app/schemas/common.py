"""Standard response envelope (see docs/architecture.md section 2.2)."""
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ErrorBody(BaseModel):
    code: str
    message: str


class Envelope(BaseModel, Generic[T]):
    success: bool
    data: T | None = None
    error: ErrorBody | None = None


def ok(data: T | None = None) -> Envelope[T]:
    return Envelope(success=True, data=data, error=None)


def fail(code: str, message: str) -> Envelope[None]:
    return Envelope(success=False, data=None, error=ErrorBody(code=code, message=message))
