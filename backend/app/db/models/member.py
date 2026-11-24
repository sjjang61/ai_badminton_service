from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Enum, Integer, ForeignKey, DateTime, UniqueConstraint
from app.db.base import Base, TimestampMixin
from datetime import datetime


class ClubMember(Base, TimestampMixin):
    """클럽 회원 모델"""

    __tablename__ = "club_members"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    club_id: Mapped[int] = mapped_column(ForeignKey("clubs.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    role: Mapped[str] = mapped_column(
        Enum("admin", "member", "guest"), default="member", nullable=False
    )
    status: Mapped[str] = mapped_column(
        Enum("pending", "approved", "rejected", "banned"),
        default="pending",
        nullable=False,
    )
    joined_at: Mapped[datetime | None] = mapped_column(DateTime)

    __table_args__ = (
        UniqueConstraint("club_id", "user_id", name="uq_club_user"),
    )

    club = relationship("Club", back_populates="members")
    user = relationship(
        "User", back_populates="club_memberships", foreign_keys=[user_id]
    )


class ClubFee(Base, TimestampMixin):
    """클럽 회비 모델"""

    __tablename__ = "club_fees"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    club_id: Mapped[int] = mapped_column(ForeignKey("clubs.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    fee_month: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime)
    memo: Mapped[str | None] = mapped_column(String(500))
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    club = relationship("Club", foreign_keys=[club_id])
    user = relationship("User", foreign_keys=[user_id])
    creator = relationship("User", foreign_keys=[created_by])
