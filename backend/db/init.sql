-- =============================================================
-- 모두의 배민 (All for Badminton) - MySQL 초기화 스크립트
-- =============================================================

CREATE DATABASE IF NOT EXISTS afb_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE afb_db;

-- -------------------------------------------------------------
-- users
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    provider     ENUM('kakao','naver','google') NOT NULL,
    provider_id  VARCHAR(100) NOT NULL,
    email        VARCHAR(255),
    nickname     VARCHAR(50) NOT NULL,
    profile_img  VARCHAR(500),
    role         ENUM('user','service_admin') DEFAULT 'user',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME ON UPDATE CURRENT_TIMESTAMP,
    is_deleted   TINYINT(1) DEFAULT 0,
    UNIQUE KEY uq_provider (provider, provider_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- clubs
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clubs (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    description   TEXT,
    gym_name      VARCHAR(200),
    gym_address   VARCHAR(500),
    latitude      DECIMAL(10,7),
    longitude     DECIMAL(11,7),
    monthly_fee   INT DEFAULT 0,
    owner_id      BIGINT NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME ON UPDATE CURRENT_TIMESTAMP,
    is_deleted    TINYINT(1) DEFAULT 0,
    FOREIGN KEY (owner_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- club_members
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS club_members (
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
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- club_fees
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS club_fees (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    club_id     BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,
    amount      INT NOT NULL,
    fee_month   DATETIME NOT NULL,
    paid_at     DATETIME,
    memo        VARCHAR(500),
    created_by  BIGINT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME ON UPDATE CURRENT_TIMESTAMP,
    is_deleted  TINYINT(1) DEFAULT 0,
    FOREIGN KEY (club_id)    REFERENCES clubs(id),
    FOREIGN KEY (user_id)    REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- tournaments
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tournaments (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    club_id      BIGINT,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- tournament_participants
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tournament_participants (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    tournament_id   BIGINT NOT NULL,
    user_id         BIGINT,
    player_name     VARCHAR(100) NOT NULL,
    partner_name    VARCHAR(100),
    wins            INT DEFAULT 0,
    losses          INT DEFAULT 0,
    points_won      INT DEFAULT 0,
    points_lost     INT DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT(1) DEFAULT 0,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (user_id)       REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- tournament_matches
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tournament_matches (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    tournament_id   BIGINT NOT NULL,
    round           INT NOT NULL,
    match_number    INT NOT NULL,
    player1_id      BIGINT NOT NULL,
    player2_id      BIGINT NOT NULL,
    score_player1   INT,
    score_player2   INT,
    winner_id       BIGINT,
    scheduled_at    DATETIME,
    played_at       DATETIME,
    status          ENUM('pending','ongoing','finished') DEFAULT 'pending',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      TINYINT(1) DEFAULT 0,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (player1_id)    REFERENCES tournament_participants(id),
    FOREIGN KEY (player2_id)    REFERENCES tournament_participants(id),
    FOREIGN KEY (winner_id)     REFERENCES tournament_participants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- notices
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notices (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    club_id     BIGINT,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- gallery_photos
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gallery_photos (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    club_id     BIGINT NOT NULL,
    uploader_id BIGINT NOT NULL,
    file_name   VARCHAR(300) NOT NULL,
    file_url    VARCHAR(1000) NOT NULL,
    file_size   BIGINT,
    sort_order  INT DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME ON UPDATE CURRENT_TIMESTAMP,
    is_deleted  TINYINT(1) DEFAULT 0,
    FOREIGN KEY (club_id)     REFERENCES clubs(id),
    FOREIGN KEY (uploader_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- gallery_videos
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gallery_videos (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    club_id       BIGINT NOT NULL,
    title         VARCHAR(200),
    video_url     VARCHAR(1000),
    bgm_name      VARCHAR(200),
    bgm_url       VARCHAR(1000),
    photo_ids     JSON,
    transition    VARCHAR(100),
    duration      INT,
    status        ENUM('pending','processing','done','failed') DEFAULT 'pending',
    created_by    BIGINT NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME ON UPDATE CURRENT_TIMESTAMP,
    is_deleted    TINYINT(1) DEFAULT 0,
    FOREIGN KEY (club_id)    REFERENCES clubs(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- calendar_events
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendar_events (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    club_id      BIGINT,
    user_id      BIGINT NOT NULL,
    title        VARCHAR(300) NOT NULL,
    description  TEXT,
    start_dt     DATETIME NOT NULL,
    end_dt       DATETIME,
    all_day      TINYINT(1) DEFAULT 0,
    color        VARCHAR(20),
    dday_label   VARCHAR(100),
    is_public    TINYINT(1) DEFAULT 1,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME ON UPDATE CURRENT_TIMESTAMP,
    is_deleted   TINYINT(1) DEFAULT 0,
    FOREIGN KEY (club_id) REFERENCES clubs(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 인덱스
-- -------------------------------------------------------------
CREATE INDEX idx_clubs_location ON clubs (latitude, longitude);
CREATE INDEX idx_club_members_club ON club_members (club_id, status);
CREATE INDEX idx_club_fees_club_month ON club_fees (club_id, fee_month);
CREATE INDEX idx_tournaments_club ON tournaments (club_id, status);
CREATE INDEX idx_tournament_participants_tournament ON tournament_participants (tournament_id);
CREATE INDEX idx_tournament_matches_tournament ON tournament_matches (tournament_id, round);
CREATE INDEX idx_notices_club ON notices (club_id, scope, is_pinned);
CREATE INDEX idx_gallery_photos_club ON gallery_photos (club_id, sort_order);
CREATE INDEX idx_gallery_videos_club ON gallery_videos (club_id, status);
CREATE INDEX idx_calendar_events_club ON calendar_events (club_id, start_dt);
