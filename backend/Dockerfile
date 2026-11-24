FROM python:3.11-slim

WORKDIR /app

RUN pip install uv

# pyproject.toml은 루트에 있으므로 build context를 루트(.)로 설정해야 합니다.
# docker-compose.yml: context: . (루트), dockerfile: backend/Dockerfile
COPY pyproject.toml ./
COPY backend/requirements.txt ./
RUN uv pip install --system -r requirements.txt

COPY backend/ ./

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
