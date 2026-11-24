import json
import asyncio
import logging
from functools import wraps
import anthropic
from app.core.config import settings

logger = logging.getLogger(__name__)

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


def auto_retry(max_retries: int = 3, base_delay: float = 1.0):
    """지수 백오프 자동 재시도 데코레이터"""

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exc = e
                    wait = base_delay * (2**attempt)
                    error_type = type(e).__name__
                    if "RateLimitError" in error_type:
                        wait = max(wait, 60)
                    elif "ConnectionError" in error_type:
                        wait = base_delay
                    await asyncio.sleep(wait)
            raise last_exc

        return wrapper

    return decorator


@auto_retry(max_retries=3)
async def generate_bracket(tournament, participants: list) -> dict:
    """Claude API를 통한 대진표 자동 생성

    Args:
        tournament: Tournament ORM 인스턴스
        participants: TournamentParticipant ORM 인스턴스 목록

    Returns:
        대진표 딕셔너리 {"rounds": [...]}
    """
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

    # 동기 SDK를 asyncio.to_thread로 호출 (anthropic SDK는 동기)
    def _call():
        logger.info("Calling Anthropic API with model: %s", settings.ANTHROPIC_MODEL)
        try:
            response = client.messages.create(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=2000,
                system=BRACKET_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_message}],
            )
            return response.content[0].text
        except anthropic.BadRequestError as e:
            logger.error("Anthropic 400 Bad Request: %s", e.body)
            raise
        except anthropic.APIStatusError as e:
            logger.error("Anthropic API error %s: %s", e.status_code, e.body)
            raise

    raw_text = await asyncio.to_thread(_call)

    # JSON 파싱 (마크다운 코드블록 처리)
    text = raw_text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        # 첫 줄(```json 또는 ```) 과 마지막 줄(```) 제거
        text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

    return json.loads(text)
