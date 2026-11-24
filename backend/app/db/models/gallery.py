from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Enum, Integer, ForeignKey, JSON, BigInteger
from app.db.base import Base, TimestampMixin


class GalleryPhoto(Base, TimestampMixin):
    """갤러리 사진 모델"""

    __tablename__ = "gallery_photos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    club_id: Mapped[int] = mapped_column(ForeignKey("clubs.id"), nullable=False)
    uploader_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    file_name: Mapped[str] = mapped_column(String(300), nullable=False)
    file_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_size: Mapped[int | None] = mapped_column(BigInteger)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    club = relationship("Club", foreign_keys=[club_id])
    uploader = relationship("User", foreign_keys=[uploader_id])


class GalleryVideo(Base, TimestampMixin):
    """갤러리 영상 모델"""

    __tablename__ = "gallery_videos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    club_id: Mapped[int] = mapped_column(ForeignKey("clubs.id"), nullable=False)
    title: Mapped[str | None] = mapped_column(String(200))
    video_url: Mapped[str | None] = mapped_column(String(1000))
    bgm_name: Mapped[str | None] = mapped_column(String(200))
    bgm_url: Mapped[str | None] = mapped_column(String(1000))
    photo_ids: Mapped[list | None] = mapped_column(JSON)
    transition: Mapped[str | None] = mapped_column(String(100))
    duration: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(
        Enum("pending", "processing", "done", "failed"),
        default="pending",
        nullable=False,
    )
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    club = relationship("Club", foreign_keys=[club_id])
    creator = relationship("User", foreign_keys=[created_by])
