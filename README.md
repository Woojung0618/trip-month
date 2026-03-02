# Trip Map Global

월별 여행지 추천 지도 웹 (React + Vite + Express + SQLite)

**배포 URL**: [https://trip-map-global.onrender.com/](https://trip-map-global.onrender.com/)

## 구조

| 디렉터리 | 설명 |
|----------|------|
| **client** | React + Vite 프론트엔드. 메인 지도(월별 추천지), 관리자 페이지(`/admin`) |
| **server** | Express API + SQLite. 목적지 조회·수정, 관리자 로그인 |

**지도**  
메인 화면은 [react-simple-maps](https://www.react-simple-maps.io/)와 [world-atlas](https://github.com/topojson/world-atlas) TopoJSON(`countries-110m`)으로 세계 지도를 그립니다. 위·경도가 있으면 해당 좌표에, 없으면 국가 중심(centroid)에 핀을 표시합니다.

## 실행

```bash
# 의존성 설치 (루트 → client → server)
npm install && cd client && npm install && cd ../server && npm install && cd ..

# DB 초기화 (테이블 생성 + 시드 데이터)
npm run db:init

# 개발 (클라이언트 + 서버 동시)
npm run dev
```

- 클라이언트: http://localhost:5173  
- API/서버: http://localhost:3001  

## API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/destinations?month=1` | 해당 월 추천지 목록 |
| GET | `/api/destinations` | 전체 목록 |
| GET | `/api/destinations/:id/months` | 해당 목적지가 추천되는 월 목록 |
| PATCH | `/api/destinations/:id` | 제휴 링크·평균가 등 수정 (body: `affiliateUrl`, `averageFlightPrice` 등) |
| POST | `/api/admin/login` | 관리자 로그인 (body: `password`) |
| GET | `/api/health` | 헬스체크 |

## 관리자

- 경로: `/admin`
- 로그인: 서버의 `ADMIN_PASSWORD` 환경 변수와 일치하는 비밀번호 사용 (로컬은 `.env`에 설정)

## 배포

- **빌드**: `npm run deploy:build` (클라이언트 빌드 + DB 시드)
- **실행**: `npm start` (서버가 `client/dist` 정적 제공 + API)
- **Render**: [DEPLOY.md](./DEPLOY.md) 참고 (Blueprint·환경 변수·DB 영속화 등)

## 스크립트 요약

| 스크립트 | 설명 |
|----------|------|
| `npm run dev` | 클라이언트·서버 동시 개발 서버 |
| `npm run build` | 클라이언트만 빌드 |
| `npm run db:init` | DB 초기화 + 시드 |
| `npm run deploy:build` | 빌드 + DB 시드 (배포 전용) |
| `npm start` | 서버만 실행 (프로덕션) |
| `npm run preview` | 빌드 후 로컬에서 프로덕션 동작 확인 |
