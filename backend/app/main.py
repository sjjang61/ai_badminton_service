from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1 import auth, clubs, members, tournaments, notices, gallery, calendar, admin
from app.core.config import settings

app = FastAPI(
    title="모두의 배민 API",
    description="All for Badminton Club Management Service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS 미들웨어
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.APP_ENV == "development" else settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"

# 라우터 등록
app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["auth"])
app.include_router(clubs.router, prefix=f"{API_PREFIX}/clubs", tags=["clubs"])
app.include_router(members.router, prefix=f"{API_PREFIX}", tags=["members"])
app.include_router(tournaments.router, prefix=f"{API_PREFIX}", tags=["tournaments"])
app.include_router(notices.router, prefix=f"{API_PREFIX}", tags=["notices"])
app.include_router(gallery.router, prefix=f"{API_PREFIX}", tags=["gallery"])
app.include_router(calendar.router, prefix=f"{API_PREFIX}", tags=["calendar"])
app.include_router(admin.router, prefix=f"{API_PREFIX}/admin", tags=["admin"])


@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 초기화"""
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    logger.info("모두의 배민 API 서버 시작")


@app.on_event("shutdown")
async def shutdown_event():
    """애플리케이션 종료 시 정리"""
    from app.db.session import engine
    await engine.dispose()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """전역 예외 핸들러"""
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "서버 내부 오류가 발생했습니다.",
            },
        },
    )


@app.get("/health", tags=["health"])
async def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "ok", "service": "모두의 배민 API"}
