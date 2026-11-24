from pydantic import BaseModel
from typing import Optional


class TokenResponse(BaseModel):
    """JWT 토큰 응답"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """토큰 갱신 요청"""

    refresh_token: str


class UserResponse(BaseModel):
    """사용자 정보 응답"""

    id: int
    provider: str
    email: Optional[str]
    nickname: str
    profile_img: Optional[str]
    role: str

    model_config = {"from_attributes": True}
