from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, Enum, ForeignKey
from app.db.base import Base, TimestampMixin


class Notice(Base, TimestampMixin):
    """공지사항 모델"""

    __tablename__ = "notices"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    club_id: Mapped[int | None] = mapped_column(ForeignKey("clubs.id"))
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_pinned: Mapped[int] = mapped_column(default=0, nullable=False)
    scope: Mapped[str] = mapped_column(
        Enum("global", "club"), default="club", nullable=False
    )
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    club = relationship("Club", foreign_keys=[club_id])
    creator = relationship("User", foreign_keys=[created_by])
