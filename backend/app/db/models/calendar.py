from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, ForeignKey, DateTime
from app.db.base import Base, TimestampMixin
from datetime import datetime


class CalendarEvent(Base, TimestampMixin):
    """캘린더 이벤트 모델"""

    __tablename__ = "calendar_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    club_id: Mapped[int | None] = mapped_column(ForeignKey("clubs.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    start_dt: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_dt: Mapped[datetime | None] = mapped_column(DateTime)
    all_day: Mapped[int] = mapped_column(default=0, nullable=False)
    color: Mapped[str | None] = mapped_column(String(20))
    dday_label: Mapped[str | None] = mapped_column(String(100))
    is_public: Mapped[int] = mapped_column(default=1, nullable=False)

    club = relationship("Club", foreign_keys=[club_id])
    user = relationship("User", foreign_keys=[user_id])
