# 🏸 모두의 배민 (All for Badminton)

배드민턴 클럽의 **회원 관리 · 대회 운영 · 공지/일정 · 사진/영상 제작**을 한 곳에서 제공하는 통합 플랫폼입니다.

---

## 목차

- [시스템 아키텍처](#시스템-아키텍처)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [개발 환경 설정](#개발-환경-설정)
- [실행 방법](#실행-방법)
- [API 문서](#api-문서)
- [주요 기능](#주요-기능)
- [환경변수 참고](#환경변수-참고)

---

## 시스템 아키텍처

```
                        ┌─────────────────────────────────────────────────────┐
                        │                     클라이언트 (브라우저)              │
                        │              React 18 + TypeScript (PWA)             │
                        └─────────────────────┬───────────────────────────────┘
                                              │ HTTP / WebSocket
                                              ▼
                        ┌─────────────────────────────────────────────────────┐
                        │                   Nginx (포트 80)                    │
                        │            리버스 프록시 / 정적 파일 서빙               │
                        └───────────────┬─────────────────┬───────────────────┘
                                        │                 │
                        /api/*          │                 │  /*
                                        ▼                 ▼
               ┌────────────────────────────┐   ┌──────────────────────┐
               │   FastAPI Backend (8000)   │   │ Frontend Dev Server  │
               │   - REST API (/api/v1)     │   │   Vite / serve       │
               │   - JWT 인증               │   │   (포트 3000)         │
               │   - Swagger UI (/docs)     │   └──────────────────────┘
               └─────────┬────────┬─────────┘
                         │        │
           ┌─────────────┘        └───────────────────────────────────┐
           │                                                           │
           ▼                                                           ▼
┌──────────────────┐    ┌──────────────┐    ┌──────────┐   ┌──────────────────┐
│   MySQL 5.7      │    │  Redis 7     │    │  MinIO   │   │  Celery Worker   │
│   (포트 3306)    │    │  (포트 6379) │    │ (S3 호환) │   │  - 영상 생성     │
│   - 메인 DB     │    │  - 캐시/큐   │    │ (포트 9000│   │  - 푸시 알림     │
│   - 10개 테이블 │    │  - Celery    │    │  /9001)  │   └──────────────────┘
└──────────────────┘    └──────────────┘    └──────────┘
                                                  │
                        ┌─────────────────────────┘
                        │   외부 서비스
                        ├── Anthropic Claude API  (AI 대진표 생성)
                        ├── Kakao OAuth 2.0       (소셜 로그인)
                        ├── Naver OAuth 2.0       (소셜 로그인)
                        └── Google OAuth 2.0      (소셜 로그인)
```

### 데이터 흐름

```
소셜 로그인 흐름:
  브라우저 → Nginx → FastAPI → OAuth 제공자 → JWT 발급 → 브라우저 저장

AI 대진표 생성 흐름:
  관리자 요청 → FastAPI → 참가자 목록 조회 → Claude API → JSON 파싱 → DB 저장 → 응답

사진 업로드 흐름:
  브라우저 → FastAPI (Multipart) → MinIO 저장 → URL DB 기록 → 응답

영상 생성 흐름 (서버):
  요청 → FastAPI → DB 기록(pending) → Celery 큐 → Worker(FFmpeg) → MinIO 저장 → DB 업데이트(done)
```

---

## 기술 스택

### Frontend

| 분류 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | React | 18.3 |
| 언어 | TypeScript | 5.6 |
| 빌드 | Vite | 6.0 |
| 라우팅 | React Router | v6 |
| 전역 상태 | Zustand | 5.0 |
| 서버 상태 | TanStack Query | v5 |
| UI | Ant Design | 5.x |
| CSS | Tailwind CSS | 3.4 |
| HTTP | Axios | 1.7 |
| 폼 | React Hook Form + Zod | - |
| 달력 | FullCalendar | 6.1 |
| 영상 | FFmpeg.wasm | 0.12 |

### Backend

| 분류 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | FastAPI | 0.115 |
| 언어 | Python | 3.11+ |
| 패키지 관리 | **uv** | - |
| ORM | SQLAlchemy | 2.0 (async) |
| DB | MySQL | 5.7 |
| 캐시/큐 | Redis | 7 |
| 비동기 작업 | Celery | 5.4 |
| 파일 저장 | MinIO (S3 호환) | - |
| 인증 | JWT (python-jose) | - |
| LLM | Anthropic Claude API | - |
| 마이그레이션 | Alembic | 1.14 |

### Infra

| 분류 | 기술 |
|------|------|
| 컨테이너 | Docker + Docker Compose |
| 웹서버 | Nginx (리버스 프록시) |
| CI/CD | GitHub Actions |
| 모니터링 | Flower (Celery 대시보드) |

---

## 프로젝트 구조

```
ai_badminton_service/
├── .env.example               # 환경변수 템플릿
├── .gitignore
├── pyproject.toml             # uv 패키지 설정 (루트)
├── uv.lock                    # uv 의존성 잠금 파일 (루트)
├── docker-compose.yml         # 전체 서비스 오케스트레이션
├── nginx/
│   └── nginx.conf             # 리버스 프록시 설정
│
├── backend/
│   ├── requirements.txt       # Docker용 의존성
│   ├── Dockerfile
│   ├── db/
│   │   └── init.sql           # MySQL 초기화 DDL
│   └── app/
│       ├── main.py            # FastAPI 앱 진입점
│       ├── api/v1/            # API 라우터
│       │   ├── auth.py        # OAuth + JWT
│       │   ├── clubs.py       # 클럽 CRUD + 회비
│       │   ├── members.py     # 회원 관리
│       │   ├── tournaments.py # 대회 + 대진표
│       │   ├── notices.py     # 공지사항
│       │   ├── gallery.py     # 사진/영상
│       │   ├── calendar.py    # 일정
│       │   └── admin.py       # 서비스 관리자
│       ├── core/
│       │   ├── config.py      # 환경변수 (pydantic-settings)
│       │   ├── security.py    # JWT 생성/검증
│       │   ├── dependencies.py# FastAPI Depends (RBAC)
│       │   └── exceptions.py  # 커스텀 예외
│       ├── db/
│       │   ├── base.py        # DeclarativeBase + TimestampMixin
│       │   ├── session.py     # AsyncSession 팩토리
│       │   └── models/        # SQLAlchemy ORM 모델 (10개)
│       ├── schemas/           # Pydantic v2 Request/Response 스키마
│       ├── llm/
│       │   └── bracket.py     # Claude API 대진표 생성
│       └── tasks/
│           ├── __init__.py    # Celery 앱 설정
│           ├── video.py       # 영상 생성 태스크
│           └── notification.py# 푸시 알림 태스크
│
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── Dockerfile
    └── src/
        ├── App.tsx            # 라우터 정의
        ├── main.tsx           # 앱 진입점
        ├── api/               # Axios API 클라이언트
        ├── stores/            # Zustand 전역 상태
        ├── types/             # TypeScript 타입 정의
        ├── utils/             # dday 계산 등 유틸
        ├── lib/
        │   └── ffmpeg.ts      # FFmpeg.wasm 래퍼
        ├── components/
        │   └── common/        # MainLayout 등 공통 컴포넌트
        └── pages/
            ├── LandingPage.tsx
            ├── ProfilePage.tsx
            ├── auth/          # 로그인, OAuth 콜백
            ├── clubs/         # 클럽 목록, 홈, 회원, 회비
            ├── tournaments/   # 대회 목록, 생성, 상세(대진표)
            ├── notices/       # 공지사항
            ├── gallery/       # 사진/영상 갤러리
            ├── calendar/      # FullCalendar 일정
            └── admin/         # 서비스 관리자
```

---

## 개발 환경 설정

### 사전 요구사항

| 도구 | 최소 버전 | 설치 확인 |
|------|-----------|-----------|
| Docker | 24.0+ | `docker --version` |
| Docker Compose | 2.20+ | `docker compose version` |
| Node.js | 20.0+ | `node --version` |
| Python | 3.11+ | `python --version` |
| uv | 최신 | `uv --version` |

**uv 설치 (macOS / Linux):**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**uv 설치 (Windows):**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 1. 저장소 클론 및 환경변수 설정

```bash
git clone <repo-url>
cd ai_badminton_service

# 환경변수 파일 생성
cp .env.example .env
```

**.env 필수 항목 입력:**

```dotenv
# 반드시 변경해야 하는 항목
SECRET_KEY=<랜덤 32자 이상 문자열>  # python -c "import secrets; print(secrets.token_hex(32))"

# Anthropic API (AI 대진표 생성)
ANTHROPIC_API_KEY=sk-ant-...

# 소셜 로그인 (최소 1개 필요)
KAKAO_CLIENT_ID=<카카오 앱 키>
GOOGLE_CLIENT_ID=<구글 클라이언트 ID>
GOOGLE_CLIENT_SECRET=<구글 클라이언트 시크릿>
```

> **OAuth 앱 설정 시 Redirect URI:**
> - 카카오: `http://localhost:3000/auth/callback/kakao`
> - 네이버: `http://localhost:3000/auth/callback/naver`
> - 구글: `http://localhost:3000/auth/callback/google`

---

## 실행 방법

### A. Docker Compose (권장 — 전체 환경)

```bash
# 모든 서비스 시작 (백그라운드)
docker compose up -d

# 로그 확인
docker compose logs -f backend
docker compose logs -f frontend

# 특정 서비스 재시작
docker compose restart backend

# 전체 종료
docker compose down

# 볼륨까지 완전 삭제 (DB 초기화 포함)
docker compose down -v
```

**서비스 접근:**

| 서비스 | URL |
|--------|-----|
| 웹 앱 | http://localhost |
| API | http://localhost/api/v1 |
| Swagger UI | http://localhost/docs |
| MinIO 콘솔 | http://localhost:9001 (minioadmin / minioadmin) |
| Flower (Celery) | http://localhost:5555 |
| MySQL | localhost:3306 (afbuser / afbpassword) |

---

### B. 로컬 개발 환경 (핫 리로드)

#### 인프라 서비스만 Docker로 실행

```bash
# DB, Redis, MinIO만 컨테이너로 실행
docker compose up -d mysql redis minio
```

#### 백엔드 (uv)

> `pyproject.toml`과 `uv.lock`이 **루트 디렉토리**에 있으므로 모든 uv 명령어는 루트에서 실행합니다.

```bash
# 프로젝트 루트에서 실행
cd ai_badminton_service

# 의존성 설치 (가상환경 자동 생성: .venv/)
uv sync

# 개발 서버 실행 (핫 리로드)
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir backend/app

# Celery 워커 실행 (별도 터미널)
uv run celery -A app.tasks celery_app worker --loglevel=info

# 개발 의존성 포함 설치
uv sync --dev

# 코드 포맷
uv run black backend/app/
uv run isort backend/app/

# 린트
uv run flake8 backend/app/

# 테스트
uv run pytest backend/
```

#### 프론트엔드 (npm)

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행 (포트 3000, 핫 리로드)
npm run dev

# 타입 체크 + 빌드
npm run build

# 빌드 결과 미리보기
npm run preview

# 린트
npm run lint
```

> 프론트엔드 개발 서버는 `/api/*` 요청을 `http://localhost:8000`으로 자동 프록시합니다 (`vite.config.ts`).

---

### C. DB 마이그레이션 (Alembic)

```bash
# 프로젝트 루트에서 실행
cd ai_badminton_service

# 마이그레이션 파일 생성
uv run alembic -c backend/alembic.ini revision --autogenerate -m "설명"

# 마이그레이션 적용
uv run alembic -c backend/alembic.ini upgrade head

# 이전 버전으로 롤백
uv run alembic -c backend/alembic.ini downgrade -1

# 마이그레이션 이력 확인
uv run alembic -c backend/alembic.ini history
```

> **초기 실행 시:** `docker-compose.yml`의 MySQL 서비스가 `backend/db/init.sql`을 자동으로 실행하므로 별도 마이그레이션 없이 테이블이 생성됩니다.

---

## API 문서

서버 실행 후 아래 URL에서 자동 생성된 API 문서를 확인할 수 있습니다.

| 문서 | URL |
|------|-----|
| Swagger UI (인터랙티브) | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| OpenAPI JSON | http://localhost:8000/openapi.json |

### API 기본 규칙

**Base URL:** `/api/v1`

**인증 헤더:**
```
Authorization: Bearer <access_token>
```

**성공 응답 포맷:**
```json
{
  "success": true,
  "data": { ... },
  "message": "ok",
  "pagination": { "page": 1, "size": 20, "total": 100 }
}
```

**에러 응답 포맷:**
```json
{
  "success": false,
  "error": { "code": "CLUB_NOT_FOUND", "message": "클럽을 찾을 수 없습니다." }
}
```

### 주요 엔드포인트 요약

| 도메인 | 엔드포인트 | 설명 |
|--------|-----------|------|
| **인증** | `GET /auth/kakao` | 카카오 OAuth 리다이렉트 URL |
| | `GET /auth/kakao/callback?code=` | 카카오 콜백 → JWT 발급 |
| | `POST /auth/refresh` | Access Token 재발급 |
| | `GET /auth/me` | 현재 사용자 정보 |
| **클럽** | `GET /clubs?query=배드민턴` | 클럽 검색 |
| | `GET /clubs?lat=37.5&lng=127.0&radius=5000` | 반경 내 클럽 |
| | `POST /clubs` | 클럽 생성 |
| | `GET /clubs/{id}/fees` | 회비 목록 |
| **회원** | `POST /clubs/{id}/members/join` | 가입 요청 |
| | `PUT /clubs/{id}/members/{mid}/approve` | 가입 승인 |
| **대회** | `POST /clubs/{id}/tournaments` | 대회 생성 |
| | `POST /tournaments/{id}/bracket/generate` | AI 대진표 생성 |
| | `PUT /tournaments/{id}/matches/{mid}/score` | 경기 결과 입력 |
| | `GET /tournaments/{id}/standings` | 순위표 |
| **갤러리** | `POST /clubs/{id}/photos` | 사진 업로드 (Multipart) |
| | `POST /clubs/{id}/videos/generate` | 영상 생성 요청 |
| **달력** | `GET /clubs/{id}/events` | 일정 목록 |
| | `POST /clubs/{id}/events` | 일정 등록 |

---

## 주요 기능

### 1. 소셜 로그인 (OAuth 2.0)
카카오 / 네이버 / 구글 소셜 로그인을 지원합니다. JWT Access Token(15분) + Refresh Token(30일) 방식으로 인증하며, Axios 인터셉터가 토큰 만료 시 자동으로 갱신합니다.

### 2. 클럽 관리 (RBAC)

| 역할 | 권한 |
|------|------|
| `service_admin` | 서비스 전체 관리, 글로벌 공지 |
| `admin` | 클럽 회원 승인/관리, 대회/공지 CRUD, 회비 관리 |
| `member` | 조회, 일정 등록, 사진 업로드 |
| `guest` | 제한적 조회 |

### 3. AI 대진표 자동 생성
Claude API를 이용해 참가자 목록을 전달하면 공정한 대진표 JSON을 반환받아 DB에 저장합니다.
- 리그전: 모든 참가자가 1회씩 대전
- 토너먼트: 싱글/더블 엘리미네이션 자동 배치
- 같은 클럽 선수끼리 초반에 만나지 않도록 배치

### 4. 사진 갤러리 + 영상 자동 생성
- 사진은 MinIO(S3 호환)에 저장
- 선택한 사진들로 슬라이드쇼 영상 생성 (전환 효과: 페이드/슬라이드/줌)
- Celery를 통한 비동기 처리 (pending → processing → done)

### 5. 클럽 달력 + D-Day
FullCalendar 기반 월/주/일 뷰를 제공합니다. 이벤트에 D-Day 레이블 설정 시 `D-3`, `D-Day`, `D+1` 형태로 자동 계산·표시됩니다.

---

## 환경변수 참고

전체 환경변수 목록은 [.env.example](.env.example)을 참고하세요.

| 변수 | 필수 | 설명 |
|------|------|------|
| `SECRET_KEY` | ✅ | JWT 서명 키 (32자 이상 랜덤) |
| `DB_HOST` | ✅ | MySQL 호스트 (예: `prod-db.internal.company.com`) |
| `DB_PORT` | ✅ | MySQL 포트 (기본 `3306`) |
| `DB_USER` | ✅ | MySQL 사용자 |
| `DB_PASSWORD` | ✅ | MySQL 비밀번호 |
| `DB_NAME` | ✅ | MySQL 데이터베이스명 |
| `REDIS_URL` | ✅ | Redis 연결 URL |
| `ANTHROPIC_API_KEY` | ✅ | Claude API 키 |
| `KAKAO_CLIENT_ID` | 선택 | 카카오 로그인 앱 키 |
| `NAVER_CLIENT_ID` | 선택 | 네이버 로그인 클라이언트 ID |
| `GOOGLE_CLIENT_ID` | 선택 | 구글 OAuth 클라이언트 ID |
| `MINIO_ACCESS_KEY` | ✅ | MinIO 접근 키 |
| `MINIO_SECRET_KEY` | ✅ | MinIO 시크릿 키 |

---

## 트러블슈팅

**MySQL 연결 실패:**
```bash
# MySQL 컨테이너 헬스 체크
docker compose ps mysql
# 로그 확인
docker compose logs mysql
```

**Celery 태스크가 실행되지 않을 때:**
```bash
# 워커 상태 확인
docker compose logs celery_worker
# Flower 대시보드에서 큐 확인
open http://localhost:5555
```

**MinIO 버킷 접근 오류:**
```bash
# MinIO 콘솔에서 버킷 수동 생성
open http://localhost:9001
# ID: minioadmin / PW: minioadmin
# 버킷명: afb-photos, afb-videos
```

**프론트엔드 API 프록시 오류 (로컬 개발):**
```bash
# vite.config.ts의 proxy target이 백엔드 포트(8000)와 일치하는지 확인
# .env가 없는 경우
cp .env.example .env
```
