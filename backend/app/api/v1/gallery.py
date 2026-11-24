from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid
import io
from app.db.session import get_db
from app.db.models.gallery import GalleryPhoto, GalleryVideo
from app.db.models.member import ClubMember
from app.db.models.user import User
from app.core.dependencies import get_current_user, require_club_admin, require_club_member
from app.core.config import settings
from app.schemas.gallery import PhotoResponse, VideoGenerateRequest, VideoResponse, BGMItem

router = APIRouter()

# 무료 BGM 목록 (정적 관리 - 향후 외부 API 연동 가능)
BGM_LIST = [
    BGMItem(name="Upbeat Morning", url="/bgm/upbeat_morning.mp3", duration=180),
    BGMItem(name="Gentle Piano", url="/bgm/gentle_piano.mp3", duration=200),
    BGMItem(name="Sports Energy", url="/bgm/sports_energy.mp3", duration=150),
    BGMItem(name="Relaxing Sunset", url="/bgm/relaxing_sunset.mp3", duration=210),
    BGMItem(name="Victory March", url="/bgm/victory_march.mp3", duration=160),
]


def get_minio_client():
    """MinIO 클라이언트 생성"""
    from minio import Minio

    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )


@router.get("/clubs/{club_id}/photos")
async def list_photos(
    club_id: int,
    _: ClubMember = Depends(require_club_member),
    db: AsyncSession = Depends(get_db),
):
    """사진 목록 조회"""
    result = await db.execute(
        select(GalleryPhoto)
        .where(GalleryPhoto.club_id == club_id, GalleryPhoto.is_deleted == 0)
        .order_by(GalleryPhoto.sort_order, GalleryPhoto.created_at.desc())
    )
    photos = result.scalars().all()
    return {
        "success": True,
        "data": [PhotoResponse.model_validate(p) for p in photos],
    }


@router.post("/clubs/{club_id}/photos")
async def upload_photo(
    club_id: int,
    file: UploadFile = File(...),
    _: ClubMember = Depends(require_club_member),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """사진 업로드 (Multipart) - MinIO 저장"""
    # 이미지 파일 검증
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            400,
            detail={
                "code": "PHOTO_UPLOAD_FAILED",
                "message": "이미지 파일만 업로드 가능합니다.",
            },
        )

    contents = await file.read()
    file_size = len(contents)
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    object_name = f"clubs/{club_id}/{uuid.uuid4()}.{ext}"

    try:
        minio = get_minio_client()
        # 버킷 존재 확인 및 생성
        if not minio.bucket_exists(settings.MINIO_BUCKET_PHOTOS):
            minio.make_bucket(settings.MINIO_BUCKET_PHOTOS)
        minio.put_object(
            settings.MINIO_BUCKET_PHOTOS,
            object_name,
            io.BytesIO(contents),
            length=file_size,
            content_type=file.content_type,
        )
        file_url = (
            f"http://{settings.MINIO_ENDPOINT}"
            f"/{settings.MINIO_BUCKET_PHOTOS}/{object_name}"
        )
    except Exception as e:
        raise HTTPException(
            500,
            detail={
                "code": "PHOTO_UPLOAD_FAILED",
                "message": f"업로드 실패: {str(e)}",
            },
        )

    photo = GalleryPhoto(
        club_id=club_id,
        uploader_id=current_user.id,
        file_name=file.filename or object_name,
        file_url=file_url,
        file_size=file_size,
    )
    db.add(photo)
    await db.flush()
    await db.refresh(photo)
    return {"success": True, "data": PhotoResponse.model_validate(photo)}


@router.delete("/clubs/{club_id}/photos/{photo_id}")
async def delete_photo(
    club_id: int,
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """사진 삭제 (soft delete - 관리자 또는 업로더)"""
    result = await db.execute(
        select(GalleryPhoto).where(
            GalleryPhoto.id == photo_id,
            GalleryPhoto.club_id == club_id,
            GalleryPhoto.is_deleted == 0,
        )
    )
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(
            404,
            detail={"code": "PHOTO_NOT_FOUND", "message": "사진을 찾을 수 없습니다."},
        )

    # 업로더 또는 관리자만 삭제 가능
    if photo.uploader_id != current_user.id:
        from app.db.models.member import ClubMember
        member_result = await db.execute(
            select(ClubMember).where(
                ClubMember.club_id == club_id,
                ClubMember.user_id == current_user.id,
                ClubMember.is_deleted == 0,
                ClubMember.status == "approved",
                ClubMember.role == "admin",
            )
        )
        if not member_result.scalar_one_or_none():
            raise HTTPException(
                403,
                detail={
                    "code": "AUTH_UNAUTHORIZED",
                    "message": "사진 삭제 권한이 없습니다.",
                },
            )

    photo.is_deleted = 1
    return {"success": True, "message": "사진이 삭제되었습니다."}


@router.post("/clubs/{club_id}/videos/generate")
async def generate_video(
    club_id: int,
    body: VideoGenerateRequest,
    _: ClubMember = Depends(require_club_member),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """영상 생성 요청 - Celery 비동기 태스크로 처리"""
    # photo_ids 유효성 확인
    if not body.photo_ids:
        raise HTTPException(
            400,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "사진을 1장 이상 선택해주세요.",
            },
        )

    total_duration = len(body.photo_ids) * body.duration_per_photo
    video = GalleryVideo(
        club_id=club_id,
        title=body.title,
        bgm_name=body.bgm_name,
        bgm_url=body.bgm_url,
        photo_ids=body.photo_ids,
        transition=body.transition,
        duration=total_duration,
        status="pending",
        created_by=current_user.id,
    )
    db.add(video)
    await db.flush()
    await db.refresh(video)

    # Celery 태스크 발행 (Redis 없을 때도 pending 상태로 생성)
    try:
        from app.tasks.video import generate_video_task

        generate_video_task.delay(video.id)
    except Exception:
        pass

    return {"success": True, "data": VideoResponse.model_validate(video)}


@router.get("/clubs/{club_id}/videos")
async def list_videos(
    club_id: int,
    _: ClubMember = Depends(require_club_member),
    db: AsyncSession = Depends(get_db),
):
    """영상 목록 조회"""
    result = await db.execute(
        select(GalleryVideo)
        .where(GalleryVideo.club_id == club_id, GalleryVideo.is_deleted == 0)
        .order_by(GalleryVideo.created_at.desc())
    )
    videos = result.scalars().all()
    return {
        "success": True,
        "data": [VideoResponse.model_validate(v) for v in videos],
    }


@router.get("/clubs/{club_id}/videos/{video_id}")
async def get_video(
    club_id: int,
    video_id: int,
    _: ClubMember = Depends(require_club_member),
    db: AsyncSession = Depends(get_db),
):
    """영상 상태 및 URL 조회"""
    result = await db.execute(
        select(GalleryVideo).where(
            GalleryVideo.id == video_id,
            GalleryVideo.club_id == club_id,
            GalleryVideo.is_deleted == 0,
        )
    )
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(
            404,
            detail={"code": "VIDEO_NOT_FOUND", "message": "영상을 찾을 수 없습니다."},
        )
    return {"success": True, "data": VideoResponse.model_validate(video)}


@router.get("/bgm/list")
async def list_bgm(current_user: User = Depends(get_current_user)):
    """무료 BGM 음원 목록 조회"""
    return {"success": True, "data": BGM_LIST}
