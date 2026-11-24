from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.db.session import get_db
from app.db.models.tournament import Tournament, TournamentParticipant, TournamentMatch
from app.db.models.member import ClubMember
from app.db.models.user import User
from app.core.dependencies import get_current_user, require_club_admin, require_club_member
from app.schemas.tournament import (
    TournamentCreate,
    TournamentUpdate,
    TournamentResponse,
    ParticipantCreate,
    ParticipantResponse,
    ScoreUpdate,
    MatchResponse,
    StandingResponse,
)

router = APIRouter()


@router.get("/clubs/{club_id}/tournaments")
async def list_tournaments(
    club_id: int,
    _: ClubMember = Depends(require_club_member),
    db: AsyncSession = Depends(get_db),
):
    """대회 목록 조회"""
    result = await db.execute(
        select(Tournament).where(
            Tournament.club_id == club_id, Tournament.is_deleted == 0
        ).order_by(Tournament.created_at.desc())
    )
    tournaments = result.scalars().all()
    return {
        "success": True,
        "data": [TournamentResponse.model_validate(t) for t in tournaments],
    }


@router.post("/clubs/{club_id}/tournaments")
async def create_tournament(
    club_id: int,
    body: TournamentCreate,
    _: ClubMember = Depends(require_club_admin),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """대회 생성 (관리자 전용)"""
    tournament = Tournament(
        **body.model_dump(), club_id=club_id, created_by=current_user.id
    )
    db.add(tournament)
    await db.flush()
    await db.refresh(tournament)
    return {"success": True, "data": TournamentResponse.model_validate(tournament)}


@router.get("/clubs/{club_id}/tournaments/{t_id}")
async def get_tournament(
    club_id: int,
    t_id: int,
    _: ClubMember = Depends(require_club_member),
    db: AsyncSession = Depends(get_db),
):
    """대회 상세 조회"""
    result = await db.execute(
        select(Tournament).where(
            Tournament.id == t_id,
            Tournament.club_id == club_id,
            Tournament.is_deleted == 0,
        )
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(
            404,
            detail={
                "code": "TOURNAMENT_NOT_FOUND",
                "message": "대회를 찾을 수 없습니다.",
            },
        )
    return {"success": True, "data": TournamentResponse.model_validate(t)}


@router.put("/clubs/{club_id}/tournaments/{t_id}")
async def update_tournament(
    club_id: int,
    t_id: int,
    body: TournamentUpdate,
    _: ClubMember = Depends(require_club_admin),
    db: AsyncSession = Depends(get_db),
):
    """대회 수정 (관리자 전용)"""
    result = await db.execute(
        select(Tournament).where(
            Tournament.id == t_id,
            Tournament.club_id == club_id,
            Tournament.is_deleted == 0,
        )
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(
            404,
            detail={
                "code": "TOURNAMENT_NOT_FOUND",
                "message": "대회를 찾을 수 없습니다.",
            },
        )
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(t, k, v)
    await db.flush()
    await db.refresh(t)
    return {"success": True, "data": TournamentResponse.model_validate(t)}


@router.delete("/clubs/{club_id}/tournaments/{t_id}")
async def delete_tournament(
    club_id: int,
    t_id: int,
    _: ClubMember = Depends(require_club_admin),
    db: AsyncSession = Depends(get_db),
):
    """대회 삭제 (soft delete, 관리자 전용)"""
    result = await db.execute(
        select(Tournament).where(
            Tournament.id == t_id,
            Tournament.club_id == club_id,
            Tournament.is_deleted == 0,
        )
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(
            404,
            detail={
                "code": "TOURNAMENT_NOT_FOUND",
                "message": "대회를 찾을 수 없습니다.",
            },
        )
    t.is_deleted = 1
    return {"success": True, "message": "대회가 삭제되었습니다."}


@router.get("/tournaments/{t_id}/participants")
async def list_participants(
    t_id: int,
    db: AsyncSession = Depends(get_db),
):
    """참가자 목록 조회"""
    result = await db.execute(
        select(TournamentParticipant).where(
            TournamentParticipant.tournament_id == t_id,
            TournamentParticipant.is_deleted == 0,
        )
    )
    participants = result.scalars().all()
    return {
        "success": True,
        "data": [ParticipantResponse.model_validate(p) for p in participants],
    }


@router.post("/tournaments/{t_id}/participants")
async def add_participant(
    t_id: int,
    body: ParticipantCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """참가자 추가"""
    # 대회 존재 확인
    t_result = await db.execute(
        select(Tournament).where(
            Tournament.id == t_id, Tournament.is_deleted == 0
        )
    )
    tournament = t_result.scalar_one_or_none()
    if not tournament:
        raise HTTPException(
            404,
            detail={
                "code": "TOURNAMENT_NOT_FOUND",
                "message": "대회를 찾을 수 없습니다.",
            },
        )

    participant = TournamentParticipant(
        tournament_id=t_id,
        player_name=body.player_name,
        partner_name=body.partner_name,
        user_id=body.user_id,
    )
    db.add(participant)
    await db.flush()
    await db.refresh(participant)
    return {"success": True, "data": ParticipantResponse.model_validate(participant)}


@router.delete("/tournaments/{t_id}/participants/{p_id}")
async def remove_participant(
    t_id: int,
    p_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """참가자 제거 (soft delete)"""
    result = await db.execute(
        select(TournamentParticipant).where(
            TournamentParticipant.id == p_id,
            TournamentParticipant.tournament_id == t_id,
            TournamentParticipant.is_deleted == 0,
        )
    )
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(
            404,
            detail={
                "code": "PARTICIPANT_NOT_FOUND",
                "message": "참가자를 찾을 수 없습니다.",
            },
        )
    p.is_deleted = 1
    return {"success": True, "message": "참가자가 제거되었습니다."}


@router.get("/tournaments/{t_id}/bracket")
async def get_bracket(
    t_id: int,
    db: AsyncSession = Depends(get_db),
):
    """대진표 조회"""
    result = await db.execute(
        select(TournamentMatch)
        .where(
            TournamentMatch.tournament_id == t_id,
            TournamentMatch.is_deleted == 0,
        )
        .order_by(TournamentMatch.round, TournamentMatch.match_number)
    )
    matches = result.scalars().all()
    return {
        "success": True,
        "data": [MatchResponse.model_validate(m) for m in matches],
    }


@router.post("/tournaments/{t_id}/bracket/generate")
async def generate_bracket_endpoint(
    t_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """LLM (Claude API)으로 대진표 자동 생성"""
    from app.llm.bracket import generate_bracket

    # 기존 매치 soft delete
    existing_result = await db.execute(
        select(TournamentMatch).where(
            TournamentMatch.tournament_id == t_id,
            TournamentMatch.is_deleted == 0,
        )
    )
    for m in existing_result.scalars().all():
        m.is_deleted = 1

    # 대회 조회
    t_result = await db.execute(
        select(Tournament).where(
            Tournament.id == t_id, Tournament.is_deleted == 0
        )
    )
    tournament = t_result.scalar_one_or_none()
    if not tournament:
        raise HTTPException(
            404,
            detail={
                "code": "TOURNAMENT_NOT_FOUND",
                "message": "대회를 찾을 수 없습니다.",
            },
        )

    # 참가자 조회
    p_result = await db.execute(
        select(TournamentParticipant).where(
            TournamentParticipant.tournament_id == t_id,
            TournamentParticipant.is_deleted == 0,
        )
    )
    participants = p_result.scalars().all()

    if len(participants) < 2:
        raise HTTPException(
            400,
            detail={
                "code": "BRACKET_GENERATION_FAILED",
                "message": "참가자가 2명 이상이어야 합니다.",
            },
        )

    try:
        bracket_data = await generate_bracket(tournament, participants)
    except Exception as e:
        raise HTTPException(
            500,
            detail={
                "code": "BRACKET_GENERATION_FAILED",
                "message": f"대진표 생성 실패: {str(e)}",
            },
        )

    # 참가자 이름 → ID 매핑
    name_to_id = {p.player_name: p.id for p in participants}

    # 매치 DB 저장
    for round_data in bracket_data.get("rounds", []):
        for match_data in round_data.get("matches", []):
            p1_id = name_to_id.get(match_data["player1"])
            p2_id = name_to_id.get(match_data["player2"])
            if p1_id and p2_id:
                match = TournamentMatch(
                    tournament_id=t_id,
                    round=round_data["round"],
                    match_number=match_data["match_number"],
                    player1_id=p1_id,
                    player2_id=p2_id,
                )
                db.add(match)

    await db.flush()

    result = await db.execute(
        select(TournamentMatch)
        .where(
            TournamentMatch.tournament_id == t_id,
            TournamentMatch.is_deleted == 0,
        )
        .order_by(TournamentMatch.round, TournamentMatch.match_number)
    )
    matches = result.scalars().all()
    return {
        "success": True,
        "data": [MatchResponse.model_validate(m) for m in matches],
    }


@router.put("/tournaments/{t_id}/matches/{m_id}/score")
async def update_score(
    t_id: int,
    m_id: int,
    body: ScoreUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """경기 결과 입력 및 승패 자동 업데이트"""
    result = await db.execute(
        select(TournamentMatch).where(
            TournamentMatch.id == m_id,
            TournamentMatch.tournament_id == t_id,
            TournamentMatch.is_deleted == 0,
        )
    )
    match = result.scalar_one_or_none()
    if not match:
        raise HTTPException(
            404,
            detail={"code": "MATCH_NOT_FOUND", "message": "경기를 찾을 수 없습니다."},
        )

    match.score_player1 = body.score_player1
    match.score_player2 = body.score_player2
    match.status = "finished"
    match.played_at = datetime.utcnow()

    # 승자 결정
    if body.score_player1 > body.score_player2:
        match.winner_id = match.player1_id
        winner_id = match.player1_id
        loser_id = match.player2_id
        winner_score = body.score_player1
        loser_score = body.score_player2
    else:
        match.winner_id = match.player2_id
        winner_id = match.player2_id
        loser_id = match.player1_id
        winner_score = body.score_player2
        loser_score = body.score_player1

    # 참가자 승패·득실점 업데이트
    w_result = await db.execute(
        select(TournamentParticipant).where(TournamentParticipant.id == winner_id)
    )
    winner = w_result.scalar_one_or_none()

    l_result = await db.execute(
        select(TournamentParticipant).where(TournamentParticipant.id == loser_id)
    )
    loser = l_result.scalar_one_or_none()

    if winner:
        winner.wins += 1
        winner.points_won += winner_score
        winner.points_lost += loser_score
    if loser:
        loser.losses += 1
        loser.points_won += loser_score
        loser.points_lost += winner_score

    await db.flush()
    await db.refresh(match)
    return {"success": True, "data": MatchResponse.model_validate(match)}


@router.get("/tournaments/{t_id}/standings")
async def get_standings(
    t_id: int,
    db: AsyncSession = Depends(get_db),
):
    """순위표 조회 (승수 → 패수 → 득실차 순)"""
    result = await db.execute(
        select(TournamentParticipant).where(
            TournamentParticipant.tournament_id == t_id,
            TournamentParticipant.is_deleted == 0,
        )
    )
    participants = result.scalars().all()
    standings = sorted(
        participants,
        key=lambda p: (-(p.wins), p.losses, -(p.points_won - p.points_lost)),
    )
    return {
        "success": True,
        "data": [
            StandingResponse(
                participant_id=p.id,
                player_name=p.player_name,
                wins=p.wins,
                losses=p.losses,
                points_won=p.points_won,
                points_lost=p.points_lost,
                point_diff=p.points_won - p.points_lost,
            )
            for p in standings
        ],
    }
