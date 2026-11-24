from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EventCreate(BaseModel):
    """일정 생성 요청"""

    title: str
    description: Optional[str] = None
    start_dt: datetime
    end_dt: Optional[datetime] = None
    all_day: int = 0
    color: Optional[str] = None
    dday_label: Optional[str] = None
    is_public: int = 1


class EventUpdate(BaseModel):
    """일정 수정 요청"""

    title: Optional[str] = None
    description: Optional[str] = None
    start_dt: Optional[datetime] = None
    end_dt: Optional[datetime] = None
    all_day: Optional[int] = None
    color: Optional[str] = None
    dday_label: Optional[str] = None
    is_public: Optional[int] = None


class EventResponse(BaseModel):
    """일정 응답"""

    id: int
    club_id: Optional[int]
    user_id: int
    title: str
    description: Optional[str]
    start_dt: datetime
    end_dt: Optional[datetime]
    all_day: int
    color: Optional[str]
    dday_label: Optional[str]
    is_public: int
    created_at: datetime

    model_config = {"from_attributes": True}
