from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.models.calendar import CalendarEvent
from app.db.models.member import ClubMember
from app.db.models.user import User
from app.core.dependencies import get_current_user, require_club_member
from app.schemas.calendar import EventCreate, EventUpdate, EventResponse

router = APIRouter()


@router.get("/clubs/{club_id}/events")
async def list_events(
    club_id: int,
    _: ClubMember = Depends(require_club_member),
    db: AsyncSession = Depends(get_db),
):
    """클럽 일정 목록 조회"""
    result = await db.execute(
        select(CalendarEvent)
        .where(
            CalendarEvent.club_id == club_id,
            CalendarEvent.is_deleted == 0,
        )
        .order_by(CalendarEvent.start_dt)
    )
    events = result.scalars().all()
    return {
        "success": True,
        "data": [EventResponse.model_validate(e) for e in events],
    }


@router.post("/clubs/{club_id}/events")
async def create_event(
    club_id: int,
    body: EventCreate,
    _: ClubMember = Depends(require_club_member),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """일정 등록 (클럽 회원 이상)"""
    event = CalendarEvent(
        **body.model_dump(), club_id=club_id, user_id=current_user.id
    )
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return {"success": True, "data": EventResponse.model_validate(event)}


@router.put("/clubs/{club_id}/events/{event_id}")
async def update_event(
    club_id: int,
    event_id: int,
    body: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """일정 수정 (등록자 또는 관리자)"""
    result = await db.execute(
        select(CalendarEvent).where(
            CalendarEvent.id == event_id,
            CalendarEvent.club_id == club_id,
            CalendarEvent.is_deleted == 0,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(
            404,
            detail={"code": "EVENT_NOT_FOUND", "message": "일정을 찾을 수 없습니다."},
        )

    # 등록자 또는 클럽 관리자만 수정 가능
    if event.user_id != current_user.id:
        admin_result = await db.execute(
            select(ClubMember).where(
                ClubMember.club_id == club_id,
                ClubMember.user_id == current_user.id,
                ClubMember.is_deleted == 0,
                ClubMember.status == "approved",
                ClubMember.role == "admin",
            )
        )
        if not admin_result.scalar_one_or_none():
            raise HTTPException(
                403,
                detail={"code": "AUTH_UNAUTHORIZED", "message": "권한이 없습니다."},
            )

    for k, v in body.model_dump(exclude_none=True).items():
        setattr(event, k, v)
    await db.flush()
    await db.refresh(event)
    return {"success": True, "data": EventResponse.model_validate(event)}


@router.delete("/clubs/{club_id}/events/{event_id}")
async def delete_event(
    club_id: int,
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """일정 삭제 (soft delete - 등록자 또는 관리자)"""
    result = await db.execute(
        select(CalendarEvent).where(
            CalendarEvent.id == event_id,
            CalendarEvent.club_id == club_id,
            CalendarEvent.is_deleted == 0,
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(
            404,
            detail={"code": "EVENT_NOT_FOUND", "message": "일정을 찾을 수 없습니다."},
        )

    # 등록자 또는 클럽 관리자만 삭제 가능
    if event.user_id != current_user.id:
        admin_result = await db.execute(
            select(ClubMember).where(
                ClubMember.club_id == club_id,
                ClubMember.user_id == current_user.id,
                ClubMember.is_deleted == 0,
                ClubMember.status == "approved",
                ClubMember.role == "admin",
            )
        )
        if not admin_result.scalar_one_or_none():
            raise HTTPException(
                403,
                detail={"code": "AUTH_UNAUTHORIZED", "message": "권한이 없습니다."},
            )

    event.is_deleted = 1
    return {"success": True, "message": "일정이 삭제되었습니다."}
