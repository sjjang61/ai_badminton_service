from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NoticeCreate(BaseModel):
    """공지사항 생성 요청"""

    title: str
    content: str
    is_pinned: int = 0


class NoticeUpdate(BaseModel):
    """공지사항 수정 요청"""

    title: Optional[str] = None
    content: Optional[str] = None
    is_pinned: Optional[int] = None


class NoticeResponse(BaseModel):
    """공지사항 응답"""

    id: int
    club_id: Optional[int]
    title: str
    content: str
    is_pinned: int
    scope: str
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}
