from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func
from datetime import datetime


class Base(DeclarativeBase):
    """SQLAlchemy 선언형 기반 클래스"""
    pass


class TimestampMixin:
    """공통 타임스탬프 및 소프트 삭제 컬럼"""

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=True
    )
    is_deleted: Mapped[int] = mapped_column(default=0, nullable=False)
