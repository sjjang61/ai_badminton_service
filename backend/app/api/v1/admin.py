from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from app.db.session import get_db
from app.db.models.user import User
from app.db.models.club import Club
from app.db.models.member import ClubMember
from app.db.models.tournament import Tournament
from app.core.dependencies import require_service_admin

router = APIRouter()


@router.get("/stats")
async def get_stats(
    _: User = Depends(require_service_admin),
    db: AsyncSession = Depends(get_db),
):
    """서비스 통계 (서비스 관리자 전용)"""
    user_count = await db.scalar(
        select(func.count()).select_from(User).where(User.is_deleted == 0)
    )
    club_count = await db.scalar(
        select(func.count()).select_from(Club).where(Club.is_deleted == 0)
    )
    tournament_count = await db.scalar(
        select(func.count()).select_from(Tournament).where(Tournament.is_deleted == 0)
    )
    return {
        "success": True,
        "data": {
            "total_users": user_count,
            "total_clubs": club_count,
            "total_tournaments": tournament_count,
        },
    }


@router.get("/users")
async def list_all_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _: User = Depends(require_service_admin),
    db: AsyncSession = Depends(get_db),
):
    """전체 사용자 목록 (서비스 관리자 전용)"""
    total = await db.scalar(
        select(func.count()).select_from(User).where(User.is_deleted == 0)
    )
    result = await db.execute(
        select(User)
        .where(User.is_deleted == 0)
        .offset((page - 1) * size)
        .limit(size)
        .order_by(User.created_at.desc())
    )
    users = result.scalars().all()

    from app.schemas.auth import UserResponse

    return {
        "success": True,
        "data": [UserResponse.model_validate(u) for u in users],
        "pagination": {"page": page, "size": size, "total": total},
    }


@router.get("/clubs")
async def list_all_clubs(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _: User = Depends(require_service_admin),
    db: AsyncSession = Depends(get_db),
):
    """전체 클럽 목록 (서비스 관리자 전용)"""
    total = await db.scalar(
        select(func.count()).select_from(Club).where(Club.is_deleted == 0)
    )
    result = await db.execute(
        select(Club)
        .where(Club.is_deleted == 0)
        .offset((page - 1) * size)
        .limit(size)
        .order_by(Club.created_at.desc())
    )
    clubs = result.scalars().all()

    from app.schemas.club import ClubResponse

    return {
        "success": True,
        "data": [ClubResponse.model_validate(c) for c in clubs],
        "pagination": {"page": page, "size": size, "total": total},
    }
