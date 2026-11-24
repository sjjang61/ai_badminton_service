from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
from app.db.session import get_db
from app.db.models.user import User
from app.db.models.club import Club
from app.db.models.member import ClubMember
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.dependencies import get_current_user
from app.schemas.auth import TokenResponse, RefreshRequest, UserResponse
from app.schemas.club import ClubResponse

router = APIRouter()


async def upsert_user(
    db: AsyncSession,
    provider: str,
    provider_id: str,
    email: str | None,
    nickname: str,
    profile_img: str | None,
) -> tuple[User, bool]:
    """소셜 로그인 사용자 생성 또는 조회 (upsert). (user, is_new) 반환"""
    result = await db.execute(
        select(User).where(
            User.provider == provider,
            User.provider_id == provider_id,
            User.is_deleted == 0,
        )
    )
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            provider=provider,
            provider_id=provider_id,
            email=email,
            nickname=nickname,
            profile_img=profile_img,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user, True
    else:
        if email:
            user.email = email
        if profile_img:
            user.profile_img = profile_img
        await db.flush()
        return user, False


def create_tokens(user: User, is_new: bool = False) -> dict:
    """JWT Access + Refresh 토큰 생성"""
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "is_new_user": is_new,
    }


@router.get("/kakao")
async def kakao_login():
    """카카오 OAuth 인증 URL 반환"""
    url = (
        f"https://kauth.kakao.com/oauth/authorize"
        f"?client_id={settings.KAKAO_CLIENT_ID}"
        f"&redirect_uri={settings.KAKAO_REDIRECT_URI}"
        f"&response_type=code"
    )
    return {"success": True, "data": {"auth_url": url}}


@router.get("/kakao/callback")
async def kakao_callback(
    code: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """카카오 OAuth 콜백 - JWT 발급"""
    async with httpx.AsyncClient() as client:
        # access token 교환
        token_res = await client.post(
            "https://kauth.kakao.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": settings.KAKAO_CLIENT_ID,
                "redirect_uri": settings.KAKAO_REDIRECT_URI,
                "code": code,
            },
        )
        if token_res.status_code != 200:
            raise HTTPException(
                400,
                detail={"code": "AUTH_INVALID_TOKEN", "message": "카카오 인증 실패"},
            )
        kakao_token = token_res.json().get("access_token")

        # 사용자 정보 조회
        user_res = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {kakao_token}"},
        )
        user_data = user_res.json()

    kakao_account = user_data.get("kakao_account", {})
    profile = kakao_account.get("profile", {})
    user, is_new = await upsert_user(
        db,
        provider="kakao",
        provider_id=str(user_data["id"]),
        email=kakao_account.get("email"),
        nickname=profile.get("nickname", "사용자"),
        profile_img=profile.get("profile_image_url"),
    )
    return {"success": True, "data": create_tokens(user, is_new)}


@router.get("/naver")
async def naver_login():
    """네이버 OAuth 인증 URL 반환"""
    import secrets

    state = secrets.token_hex(16)
    url = (
        f"https://nid.naver.com/oauth2.0/authorize"
        f"?response_type=code"
        f"&client_id={settings.NAVER_CLIENT_ID}"
        f"&redirect_uri={settings.NAVER_REDIRECT_URI}"
        f"&state={state}"
    )
    return {"success": True, "data": {"auth_url": url}}


@router.get("/naver/callback")
async def naver_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """네이버 OAuth 콜백 - JWT 발급"""
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://nid.naver.com/oauth2.0/token",
            params={
                "grant_type": "authorization_code",
                "client_id": settings.NAVER_CLIENT_ID,
                "client_secret": settings.NAVER_CLIENT_SECRET,
                "redirect_uri": settings.NAVER_REDIRECT_URI,
                "code": code,
                "state": state,
            },
        )
        naver_token = token_res.json().get("access_token")

        user_res = await client.get(
            "https://openapi.naver.com/v1/nid/me",
            headers={"Authorization": f"Bearer {naver_token}"},
        )
        user_data = user_res.json().get("response", {})

    user, is_new = await upsert_user(
        db,
        provider="naver",
        provider_id=user_data["id"],
        email=user_data.get("email"),
        nickname=user_data.get("nickname", "사용자"),
        profile_img=user_data.get("profile_image"),
    )
    return {"success": True, "data": create_tokens(user, is_new)}


@router.get("/google")
async def google_login():
    """구글 OAuth 인증 URL 반환"""
    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=openid email profile"
    )
    return {"success": True, "data": {"auth_url": url}}


@router.get("/google/callback")
async def google_callback(
    code: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """구글 OAuth 콜백 - JWT 발급"""
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        google_token = token_res.json().get("access_token")

        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {google_token}"},
        )
        user_data = user_res.json()

    user, is_new = await upsert_user(
        db,
        provider="google",
        provider_id=user_data["id"],
        email=user_data.get("email"),
        nickname=user_data.get("name", "사용자"),
        profile_img=user_data.get("picture"),
    )
    return {"success": True, "data": create_tokens(user, is_new)}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """Access Token 재발급"""
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                401,
                detail={
                    "code": "AUTH_INVALID_TOKEN",
                    "message": "유효하지 않은 리프레시 토큰",
                },
            )
        user_id = payload.get("sub")
        result = await db.execute(
            select(User).where(User.id == int(user_id), User.is_deleted == 0)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                401,
                detail={
                    "code": "AUTH_INVALID_TOKEN",
                    "message": "사용자를 찾을 수 없습니다.",
                },
            )
        return create_tokens(user)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            401,
            detail={"code": "AUTH_TOKEN_EXPIRED", "message": "만료된 토큰입니다."},
        )


@router.post("/logout")
async def logout():
    """로그아웃 (클라이언트에서 토큰 삭제)"""
    return {"success": True, "message": "로그아웃 되었습니다."}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """현재 로그인한 사용자 정보"""
    return current_user


@router.get("/me/clubs")
async def get_my_clubs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """내가 가입한 클럽 목록 (승인 완료 기준)"""
    result = await db.execute(
        select(Club)
        .join(ClubMember, ClubMember.club_id == Club.id)
        .where(
            ClubMember.user_id == current_user.id,
            ClubMember.status == "approved",
            ClubMember.is_deleted == 0,
            Club.is_deleted == 0,
        )
        .order_by(ClubMember.joined_at.desc())
    )
    clubs = result.scalars().all()
    return {"success": True, "data": [ClubResponse.model_validate(c) for c in clubs]}


@router.patch("/me", response_model=UserResponse)
async def update_me(
    nickname: str = Body(..., embed=True, min_length=1, max_length=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """닉네임 수정"""
    current_user.nickname = nickname
    await db.flush()
    await db.refresh(current_user)
    return current_user
