FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install

COPY . .

# VITE_* 변수는 빌드 타임에 번들에 포함되므로 ARG → ENV로 주입
ARG VITE_API_URL=http://nginx/api/v1
ARG VITE_KAKAO_MAP_API_KEY=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_KAKAO_MAP_API_KEY=$VITE_KAKAO_MAP_API_KEY

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app
RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
