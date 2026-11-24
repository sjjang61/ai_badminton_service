from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class TournamentCreate(BaseModel):
    """대회 생성 요청"""

    name: str
    type: str = "internal"
    match_type: str = "singles"
    format: str = "round_robin"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    location: Optional[str] = None
    description: Optional[str] = None


class TournamentUpdate(BaseModel):
    """대회 수정 요청"""

    name: Optional[str] = None
    type: Optional[str] = None
    match_type: Optional[str] = None
    format: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    location: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class TournamentResponse(BaseModel):
    """대회 응답"""

    id: int
    club_id: Optional[int]
    name: str
    type: str
    match_type: str
    format: str
    start_date: Optional[date]
    end_date: Optional[date]
    location: Optional[str]
    description: Optional[str]
    status: str
    created_by: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ParticipantCreate(BaseModel):
    """참가자 추가 요청"""

    player_name: str
    partner_name: Optional[str] = None
    user_id: Optional[int] = None


class ParticipantResponse(BaseModel):
    """참가자 응답"""

    id: int
    tournament_id: int
    user_id: Optional[int]
    player_name: str
    partner_name: Optional[str]
    wins: int
    losses: int
    points_won: int
    points_lost: int

    model_config = {"from_attributes": True}


class ScoreUpdate(BaseModel):
    """경기 점수 업데이트 요청"""

    score_player1: int
    score_player2: int


class MatchResponse(BaseModel):
    """경기 응답"""

    id: int
    tournament_id: int
    round: int
    match_number: int
    player1_id: int
    player2_id: int
    score_player1: Optional[int]
    score_player2: Optional[int]
    winner_id: Optional[int]
    status: str
    scheduled_at: Optional[datetime]
    played_at: Optional[datetime]

    model_config = {"from_attributes": True}


class StandingResponse(BaseModel):
    """순위표 응답"""

    participant_id: int
    player_name: str
    wins: int
    losses: int
    points_won: int
    points_lost: int
    point_diff: int
