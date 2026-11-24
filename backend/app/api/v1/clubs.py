from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from math import radians, cos, sin, asin, sqrt
from datetime import datetime
from app.db.session import get_db
from app.db.models.club import Club
from app.db.models.member import ClubMember, ClubFee
from app.db.models.user import User
from app.core.dependencies import (
    get_current_user,
    get_current_user_optional,
    require_club_admin,
    require_club_member,
)
from app.schemas.club import (
    ClubCreate,
    ClubUpdate,
    ClubResponse,
    FeeCreate,
    FeeUpdate,
    FeeResponse,
)

router = APIRouter()


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """두 좌표 간 거리(km) 반환 (Haversine 공식)"""
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    )
    return 2 * R * asin(sqrt(a))


@router.get("")
async def list_clubs(
    lat: Optional[float] = Query(None, description="위도"),
    lng: Optional[float] = Query(None, description="경도"),
    radius: Optional[int] = Query(None, description="반경 (미터)"),
    query: Optional[str] = Query(None, description="클럽명/체육관명 검색"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """클럽 목록 조회 (지도 좌표 기반 또는 이름 검색)"""
    stmt = select(Club).where(Club.is_deleted == 0)

    if query:
        stmt = stmt.where(
            (Club.name.ilike(f"%{query}%")) | (Club.gym_name.ilike(f"%{query}%"))
        )

    result = await db.execute(stmt)
    clubs = result.scalars().all()

    # 거리 필터링 (앱 레벨)
    if lat is not None and lng is not None and radius is not None:
        clubs = [
            c
            for c in clubs
            if c.latitude
            and c.longitude
            and haversine(lat, lng, float(c.latitude), float(c.longitude)) * 1000
            <= radius
        ]

    total = len(clubs)
    start = (page - 1) * size
    clubs_page = clubs[start : start + size]

    return {
        "success": True,
        "data": [ClubResponse.model_validate(c) for c in clubs_page],
        "pagination": {"page": page, "size": size, "total": total},
    }


@router.post("")
async def create_club(
    body: ClubCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """클럽 생성 - 생성자 자동으로 관리자 등록"""
    club = Club(**body.model_dump(), owner_id=current_user.id)
    db.add(club)
    await db.flush()

    # 생성자를 클럽 관리자로 등록
    member = ClubMember(
        club_id=club.id,
        user_id=current_user.id,
        role="admin",
        status="approved",
        joined_at=datetime.utcnow(),
    )
    db.add(member)
    await db.flush()
    await db.refresh(club)

    return {"success": True, "data": ClubResponse.model_validate(club)}


@router.get("/{club_id}")
async def get_club(club_id: int, db: AsyncSession = Depends(get_db)):
    """클럽 상세 조회"""
    result = await db.execute(
        select(Club).where(Club.id == club_id, Club.is_deleted == 0)
    )
    club = result.scalar_one_or_none()
    if not club:
        raise HTTPException(
            404,
            detail={"code": "CLUB_NOT_FOUND", "message": "클럽을 찾을 수 없습니다."},
        )
    return {"success": True, "data": ClubResponse.model_validate(club)}


@router.put("/{club_id}")
async def update_club(
    club_id: int,
    body: ClubUpdate,
    _: ClubMember = Depends(require_club_admin),
    db: AsyncSession = Depends(get_db),
):
    """클럽 수정 (관리자 전용)"""
    result = await db.execute(
        select(Club).where(Club.id == club_id, Club.is_deleted == 0)
    )
    club = result.scalar_one_or_none()
    if not club:
        raise HTTPException(
            404,
            detail={"code": "CLUB_NOT_FOUND", "message": "클럽을 찾을 수 없습니다."},
        )

    for k, v in body.model_dump(exclude_none=True).items():
        setattr(club, k, v)
    await db.flush()
    await db.refresh(club)
    return {"success": True, "data": ClubResponse.model_validate(club)}


@router.delete("/{club_id}")
async def delete_club(
    club_id: int,
    _: ClubMember = Depends(require_club_admin),
    db: AsyncSession = Depends(get_db),
):
    """클럽 삭제 (soft delete, 관리자 전용)"""
    result = await db.execute(
        select(Club).where(Club.id == club_id, Club.is_deleted == 0)
    )
    club = result.scalar_one_or_none()
    if not club:
        raise HTTPException(
            404,
            detail={"code": "CLUB_NOT_FOUND", "message": "클럽을 찾을 수 없습니다."},
        )
    club.is_deleted = 1
    return {"success": True, "message": "클럽이 삭제되었습니다."}


@router.get("/{club_id}/fees")
async def list_fees(
    club_id: int,
    _: ClubMember = Depends(require_club_member),
    db: AsyncSession = Depends(get_db),
):
    """회비 목록 조회"""
    result = await db.execute(
        select(ClubFee).where(
            ClubFee.club_id == club_id, ClubFee.is_deleted == 0
        )
    )
    fees = result.scalars().all()
    return {"success": True, "data": [FeeResponse.model_validate(f) for f in fees]}


@router.post("/{club_id}/fees")
async def create_fee(
    club_id: int,
    body: FeeCreate,
    _: ClubMember = Depends(require_club_admin),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """회비 등록 (관리자 전용)"""
    fee_month = datetime.strptime(body.fee_month + "-01", "%Y-%m-%d")
    fee = ClubFee(
        club_id=club_id,
        user_id=body.user_id,
        amount=body.amount,
        fee_month=fee_month,
        paid_at=body.paid_at,
        memo=body.memo,
        created_by=current_user.id,
    )
    db.add(fee)
    await db.flush()
    await db.refresh(fee)
    return {"success": True, "data": FeeResponse.model_validate(fee)}


@router.put("/{club_id}/fees/{fee_id}")
async def update_fee(
    club_id: int,
    fee_id: int,
    body: FeeUpdate,
    _: ClubMember = Depends(require_club_admin),
    db: AsyncSession = Depends(get_db),
):
    """회비 수정 (관리자 전용)"""
    result = await db.execute(
        select(ClubFee).where(
            ClubFee.id == fee_id,
            ClubFee.club_id == club_id,
            ClubFee.is_deleted == 0,
        )
    )
    fee = result.scalar_one_or_none()
    if not fee:
        raise HTTPException(
            404,
            detail={"code": "FEE_NOT_FOUND", "message": "회비 내역을 찾을 수 없습니다."},
        )
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(fee, k, v)
    await db.flush()
    await db.refresh(fee)
    return {"success": True, "data": FeeResponse.model_validate(fee)}


@router.delete("/{club_id}/fees/{fee_id}")
async def delete_fee(
    club_id: int,
    fee_id: int,
    _: ClubMember = Depends(require_club_admin),
    db: AsyncSession = Depends(get_db),
):
    """회비 삭제 (soft delete, 관리자 전용)"""
    result = await db.execute(
        select(ClubFee).where(
            ClubFee.id == fee_id,
            ClubFee.club_id == club_id,
            ClubFee.is_deleted == 0,
        )
    )
    fee = result.scalar_one_or_none()
    if not fee:
        raise HTTPException(
            404,
            detail={"code": "FEE_NOT_FOUND", "message": "회비 내역을 찾을 수 없습니다."},
        )
    fee.is_deleted = 1
    return {"success": True, "message": "회비 내역이 삭제되었습니다."}
