from fastapi import HTTPException


class AFBException(HTTPException):
    """AFB 커스텀 예외 기본 클래스"""

    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(
            status_code=status_code,
            detail={"code": code, "message": message}
        )


class ClubNotFound(AFBException):
    def __init__(self):
        super().__init__(404, "CLUB_NOT_FOUND", "클럽을 찾을 수 없습니다.")


class TournamentNotFound(AFBException):
    def __init__(self):
        super().__init__(404, "TOURNAMENT_NOT_FOUND", "대회를 찾을 수 없습니다.")


class AlreadyMember(AFBException):
    def __init__(self):
        super().__init__(409, "CLUB_ALREADY_MEMBER", "이미 가입된 클럽입니다.")


class MemberPending(AFBException):
    def __init__(self):
        super().__init__(409, "MEMBER_PENDING", "승인 대기 중입니다.")


class AuthInvalidToken(AFBException):
    def __init__(self):
        super().__init__(401, "AUTH_INVALID_TOKEN", "유효하지 않은 토큰입니다.")


class AuthTokenExpired(AFBException):
    def __init__(self):
        super().__init__(401, "AUTH_TOKEN_EXPIRED", "만료된 토큰입니다.")


class AuthUnauthorized(AFBException):
    def __init__(self, message: str = "권한이 없습니다."):
        super().__init__(403, "AUTH_UNAUTHORIZED", message)


class PhotoUploadFailed(AFBException):
    def __init__(self, detail: str = ""):
        msg = f"사진 업로드 실패: {detail}" if detail else "사진 업로드에 실패했습니다."
        super().__init__(500, "PHOTO_UPLOAD_FAILED", msg)


class VideoGenerationFailed(AFBException):
    def __init__(self, detail: str = ""):
        msg = f"영상 생성 실패: {detail}" if detail else "영상 생성에 실패했습니다."
        super().__init__(500, "VIDEO_GENERATION_FAILED", msg)


class BracketGenerationFailed(AFBException):
    def __init__(self, detail: str = ""):
        msg = f"대진표 생성 실패: {detail}" if detail else "대진표 생성에 실패했습니다."
        super().__init__(500, "BRACKET_GENERATION_FAILED", msg)
