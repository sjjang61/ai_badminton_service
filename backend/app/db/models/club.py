from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, DECIMAL, Integer, ForeignKey
from app.db.base import Base, TimestampMixin


class Club(Base, TimestampMixin):
    """클럽 모델"""

    __tablename__ = "clubs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    gym_name: Mapped[str | None] = mapped_column(String(200))
    gym_address: Mapped[str | None] = mapped_column(String(500))
    latitude: Mapped[float | None] = mapped_column(DECIMAL(10, 7))
    longitude: Mapped[float | None] = mapped_column(DECIMAL(11, 7))
    has_joining_fee: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # 가입비 여부
    joining_fee: Mapped[int] = mapped_column(Integer, default=0, nullable=False)      # 가입비
    yearly_fee: Mapped[int] = mapped_column(Integer, default=0, nullable=False)       # 년회비
    monthly_fee: Mapped[int] = mapped_column(Integer, default=0, nullable=False)      # 월회비
    guest_fee: Mapped[int] = mapped_column(Integer, default=0, nullable=False)        # 게스트비
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    owner = relationship("User", foreign_keys=[owner_id])
    members = relationship("ClubMember", back_populates="club")
