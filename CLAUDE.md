# 모두의 배민 (All for Badminton) — CLAUDE.md

> AI-assisted development guide for the "모두의 배민" badminton club management service.
> This document defines the project structure, technology stack, domain model, API design,
> and implementation guidelines for all contributors and AI coding agents.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | 모두의 배민 (All for Badminton) |
| 약칭 | AFB |
| 목적 | 배드민턴 클럽의 회원 관리, 대회 운영, 공지·일정 관리, 사진/영상 제작 등을 한 곳에서 제공하는 통합 플랫폼 |
| 대상 | 배드민턴 동호회 운영자, 회원, 게스트 |
| 배포 환경 | Web (PC·Mobile Responsive), PWA 지원 |

---

## 2. 기술 스택

### 2.1 Frontend

```
Framework   : React 18 + TypeScript
Bundler     : Vite
Router      : React Router v6
State       : Zustand (전역) + TanStack Query v5 (서버 상태)
UI Library  : Ant Design 5.x (기본 컴포넌트)
CSS         : Tailwind CSS + CSS Modules (커스텀 스타일)
Map         : Kakao Maps JavaScript SDK (클럽 지도 검색)
Calendar    : FullCalendar (React 버전)
Media       : FFmpeg.wasm (브라우저 내 동영상 생성)
Auth        : Kakao / Naver / Google OAuth 2.0 (소셜 로그인)
HTTP Client : Axios + TanStack Query
Form        : React Hook Form + Zod (유효성 검사)
```

### 2.2 Backend

```
Framework   : FastAPI (Python 3.11+)
ORM         : SQLAlchemy 2.0 (async)
DB          : MySQL 5.7
Cache/Queue : Redis + Celery (비동기 작업: 영상 생성, 알림 등)
File Storage: MinIO (S3 호환, 사진·영상 저장)
Auth        : JWT (Access Token 15분 / Refresh Token 30일)
소셜 로그인  : python-social-auth 또는 직접 OAuth 구현
LLM         : Anthropic Claude API (대진표 자동 생성)
Docs        : FastAPI 자동 Swagger UI (/docs)
```

### 2.3 Infra

```
Container   : Docker + Docker Compose
Web Server  : Nginx (리버스 프록시)
CI/CD       : GitHub Actions
OS          : CentOS 7 / Ubuntu 22.04
Monitoring  : Flower (Celery 모니터링)
```

---

## 3. 프로젝트 디렉터리 구조

```
afb/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/              # Axios 인스턴스, API 호출 함수
│   │   ├── assets/           # 이미지, 아이콘, 폰트
│   │   ├── components/
│   │   │   ├── common/       # Button, Modal, Input 등 공통 컴포넌트
│   │   │   ├── club/         # 클럽 관련 컴포넌트
│   │   │   ├── member/       # 회원 관련 컴포넌트
│   │   │   ├── tournament/   # 대회 관련 컴포넌트
│   │   │   ├── notice/       # 공지사항 컴포넌트
│   │   │   ├── gallery/      # 사진/영상 컴포넌트
│   │   │   └── calendar/     # 달력 컴포넌트
│   │   ├── hooks/            # Custom React Hooks
│   │   ├── pages/            # 페이지 컴포넌트 (라우터 단위)
│   │   ├── stores/           # Zustand 스토어
│   │   ├── types/            # TypeScript 타입 정의
│   │   ├── utils/            # 유틸 함수 (날짜, 포맷 등)
│   │   ├── lib/
│   │   │   └── ffmpeg.ts     # FFmpeg.wasm 래퍼
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── auth.py         # 소셜 로그인, JWT 발급
│   │   │   │   ├── clubs.py        # 클럽 CRUD
│   │   │   │   ├── members.py      # 회원 관리
│   │   │   │   ├── tournaments.py  # 대회 관리
│   │   │   │   ├── notices.py      # 공지사항
│   │   │   │   ├── gallery.py      # 사진/영상 관리
│   │   │   │   ├── calendar.py     # 달력/일정
│   │   │   │   └── admin.py        # 서비스 관리자
│   │   ├── core/
│   │   │   ├── config.py       # 환경변수 설정 (pydantic-settings)
│   │   │   ├── security.py     # JWT, 비밀번호 해시
│   │   │   ├── dependencies.py # FastAPI Depends
│   │   │   └── exceptions.py   # 커스텀 예외
│   │   ├── db/
│   │   │   ├── base.py         # Base 모델 (created_at, updated_at, is_deleted)
│   │   │   ├── session.py      # AsyncSession 팩토리
│   │   │   └── models/         # SQLAlchemy ORM 모델
│   │   ├── schemas/            # Pydantic 스키마 (Request/Response)
│   │   ├── services/           # 비즈니스 로직
│   │   ├── tasks/              # Celery 태스크
│   │   │   ├── video.py        # 영상 생성 작업
│   │   │   └── notification.py # 푸시/알림 작업
│   │   ├── llm/
│   │   │   └── bracket.py      # Claude API 대진표 생성
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
└── .env.example
```

---

## 4. 환경변수 (.env)

```dotenv
# ── App ─────────────────────────────────────────────────
APP_ENV=development          # development | production
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

# ── Database ─────────────────────────────────────────────
DATABASE_URL=mysql+aiomysql://user:password@mysql:3306/afb_db

# ── Redis / Celery ───────────────────────────────────────
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# ── MinIO ────────────────────────────────────────────────
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_PHOTOS=afb-photos
MINIO_BUCKET_VIDEOS=afb-videos

# ── Social OAuth ─────────────────────────────────────────
KAKAO_CLIENT_ID=
KAKAO_REDIRECT_URI=https://yourdomain.com/auth/kakao/callback

NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_REDIRECT_URI=https://yourdomain.com/auth/naver/callback

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback

# ── Kakao Maps ───────────────────────────────────────────
VITE_KAKAO_MAP_APP_KEY=

# ── Anthropic (LLM) ──────────────────────────────────────
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-opus-4-5-20251101
```

---

## 5. 데이터베이스 ERD (핵심 테이블)

### 5.1 공통 Base 컬럼
모든 테이블은 아래 컬럼을 상속합니다.
```
id          BIGINT AUTO_INCREMENT PRIMARY KEY
created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at  DATETIME ON UPDATE CURRENT_TIMESTAMP
is_deleted  TINYINT(1) DEFAULT 0   -- Soft Delete
```

### 5.2 테이블 정의

#### users
```sql
CREATE TABLE users (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  provider     ENUM('kakao','naver','google') NOT NULL,
  provider_id  VARCHAR(100) NOT NULL,           -- 소셜 고유 ID
  email        VARCHAR(255),
  nickname     VARCHAR(50) NOT NULL,
  profile_img  VARCHAR(500),
  role         ENUM('user','service_admin') DEFAULT 'user',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME ON UPDATE CURRENT_TIMESTAMP,
  is_deleted   TINYINT(1) DEFAULT 0,
  UNIQUE KEY uq_provider (provider, provider_id)
);
```

#### clubs
```sql
CREATE TABLE clubs (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  gym_name      VARCHAR(200),          -- 체육관명
  gym_address   VARCHAR(500),          -- 도로명 주소
  latitude      DECIMAL(10,7),         -- GPS 위도
  longitude     DECIMAL(11,7),         -- GPS 경도
  monthly_fee   INT DEFAULT 0,         -- 월 회비 (원)
  owner_id      BIGINT NOT NULL,       -- 클럽 최초 생성자 (관리자)
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME ON UPDATE CURRENT_TIMESTAMP,
  is_deleted    TINYINT(1) DEFAULT 0,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);
```

#### club_members
```sql
CREATE TABLE club_members (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  club_id    BIGINT NOT NULL,
  user_id    BIGINT NOT NULL,
  role       ENUM('admin','member','guest') DEFAULT 'member',
  status     ENUM('pending','approved','rejected','banned') DEFAULT 'pending',
  joined_at  DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  UNIQUE KEY uq_club_user (club_id, user_id),
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  FOREIGN KEY (user_id)  REFERENCES users(id)
);
```

#### club_fees (회비 관리)
```sql
CREATE TABLE club_fees (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  club_id     BIGINT NOT NULL,
  user_id     BIGINT NOT NULL,
  amount      INT NOT NULL,
  fee_month   DATE NOT NULL,           -- 납부 대상 월 (YYYY-MM-01)
  paid_at     DATETIME,
  memo        VARCHAR(500),
  created_by  BIGINT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME ON UPDATE CURRENT_TIMESTAMP,
  is_deleted  TINYINT(1) DEFAULT 0,
  FOREIGN KEY (club_id)    REFERENCES clubs(id),
  FOREIGN KEY (user_id)    REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

#### tournaments
```sql
CREATE TABLE tournaments (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  club_id      BIGINT,                  -- NULL이면 외부 대회
  name         VARCHAR(200) NOT NULL,
  type         ENUM('internal','external') DEFAULT 'internal',
  match_type   ENUM('singles','doubles','mixed') DEFAULT 'singles',
  format       ENUM('round_robin','single_elimination','double_elimination') DEFAULT 'round_robin',
  start_date   DATE,
  end_date     DATE,
  location     VARCHAR(500),
  description  TEXT,
  status       ENUM('draft','ongoing','finished') DEFAULT 'draft',
  created_by   BIGINT NOT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME ON UPDATE CURRENT_TIMESTAMP,
  is_deleted   TINYINT(1) DEFAULT 0,
  FOREIGN KEY (club_id)    REFERENCES clubs(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

#### tournament_participants
```sql
CREATE TABLE tournament_participants (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  tournament_id   BIGINT NOT NULL,
  user_id         BIGINT,              -- 클럽 회원이면 user_id 연결
  player_name     VARCHAR(100) NOT NULL, -- 외부 참가자는 이름만
  partner_name    VARCHAR(100),        -- 복식 파트너
  wins            INT DEFAULT 0,
  losses          INT DEFAULT 0,
  points_won      INT DEFAULT 0,
  points_lost     INT DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME ON UPDATE CURRENT_TIMESTAMP,
  is_deleted      TINYINT(1) DEFAULT 0,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
  FOREIGN KEY (user_id)       REFERENCES users(id)
);
```

#### tournament_matches
```sql
CREATE TABLE tournament_matches (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  tournament_id   BIGINT NOT NULL,
  round           INT NOT NULL,         -- 라운드 번호
  match_number    INT NOT NULL,         -- 대진 번호
  player1_id      BIGINT NOT NULL,      -- tournament_participants.id
  player2_id      BIGINT NOT NULL,
  score_player1   INT,
  score_player2   INT,
  winner_id       BIGINT,               -- tournament_participants.id
  scheduled_at    DATETIME,
  played_at       DATETIME,
  status          ENUM('pending','ongoing','finished') DEFAULT 'pending',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME ON UPDATE CURRENT_TIMESTAMP,
  is_deleted      TINYINT(1) DEFAULT 0,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
  FOREIGN KEY (player1_id)    REFERENCES tournament_participants(id),
  FOREIGN KEY (player2_id)    REFERENCES tournament_participants(id)
);
```

#### notices
```sql
CREATE TABLE notices (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  club_id     BIGINT,                  -- NULL이면 서비스 전체 공지
  title       VARCHAR(300) NOT NULL,
  content     TEXT NOT NULL,
  is_pinned   TINYINT(1) DEFAULT 0,
  scope       ENUM('global','club') DEFAULT 'club',
  created_by  BIGINT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME ON UPDATE CURRENT_TIMESTAMP,
  is_deleted  TINYINT(1) DEFAULT 0,
  FOREIGN KEY (club_id)    REFERENCES clubs(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

#### gallery_photos
```sql
CREATE TABLE gallery_photos (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  club_id     BIGINT NOT NULL,
  uploader_id BIGINT NOT NULL,
  file_name   VARCHAR(300) NOT NULL,
  file_url    VARCHAR(1000) NOT NULL,  -- MinIO URL
  file_size   BIGINT,
  sort_order  INT DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME ON UPDATE CURRENT_TIMESTAMP,
  is_deleted  TINYINT(1) DEFAULT 0,
  FOREIGN KEY (club_id)     REFERENCES clubs(id),
  FOREIGN KEY (uploader_id) REFERENCES users(id)
);
```

#### gallery_videos (생성된 영상)
```sql
CREATE TABLE gallery_videos (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  club_id       BIGINT NOT NULL,
  title         VARCHAR(200),
  video_url     VARCHAR(1000),         -- MinIO URL
  bgm_name      VARCHAR(200),          -- 선택된 무료 음원명
  bgm_url       VARCHAR(1000),
  photo_ids     JSON,                  -- 사용된 photo id 배열
  transition    VARCHAR(100),          -- 전환 애니메이션 타입
  duration      INT,                   -- 초 단위
  status        ENUM('pending','processing','done','failed') DEFAULT 'pending',
  created_by    BIGINT NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME ON UPDATE CURRENT_TIMESTAMP,
  is_deleted    TINYINT(1) DEFAULT 0,
  FOREIGN KEY (club_id)    REFERENCES clubs(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

#### calendar_events
```sql
CREATE TABLE calendar_events (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  club_id      BIGINT,                 -- NULL이면 개인 일정
  user_id      BIGINT NOT NULL,
  title        VARCHAR(300) NOT NULL,
  description  TEXT,
  start_dt     DATETIME NOT NULL,
  end_dt       DATETIME,
  all_day      TINYINT(1) DEFAULT 0,
  color        VARCHAR(20),            -- 이벤트 색상 hex
  dday_label   VARCHAR(100),           -- D-Day 레이블 (예: "클럽 대회")
  is_public    TINYINT(1) DEFAULT 1,   -- 클럽 회원 공개 여부
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME ON UPDATE CURRENT_TIMESTAMP,
  is_deleted   TINYINT(1) DEFAULT 0,
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 6. API 설계

### 6.1 공통 규칙

- Base URL: `/api/v1`
- 인증: `Authorization: Bearer <access_token>` (JWT)
- 응답 포맷:
```json
{
  "success": true,
  "data": { ... },
  "message": "ok",
  "pagination": { "page": 1, "size": 20, "total": 100 }
}
```
- 에러 포맷:
```json
{
  "success": false,
  "error": { "code": "CLUB_NOT_FOUND", "message": "클럽을 찾을 수 없습니다." }
}
```

### 6.2 Auth API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/auth/kakao` | 카카오 OAuth 리다이렉트 |
| GET | `/auth/kakao/callback` | 카카오 콜백, JWT 발급 |
| GET | `/auth/naver` | 네이버 OAuth 리다이렉트 |
| GET | `/auth/naver/callback` | 네이버 콜백, JWT 발급 |
| GET | `/auth/google` | 구글 OAuth 리다이렉트 |
| GET | `/auth/google/callback` | 구글 콜백, JWT 발급 |
| POST | `/auth/refresh` | Access Token 재발급 |
| POST | `/auth/logout` | 로그아웃 (Refresh Token 무효화) |
| GET | `/auth/me` | 현재 사용자 정보 |

### 6.3 Club API

| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/clubs` | Public | 클럽 목록 (지도 좌표·이름 검색) |
| POST | `/clubs` | 로그인 | 클럽 생성 (생성자 → 관리자) |
| GET | `/clubs/{club_id}` | Public | 클럽 상세 |
| PUT | `/clubs/{club_id}` | 관리자 | 클럽 수정 |
| DELETE | `/clubs/{club_id}` | 관리자 | 클럽 삭제 |
| GET | `/clubs/{club_id}/fees` | 관리자·회원 | 회비 목록 |
| POST | `/clubs/{club_id}/fees` | 관리자 | 회비 등록 |
| PUT | `/clubs/{club_id}/fees/{fee_id}` | 관리자 | 회비 수정 |
| DELETE | `/clubs/{club_id}/fees/{fee_id}` | 관리자 | 회비 삭제 |

### 6.4 Member API

| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/clubs/{club_id}/members` | 관리자·회원 | 회원 목록 |
| POST | `/clubs/{club_id}/members/join` | 로그인 | 가입 요청 |
| PUT | `/clubs/{club_id}/members/{member_id}/approve` | 관리자 | 가입 승인 |
| PUT | `/clubs/{club_id}/members/{member_id}/reject` | 관리자 | 가입 거절 |
| PUT | `/clubs/{club_id}/members/{member_id}/role` | 관리자 | 역할 변경 |
| DELETE | `/clubs/{club_id}/members/{member_id}` | 관리자 | 회원 내보내기 |

### 6.5 Tournament API

| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/clubs/{club_id}/tournaments` | 회원 | 대회 목록 |
| POST | `/clubs/{club_id}/tournaments` | 관리자 | 대회 생성 |
| GET | `/clubs/{club_id}/tournaments/{t_id}` | 회원 | 대회 상세 |
| PUT | `/clubs/{club_id}/tournaments/{t_id}` | 관리자 | 대회 수정 |
| DELETE | `/clubs/{club_id}/tournaments/{t_id}` | 관리자 | 대회 삭제 |
| GET | `/tournaments/{t_id}/participants` | 회원 | 참가자 목록 |
| POST | `/tournaments/{t_id}/participants` | 관리자 | 참가자 추가 |
| DELETE | `/tournaments/{t_id}/participants/{p_id}` | 관리자 | 참가자 제거 |
| GET | `/tournaments/{t_id}/bracket` | 회원 | 대진표 조회 |
| POST | `/tournaments/{t_id}/bracket/generate` | 관리자 | LLM 대진표 생성 |
| PUT | `/tournaments/{t_id}/matches/{m_id}/score` | 관리자 | 경기 결과 입력 |
| GET | `/tournaments/{t_id}/standings` | 회원 | 순위표 (승패·득실차) |

### 6.6 Notice API

| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/notices` | Public | 서비스 전체 공지 목록 |
| POST | `/notices` | 서비스관리자 | 서비스 전체 공지 작성 |
| GET | `/clubs/{club_id}/notices` | 회원 | 클럽 공지 목록 |
| POST | `/clubs/{club_id}/notices` | 관리자 | 클럽 공지 작성 |
| PUT | `/clubs/{club_id}/notices/{n_id}` | 관리자 | 공지 수정 |
| DELETE | `/clubs/{club_id}/notices/{n_id}` | 관리자 | 공지 삭제 |

### 6.7 Gallery API

| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/clubs/{club_id}/photos` | 회원 | 사진 목록 |
| POST | `/clubs/{club_id}/photos` | 회원 | 사진 업로드 (Multipart) |
| DELETE | `/clubs/{club_id}/photos/{photo_id}` | 관리자·업로더 | 사진 삭제 |
| POST | `/clubs/{club_id}/videos/generate` | 회원 | 영상 생성 요청 (Celery) |
| GET | `/clubs/{club_id}/videos` | 회원 | 영상 목록 |
| GET | `/clubs/{club_id}/videos/{video_id}` | 회원 | 영상 상태·URL 조회 |
| GET | `/bgm/list` | 로그인 | 무료 음원 목록 |

### 6.8 Calendar API

| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/clubs/{club_id}/events` | 회원 | 클럽 일정 목록 |
| POST | `/clubs/{club_id}/events` | 관리자·회원 | 일정 등록 |
| PUT | `/clubs/{club_id}/events/{event_id}` | 등록자·관리자 | 일정 수정 |
| DELETE | `/clubs/{club_id}/events/{event_id}` | 등록자·관리자 | 일정 삭제 |

---

## 7. 기능별 구현 가이드

### 7.1 소셜 로그인 구현

**흐름**:
1. 프론트엔드에서 `/api/v1/auth/{provider}` 로 리다이렉트 URL 요청
2. 백엔드가 OAuth 제공자 인증 URL 반환
3. 사용자 로그인 후 callback 엔드포인트로 `code` 전달
4. 백엔드 → 제공자에 `code`로 `access_token` 교환 → 사용자 프로필 조회
5. `users` 테이블에 `upsert` (신규면 생성, 기존이면 조회)
6. JWT `access_token` + `refresh_token` 생성 후 프론트엔드로 전달
   - 방법: 쿼리 파라미터로 리다이렉트하거나 HttpOnly Cookie 사용 (권장)

**providers.py 예시 구조**:
```python
class OAuthProvider(ABC):
    @abstractmethod
    async def get_authorization_url(self) -> str: ...

    @abstractmethod
    async def get_user_info(self, code: str) -> OAuthUserInfo: ...

class KakaoOAuth(OAuthProvider): ...
class NaverOAuth(OAuthProvider): ...
class GoogleOAuth(OAuthProvider): ...
```

### 7.2 클럽 지도 검색 (Kakao Maps)

**프론트엔드 구현**:
- `GET /api/v1/clubs?lat=37.5&lng=127.0&radius=5000` — 반경 5km 내 클럽 조회
- 또는 `GET /api/v1/clubs?query=배드민턴` — 클럽명·체육관명 검색
- 카카오맵 SDK로 지도 렌더링, 클럽 위치에 커스텀 마커 표시
- 마커 클릭 시 클럽 정보 팝업 (이름, 주소, 월회비, 가입 버튼)

**백엔드 거리 계산 (Haversine)**:
```python
from math import radians, cos, sin, asin, sqrt

def haversine(lat1, lon1, lat2, lon2) -> float:
    """두 좌표 간 거리(km) 반환"""
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    return 2 * R * asin(sqrt(a))
```

MySQL 5.7에서 Haversine을 WHERE 절에 직접 사용하거나, 앱 레벨에서 필터링.

### 7.3 권한 체계 (RBAC)

| 역할 | 설명 | 주요 권한 |
|------|------|-----------|
| `service_admin` | 서비스 전체 관리자 | 전체 공지, 모든 클럽 접근 |
| `admin` | 클럽 관리자 | 회원 승인/관리, 대회·공지 CRUD, 회비 관리 |
| `member` | 일반 회원 | 조회, 일정 등록, 사진 업로드 |
| `guest` | 게스트 | 제한적 조회 |

**FastAPI Dependency 예시**:
```python
async def require_club_admin(
    club_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ClubMember:
    member = await get_club_member(db, club_id, current_user.id)
    if not member or member.role != "admin":
        raise HTTPException(403, "클럽 관리자 권한이 필요합니다.")
    return member
```

### 7.4 LLM 대진표 자동 생성

**흐름**:
1. 관리자가 `POST /tournaments/{t_id}/bracket/generate` 호출
2. 백엔드에서 참가자 목록 조회 후 Claude API 호출
3. Claude가 대진표 JSON 반환
4. DB에 `tournament_matches` 일괄 저장
5. 프론트엔드에서 대진표 시각화 (`react-bracket` 또는 커스텀 SVG)

**LLM 프롬프트 (bracket.py)**:
```python
BRACKET_SYSTEM_PROMPT = """
당신은 배드민턴 대회 운영 전문가입니다.
참가자 목록을 받아 공정한 대진표를 생성합니다.

규칙:
- 같은 클럽 소속 선수끼리는 가능한 초반에 만나지 않도록 배치
- 리그전(round_robin)의 경우 모든 참가자가 1회씩 대전하도록 편성
- 토너먼트(elimination)의 경우 대진 번호 순서대로 배치
- 응답은 반드시 아래 JSON 형식으로만 반환 (설명 없음)

응답 형식:
{
  "rounds": [
    {
      "round": 1,
      "matches": [
        { "match_number": 1, "player1": "이름1", "player2": "이름2" },
        ...
      ]
    }
  ]
}
"""

async def generate_bracket(tournament: Tournament, participants: list[Participant]) -> dict:
    player_list = [
        f"{p.player_name}" + (f" & {p.partner_name}" if p.partner_name else "")
        for p in participants
    ]
    user_message = f"""
대회 정보:
- 대회명: {tournament.name}
- 방식: {tournament.format}
- 종목: {tournament.match_type}
- 참가자 수: {len(participants)}명

참가자 목록:
{chr(10).join(f"{i+1}. {name}" for i, name in enumerate(player_list))}

위 참가자들의 대진표를 생성해주세요.
"""
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=2000,
        system=BRACKET_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}]
    )
    return json.loads(response.content[0].text)
```

**프론트엔드**: 대진표 결과를 렌더링하고, "새로고침" 버튼으로 재호출 (기존 matches 초기화 후 재생성)

### 7.5 사진 → 동영상 자동 변환 (FFmpeg.wasm)

**구현 방식**: 브라우저 내 FFmpeg.wasm으로 클라이언트 사이드 처리

```typescript
// lib/ffmpeg.ts
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const ffmpeg = new FFmpeg();

export async function generateVideoFromPhotos(
  photoUrls: string[],
  bgmUrl: string,
  transition: "fade" | "slide" | "zoom",
  durationPerPhoto = 3
): Promise<Blob> {
  if (!ffmpeg.loaded) {
    await ffmpeg.load({
      coreURL: await toBlobURL("/ffmpeg/ffmpeg-core.js", "text/javascript"),
      wasmURL: await toBlobURL("/ffmpeg/ffmpeg-core.wasm", "application/wasm"),
    });
  }

  // 각 사진을 파일로 저장
  for (let i = 0; i < photoUrls.length; i++) {
    const imgData = await fetchFile(photoUrls[i]);
    await ffmpeg.writeFile(`img${String(i).padStart(3, "0")}.jpg`, imgData);
  }

  // BGM 저장
  if (bgmUrl) {
    const bgmData = await fetchFile(bgmUrl);
    await ffmpeg.writeFile("bgm.mp3", bgmData);
  }

  // 슬라이드쇼 → MP4 변환 (전환 효과 포함)
  const totalDuration = photoUrls.length * durationPerPhoto;
  await ffmpeg.exec([
    "-framerate", `1/${durationPerPhoto}`,
    "-pattern_type", "glob",
    "-i", "img*.jpg",
    ...(bgmUrl ? ["-i", "bgm.mp3", "-shortest"] : []),
    "-vf", `scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1,${getTransitionFilter(transition, durationPerPhoto)}`,
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-t", String(totalDuration),
    "output.mp4",
  ]);

  const data = await ffmpeg.readFile("output.mp4");
  return new Blob([data], { type: "video/mp4" });
}

function getTransitionFilter(transition: string, duration: number): string {
  switch (transition) {
    case "fade": return `xfade=transition=fade:duration=0.5:offset=${duration - 0.5}`;
    case "slide": return `xfade=transition=slideleft:duration=0.5:offset=${duration - 0.5}`;
    case "zoom": return `zoompan=z='if(lte(zoom,1.0),1.5,max(1.001,zoom-0.0015))':d=${duration * 25}`;
    default: return "";
  }
}
```

**무료 음원 목록 (`/api/v1/bgm/list`)**:
- 초기에는 무료 Creative Commons 음원 URL 목록을 DB 또는 config에 정적으로 관리
- 향후 YouTube Audio Library API, Free Music Archive API 연동 가능

### 7.6 달력 D-Day 기능

```typescript
// utils/dday.ts
export function calcDDay(targetDate: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "D-Day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}
```

FullCalendar 이벤트 렌더링 시 `dday_label`이 있는 이벤트는 D-Day 배지를 함께 표시.

---

## 8. 프론트엔드 페이지 구성

```
/                         → 랜딩 페이지 (서비스 소개, 클럽 지도 검색)
/auth/login               → 소셜 로그인 선택
/auth/callback/:provider  → OAuth 콜백 처리
/clubs                    → 클럽 목록 + 지도
/clubs/new                → 클럽 생성
/clubs/:clubId            → 클럽 홈 (공지, 공지, 대시보드)
/clubs/:clubId/members    → 회원 관리
/clubs/:clubId/fees       → 회비 관리
/clubs/:clubId/tournaments           → 대회 목록
/clubs/:clubId/tournaments/new       → 대회 생성
/clubs/:clubId/tournaments/:tId      → 대회 상세 + 대진표
/clubs/:clubId/notices    → 공지사항
/clubs/:clubId/gallery    → 사진·영상 갤러리
/clubs/:clubId/calendar   → 클럽 달력
/profile                  → 내 프로필, 내 클럽, 참가 대회 이력
/admin                    → 서비스 관리자 페이지 (전체 공지, 클럽 관리)
```

---

## 9. 에러 코드 정의

| 코드 | HTTP | 설명 |
|------|------|------|
| `AUTH_INVALID_TOKEN` | 401 | 유효하지 않은 토큰 |
| `AUTH_TOKEN_EXPIRED` | 401 | 만료된 토큰 |
| `AUTH_UNAUTHORIZED` | 403 | 권한 없음 |
| `CLUB_NOT_FOUND` | 404 | 클럽 없음 |
| `CLUB_ALREADY_MEMBER` | 409 | 이미 가입된 클럽 |
| `MEMBER_PENDING` | 409 | 승인 대기 중 |
| `TOURNAMENT_NOT_FOUND` | 404 | 대회 없음 |
| `BRACKET_GENERATION_FAILED` | 500 | 대진표 생성 실패 |
| `PHOTO_UPLOAD_FAILED` | 500 | 사진 업로드 실패 |
| `VIDEO_GENERATION_FAILED` | 500 | 영상 생성 실패 |
| `VALIDATION_ERROR` | 422 | 입력값 오류 |

---

## 10. Runtime 에러 자동 복구 시스템

모든 외부 API 호출(LLM, OAuth, MinIO, Celery)에 아래 패턴 적용:

```python
import asyncio
from functools import wraps

def auto_retry(max_retries=3, base_delay=1.0, exceptions=(Exception,)):
    """지수 백오프 자동 재시도 데코레이터"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_exc = e
                    wait = base_delay * (2 ** attempt)
                    error_type = type(e).__name__
                    # 에러 타입별 처리
                    if "RateLimitError" in error_type:
                        wait = max(wait, 60)  # Rate limit은 최소 60초 대기
                    elif "ConnectionError" in error_type:
                        wait = base_delay  # 연결 에러는 빠른 재시도
                    await asyncio.sleep(wait)
            raise last_exc
        return wrapper
    return decorator

# 사용 예시
@auto_retry(max_retries=3, exceptions=(anthropic.APIError,))
async def generate_bracket(tournament, participants):
    ...
```

---

## 11. Docker Compose 구성

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - VITE_API_URL=http://nginx/api/v1
      - VITE_KAKAO_MAP_APP_KEY=${VITE_KAKAO_MAP_APP_KEY}
    depends_on: [backend]

  backend:
    build: ./backend
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on: [mysql, redis, minio]
    volumes:
      - ./backend:/app

  celery_worker:
    build: ./backend
    command: celery -A app.tasks worker --loglevel=info
    depends_on: [redis, backend]

  mysql:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: afb_db
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backend/db/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports: ["9000:9000", "9001:9001"]

  nginx:
    image: nginx:alpine
    ports: ["80:80"]
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on: [frontend, backend]

  flower:
    image: mher/flower
    command: celery flower --broker=${REDIS_URL}
    ports: ["5555:5555"]
    depends_on: [redis]

volumes:
  mysql_data:
  minio_data:
```

---

## 12. 개발 우선순위 (구현 순서 권장)

```
Phase 1 — 핵심 인프라 (1~2주)
  ✅ Docker Compose 환경 구성
  ✅ FastAPI 기본 구조 + MySQL 연결
  ✅ JWT 인증 미들웨어
  ✅ 소셜 로그인 (카카오 → 네이버 → 구글 순)

Phase 2 — 클럽·회원 관리 (2~3주)
  ✅ 클럽 CRUD + 지도 검색 API
  ✅ 회원 가입 요청·승인 플로우
  ✅ 권한(RBAC) 미들웨어
  ✅ 회비 관리 API

Phase 3 — 대회 관리 (2~3주)
  ✅ 대회 CRUD + 참가자 관리
  ✅ Claude API 대진표 생성
  ✅ 경기 결과 입력·순위 계산
  ✅ 대진표 UI (React)

Phase 4 — 부가 기능 (2~3주)
  ✅ 공지사항 CRUD
  ✅ 달력 + D-Day 기능
  ✅ 사진 업로드 (MinIO)
  ✅ FFmpeg.wasm 영상 생성

Phase 5 — 마무리 (1~2주)
  ✅ 반응형 UI 다듬기
  ✅ PWA 설정 (오프라인, 푸시 알림)
  ✅ 성능 최적화 (쿼리 인덱스, 이미지 최적화)
  ✅ 배포 (Nginx + HTTPS)
```

---

## 13. 코드 품질 규칙

- **Python**: `black` + `isort` + `flake8` 적용. 함수 단위 Docstring 필수.
- **TypeScript**: `eslint` + `prettier`. 모든 Props에 타입 명시.
- **API 변경 시**: Swagger 문서(`/docs`) 자동 반영 확인.
- **DB 변경 시**: Alembic 마이그레이션 파일 작성 필수.
- **테스트**: 핵심 비즈니스 로직(대진표 생성, 승패 계산) 단위 테스트 작성.
- **Soft Delete**: 모든 삭제는 `is_deleted=1` 처리. Hard Delete 금지.
- **보안**: API Key, 시크릿은 `.env`만. 코드에 하드코딩 금지.

---

*이 문서는 "모두의 배민 (All for Badminton)" 프로젝트의 단일 진실 소스(Single Source of Truth)입니다.
기능 변경, 스택 변경 시 반드시 이 문서를 먼저 업데이트하세요.*