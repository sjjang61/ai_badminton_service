from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError
from app.db.session import get_db
from app.core.security import decode_token

security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """JWT 토큰으로 현재 사용자 조회"""
    from app.db.models.user import User
    from sqlalchemy import select

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"code": "AUTH_INVALID_TOKEN", "message": "유효하지 않은 토큰입니다."},
    )
    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        if payload.get("type") != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(
        select(User).where(User.id == int(user_id), User.is_deleted == 0)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security_optional),
    db: AsyncSession = Depends(get_db),
):
    """선택적 JWT 인증 - 토큰이 없어도 None 반환"""
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


async def require_service_admin(
    current_user=Depends(get_current_user),
):
    """서비스 관리자 권한 확인"""
    if current_user.role != "service_admin":
        raise HTTPException(
            403,
            detail={"code": "AUTH_UNAUTHORIZED", "message": "서비스 관리자 권한이 필요합니다."},
        )
    return current_user


async def require_club_admin(
    club_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """클럽 관리자 권한 확인"""
    from app.db.models.member import ClubMember
    from sqlalchemy import select

    result = await db.execute(
        select(ClubMember).where(
            ClubMember.club_id == club_id,
            ClubMember.user_id == current_user.id,
            ClubMember.is_deleted == 0,
            ClubMember.status == "approved",
        )
    )
    member = result.scalar_one_or_none()
    if not member or member.role != "admin":
        raise HTTPException(
            403,
            detail={"code": "AUTH_UNAUTHORIZED", "message": "클럽 관리자 권한이 필요합니다."},
        )
    return member


async def require_club_member(
    club_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """클럽 회원 권한 확인"""
    from app.db.models.member import ClubMember
    from sqlalchemy import select

    result = await db.execute(
        select(ClubMember).where(
            ClubMember.club_id == club_id,
            ClubMember.user_id == current_user.id,
            ClubMember.is_deleted == 0,
            ClubMember.status == "approved",
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(
            403,
            detail={"code": "AUTH_UNAUTHORIZED", "message": "클럽 회원 권한이 필요합니다."},
        )
    return member
