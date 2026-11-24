from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Enum, Integer, ForeignKey, DateTime, Date, Text
from app.db.base import Base, TimestampMixin
from datetime import date, datetime


class Tournament(Base, TimestampMixin):
    """대회 모델"""

    __tablename__ = "tournaments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    club_id: Mapped[int | None] = mapped_column(ForeignKey("clubs.id"))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str] = mapped_column(
        Enum("internal", "external"), default="internal", nullable=False
    )
    match_type: Mapped[str] = mapped_column(
        Enum("singles", "doubles", "mixed"), default="singles", nullable=False
    )
    format: Mapped[str] = mapped_column(
        Enum("round_robin", "single_elimination", "double_elimination"),
        default="round_robin",
        nullable=False,
    )
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    location: Mapped[str | None] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        Enum("draft", "ongoing", "finished"), default="draft", nullable=False
    )
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    club = relationship("Club", foreign_keys=[club_id])
    creator = relationship("User", foreign_keys=[created_by])
    participants = relationship("TournamentParticipant", back_populates="tournament")
    matches = relationship("TournamentMatch", back_populates="tournament")


class TournamentParticipant(Base, TimestampMixin):
    """대회 참가자 모델"""

    __tablename__ = "tournament_participants"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    tournament_id: Mapped[int] = mapped_column(
        ForeignKey("tournaments.id"), nullable=False
    )
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    player_name: Mapped[str] = mapped_column(String(100), nullable=False)
    partner_name: Mapped[str | None] = mapped_column(String(100))
    wins: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    losses: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    points_won: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    points_lost: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    tournament = relationship("Tournament", back_populates="participants")
    user = relationship("User", foreign_keys=[user_id])


class TournamentMatch(Base, TimestampMixin):
    """대회 경기 모델"""

    __tablename__ = "tournament_matches"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    tournament_id: Mapped[int] = mapped_column(
        ForeignKey("tournaments.id"), nullable=False
    )
    round: Mapped[int] = mapped_column(Integer, nullable=False)
    match_number: Mapped[int] = mapped_column(Integer, nullable=False)
    player1_id: Mapped[int] = mapped_column(
        ForeignKey("tournament_participants.id"), nullable=False
    )
    player2_id: Mapped[int] = mapped_column(
        ForeignKey("tournament_participants.id"), nullable=False
    )
    score_player1: Mapped[int | None] = mapped_column(Integer)
    score_player2: Mapped[int | None] = mapped_column(Integer)
    winner_id: Mapped[int | None] = mapped_column(
        ForeignKey("tournament_participants.id")
    )
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime)
    played_at: Mapped[datetime | None] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(
        Enum("pending", "ongoing", "finished"), default="pending", nullable=False
    )

    tournament = relationship("Tournament", back_populates="matches")
    player1 = relationship(
        "TournamentParticipant", foreign_keys=[player1_id]
    )
    player2 = relationship(
        "TournamentParticipant", foreign_keys=[player2_id]
    )
    winner = relationship(
        "TournamentParticipant", foreign_keys=[winner_id]
    )
