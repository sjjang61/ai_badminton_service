from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.db.session import get_db
from app.db.models.member import ClubMember
from app.db.models.user import User
from app.core.dependencies import get_current_user, require_club_admin, require_club_member
from app.schemas.member import MemberResponse, MemberRoleUpdate

router = APIRouter()


@router.get("/clubs/{club_id}/members")
async def list_members(
    club_id: int,
    _: ClubMember = Depends(require_club_member),
    db: AsyncSession = Depends(get_db),
):
    """클럽 회원 목록 조회"""
    result = await db.execute(
        select(ClubMember).where(
            ClubMember.club_id == club_id, ClubMember.is_deleted == 0
        )
    )
    members = result.scalars().all()
    return {"success": True, "data": [MemberResponse.model_validate(m) for m in members]}


@router.post("/clubs/{club_id}/members/join")
async def join_club(
    club_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """클럽 가입 요청"""
    # 이미 가입 여부 확인
    result = await db.execute(
        select(ClubMember).where(
            ClubMember.club_id == club_id,
            ClubMember.user_id == current_user.id,
            ClubMember.is_deleted == 0,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        if existing.status == "pending":
            raise HTTPException(
                409,
                detail={"code": "MEMBER_PENDING", "message": "승인 대기 중입니다."},
            )
        if existing.status == "approved":
            raise HTTPException(
                409,
                detail={
                    "code": "CLUB_ALREADY_MEMBER",
                    "message": "이미 가입된 클럽입니다.",
                },
            )
        if existing.status in ("rejected", "banned"):
            # 재가입 요청 허용
            existing.status = "pending"
            existing.is_deleted = 0
            await db.flush()
            return {"success": True, "data": MemberResponse.model_validate(existing)}

    member = ClubMember(
        club_id=club_id,
        user_id=current_user.id,
        role="member",
        status="pending",
    )
    db.add(member)
    await db.flush()
    await db.refresh(member)
    return {"success": True, "data": MemberResponse.model_validate(member)}


@router.put("/clubs/{club_id}/members/{member_id}/approve")
async def approve_member(
    club_id: int,
    member_id: int,
    _: ClubMember = Depends(require_club_admin),
    db: AsyncSession = Depends(get_db),
):
    """가입 승인 (관리자 전용)"""
    result = await db.execute(
        select(ClubMember).where(
            ClubMember.id == member_id,
            ClubMember.club_id == club_id,
            ClubMember.is_deleted == 0,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(
            404,
            detail={"code": "MEMBER_NOT_FOUND", "message": "회원을 찾을 수 없습니다."},
        )
    member.status = "approved"
    member.joined_at = datetime.utcnow()
    await db.flush()
    return {"success": True, "data": MemberResponse.model_validate(member)}


@router.put("/clubs/{club_id}/members/{member_id}/reject")
async def reject_member(
    club_id: int,
    member_id: int,
    _: ClubMember = Depends(require_club_admin),
    db: AsyncSession = Depends(get_db),
):
    """가입 거절 (관리자 전용)"""
    result = await db.execute(
        select(ClubMember).where(
            ClubMember.id == member_id,
            ClubMember.club_id == club_id,
            ClubMember.is_deleted == 0,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(
            404,
            detail={"code": "MEMBER_NOT_FOUND", "message": "회원을 찾을 수 없습니다."},
        )
    member.status = "rejected"
    await db.flush()
    return {"success": True, "data": MemberResponse.model_validate(member)}


@router.put("/clubs/{club_id}/members/{member_id}/role")
async def update_member_role(
    club_id: int,
    member_id: int,
    body: MemberRoleUpdate,
    _: ClubMember = Depends(require_club_admin),
    db: AsyncSession = Depends(get_db),
):
    """회원 역할 변경 (관리자 전용)"""
    result = await db.execute(
        select(ClubMember).where(
            ClubMember.id == member_id,
            ClubMember.club_id == club_id,
            ClubMember.is_deleted == 0,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(
            404,
            detail={"code": "MEMBER_NOT_FOUND", "message": "회원을 찾을 수 없습니다."},
        )
    member.role = body.role
    await db.flush()
    return {"success": True, "data": MemberResponse.model_validate(member)}


@router.delete("/clubs/{club_id}/members/{member_id}")
async def remove_member(
    club_id: int,
    member_id: int,
    _: ClubMember = Depends(require_club_admin),
    db: AsyncSession = Depends(get_db),
):
    """회원 내보내기 (soft delete, 관리자 전용)"""
    result = await db.execute(
        select(ClubMember).where(
            ClubMember.id == member_id,
            ClubMember.club_id == club_id,
            ClubMember.is_deleted == 0,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(
            404,
            detail={"code": "MEMBER_NOT_FOUND", "message": "회원을 찾을 수 없습니다."},
        )
    member.is_deleted = 1
    return {"success": True, "message": "회원이 제거되었습니다."}
