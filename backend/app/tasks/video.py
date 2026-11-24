from app.tasks import celery_app


@celery_app.task(name="app.tasks.video.generate_video_task", bind=True, max_retries=3)
def generate_video_task(self, video_id: int):
    """영상 생성 Celery 태스크

    gallery_videos 레코드를 processing → done/failed 로 상태 전환.
    실제 FFmpeg 처리는 클라이언트(FFmpeg.wasm)에서 수행하거나
    서버사이드 FFmpeg 설치 후 여기서 처리 가능.
    """
    import asyncio
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
    from sqlalchemy import select
    from app.core.config import settings
    from app.db.models.gallery import GalleryVideo, GalleryPhoto

    async def process():
        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        SessionLocal = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )
        async with SessionLocal() as db:
            result = await db.execute(
                select(GalleryVideo).where(GalleryVideo.id == video_id)
            )
            video = result.scalar_one_or_none()
            if not video:
                return

            try:
                video.status = "processing"
                await db.commit()

                # 실제 FFmpeg 서버사이드 처리 자리 (placeholder)
                # 1. photo_ids로 MinIO에서 사진 다운로드
                # 2. FFmpeg 명령 실행 (subprocess)
                # 3. 결과 MP4를 MinIO에 업로드
                # 4. video_url 업데이트

                # 현재는 클라이언트(FFmpeg.wasm)에서 처리하는 것을 전제로
                # 서버 태스크는 상태 추적만 수행
                video.status = "done"
                await db.commit()

            except Exception as exc:
                video.status = "failed"
                await db.commit()
                raise self.retry(exc=exc, countdown=60)

        await engine.dispose()

    asyncio.run(process())
