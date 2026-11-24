from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MemberResponse(BaseModel):
    """클럽 회원 응답"""

    id: int
    club_id: int
    user_id: int
    role: str
    status: str
    joined_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class MemberRoleUpdate(BaseModel):
    """회원 역할 변경 요청"""

    role: str
