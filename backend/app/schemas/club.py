from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ClubCreate(BaseModel):
    """클럽 생성 요청"""

    name: str
    description: Optional[str] = None
    gym_name: Optional[str] = None
    gym_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    has_joining_fee: int = 0
    joining_fee: int = 0
    yearly_fee: int = 0
    monthly_fee: int = 0
    guest_fee: int = 0


class ClubUpdate(BaseModel):
    """클럽 수정 요청"""

    name: Optional[str] = None
    description: Optional[str] = None
    gym_name: Optional[str] = None
    gym_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    has_joining_fee: Optional[int] = None
    joining_fee: Optional[int] = None
    yearly_fee: Optional[int] = None
    monthly_fee: Optional[int] = None
    guest_fee: Optional[int] = None


class ClubResponse(BaseModel):
    """클럽 응답"""

    id: int
    name: str
    description: Optional[str]
    gym_name: Optional[str]
    gym_address: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    has_joining_fee: int
    joining_fee: int
    yearly_fee: int
    monthly_fee: int
    guest_fee: int
    owner_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class FeeCreate(BaseModel):
    """회비 등록 요청"""

    user_id: int
    amount: int
    fee_month: str  # YYYY-MM format
    paid_at: Optional[datetime] = None
    memo: Optional[str] = None


class FeeUpdate(BaseModel):
    """회비 수정 요청"""

    amount: Optional[int] = None
    paid_at: Optional[datetime] = None
    memo: Optional[str] = None


class FeeResponse(BaseModel):
    """회비 응답"""

    id: int
    club_id: int
    user_id: int
    amount: int
    fee_month: datetime
    paid_at: Optional[datetime]
    memo: Optional[str]
    created_by: int
    created_at: datetime

    model_config = {"from_attributes": True}
