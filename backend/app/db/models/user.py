from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Enum, UniqueConstraint
from app.db.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    """사용자 모델"""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    provider: Mapped[str] = mapped_column(
        Enum("kakao", "naver", "google"), nullable=False
    )
    provider_id: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255))
    nickname: Mapped[str] = mapped_column(String(50), nullable=False)
    profile_img: Mapped[str | None] = mapped_column(String(500))
    role: Mapped[str] = mapped_column(
        Enum("user", "service_admin"), default="user", nullable=False
    )

    __table_args__ = (
        UniqueConstraint("provider", "provider_id", name="uq_provider"),
    )

    club_memberships = relationship(
        "ClubMember",
        back_populates="user",
        foreign_keys="ClubMember.user_id",
    )
