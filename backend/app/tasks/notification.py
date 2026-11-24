from app.tasks import celery_app


@celery_app.task(name="app.tasks.notification.send_push_notification")
def send_push_notification(user_id: int, title: str, body: str, data: dict = None):
    """푸시 알림 전송 Celery 태스크

    향후 FCM (Firebase Cloud Messaging) 또는 Web Push 연동 예정.
    현재는 로그 출력으로 대체.
    """
    import logging

    logger = logging.getLogger(__name__)
    logger.info(
        f"[Notification] user_id={user_id} | title={title} | body={body} | data={data}"
    )
    # TODO: FCM 연동
    # from firebase_admin import messaging
    # message = messaging.Message(
    #     notification=messaging.Notification(title=title, body=body),
    #     data=data or {},
    #     token=get_user_fcm_token(user_id),
    # )
    # messaging.send(message)


@celery_app.task(name="app.tasks.notification.send_club_notification")
def send_club_notification(club_id: int, title: str, body: str, exclude_user_id: int = None):
    """클럽 전체 회원에게 알림 전송"""
    import asyncio
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
    from sqlalchemy import select
    from app.core.config import settings
    from app.db.models.member import ClubMember

    async def process():
        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        SessionLocal = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )
        async with SessionLocal() as db:
            stmt = select(ClubMember).where(
                ClubMember.club_id == club_id,
                ClubMember.status == "approved",
                ClubMember.is_deleted == 0,
            )
            if exclude_user_id:
                stmt = stmt.where(ClubMember.user_id != exclude_user_id)
            result = await db.execute(stmt)
            members = result.scalars().all()

            for member in members:
                send_push_notification.delay(member.user_id, title, body)

        await engine.dispose()

    asyncio.run(process())
