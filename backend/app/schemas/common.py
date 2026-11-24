from pydantic import BaseModel
from typing import Any, Optional


class SuccessResponse(BaseModel):
    """단일 응답 포맷"""

    success: bool = True
    data: Any = None
    message: str = "ok"


class PaginationInfo(BaseModel):
    """페이지네이션 정보"""

    page: int
    size: int
    total: int


class PaginatedResponse(BaseModel):
    """페이지네이션 응답 포맷"""

    success: bool = True
    data: Any = None
    message: str = "ok"
    pagination: PaginationInfo


class ErrorDetail(BaseModel):
    """에러 상세 정보"""

    code: str
    message: str


class ErrorResponse(BaseModel):
    """에러 응답 포맷"""

    success: bool = False
    error: ErrorDetail
