from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models.notice import Notice
from app.db.models.member import ClubMember
from app.db.models.user import User
from app.core.dependencies import (
    get_current_user,
    require_club_admin,
    require_club_member,
    require_service_admin,
)
from app.schemas.notice import NoticeCreate, NoticeUpdate, NoticeResponse

router = APIRouter()


@router.get("/notices")
async def list_global_notices(db: AsyncSession = Depends(get_db)):
    """서비스 전체 공지 목록 (Public)"""
    result = await db.execute(
        select(Notice)
        .where(Notice.scope == "global", Notice.is_deleted == 0)
        .order_by(Notice.is_pinned.desc(), Notice.created_at.desc())
    )
    notices = result.scalars().all()
    return {
        "success": True,
        "data": [NoticeResponse.model_validate(n) for n in notices],
    }


@router.post("/notices")
async def create_global_notice(
    body: NoticeCreate,
    current_user: User = Depends(require_service_admin),
    db: AsyncSession = Depends(get_db),
):
    """서비스 전체 공지 작성 (서비스 관리자 전용)"""
    notice = Notice(
        **body.model_dump(), scope="global", created_by=current_user.id
    )
    db.add(notice)
    await db.flush()
    await db.refresh(notice)
    return {"success": True, "data": NoticeResponse.model_validate(notice)}


@router.get("/clubs/{club_id}/notices")
async def list_club_notices(
    club_id: int,
    _: ClubMember = Depends(require_club_member),
    db: AsyncSession = Depends(get_db),
):
    """클럽 공지 목록"""
    result = await db.execute(
        select(Notice)
        .where(
            Notice.club_id == club_id,
            Notice.scope == "club",
            Notice.is_deleted == 0,
        )
        .order_by(Notice.is_pinned.desc(), Notice.created_at.desc())
    )
    notices = result.scalars().all()
    return {
        "success": True,
        "data": [NoticeResponse.model_validate(n) for n in notices],
    }


@router.post("/clubs/{club_id}/notices")
async def create_club_notice(
    club_id: int,
    body: NoticeCreate,
    _: ClubMember = Depends(require_club_admin),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """클럽 공지 작성 (클럽 관리자 전용)"""
    notice = Notice(
        **body.model_dump(),
        club_id=club_id,
        scope="club",
        created_by=current_user.id,
    )
    db.add(notice)
    await db.flush()
    await db.refresh(notice)
    return {"success": True, "data": NoticeResponse.model_validate(notice)}


@router.put("/clubs/{club_id}/notices/{n_id}")
async def update_notice(
    club_id: int,
    n_id: int,
    body: NoticeUpdate,
    _: ClubMember = Depends(require_club_admin),
    db: AsyncSession = Depends(get_db),
):
    """공지 수정 (클럽 관리자 전용)"""
    result = await db.execute(
        select(Notice).where(
            Notice.id == n_id,
            Notice.club_id == club_id,
            Notice.is_deleted == 0,
        )
    )
    notice = result.scalar_one_or_none()
    if not notice:
        raise HTTPException(
            404,
            detail={
                "code": "NOTICE_NOT_FOUND",
                "message": "공지사항을 찾을 수 없습니다.",
            },
        )
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(notice, k, v)
    await db.flush()
    await db.refresh(notice)
    return {"success": True, "data": NoticeResponse.model_validate(notice)}


@router.delete("/clubs/{club_id}/notices/{n_id}")
async def delete_notice(
    club_id: int,
    n_id: int,
    _: ClubMember = Depends(require_club_admin),
    db: AsyncSession = Depends(get_db),
):
    """공지 삭제 (soft delete, 클럽 관리자 전용)"""
    result = await db.execute(
        select(Notice).where(
            Notice.id == n_id,
            Notice.club_id == club_id,
            Notice.is_deleted == 0,
        )
    )
    notice = result.scalar_one_or_none()
    if not notice:
        raise HTTPException(
            404,
            detail={
                "code": "NOTICE_NOT_FOUND",
                "message": "공지사항을 찾을 수 없습니다.",
            },
        )
    notice.is_deleted = 1
    return {"success": True, "message": "공지사항이 삭제되었습니다."}
