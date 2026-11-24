from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PhotoResponse(BaseModel):
    """사진 응답"""

    id: int
    club_id: int
    uploader_id: int
    file_name: str
    file_url: str
    file_size: Optional[int]
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


class VideoGenerateRequest(BaseModel):
    """영상 생성 요청"""

    title: Optional[str] = None
    photo_ids: List[int]
    bgm_name: Optional[str] = None
    bgm_url: Optional[str] = None
    transition: str = "fade"
    duration_per_photo: int = 3


class VideoResponse(BaseModel):
    """영상 응답"""

    id: int
    club_id: int
    title: Optional[str]
    video_url: Optional[str]
    bgm_name: Optional[str]
    bgm_url: Optional[str]
    photo_ids: Optional[list]
    transition: Optional[str]
    duration: Optional[int]
    status: str
    created_by: int
    created_at: datetime

    model_config = {"from_attributes": True}


class BGMItem(BaseModel):
    """BGM 음원 항목"""

    name: str
    url: str
    duration: Optional[int] = None
