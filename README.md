# Trip Map Global

월별 여행지 추천 지도 웹 (React + Vite + Express + SQLite)

## 구조

- **client**: React + Vite 프론트엔드 (메인 지도 뷰, 관리자 페이지)
- **server**: Express API + SQLite (목적지 조회/저장)

## 실행

```bash
# 의존성 설치 (루트 + client + server)
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# DB 초기화 (테이블 생성 + 시드 데이터)
npm run db:init

# 개발 (클라이언트 + 서버 동시 실행)
npm run dev
```

- 클라이언트: http://localhost:5173
- API: http://localhost:3001

## API

- `GET /api/destinations?month=1` — 월별 추천지 목록
- `GET /api/destinations` — 전체 목록
- `PATCH /api/destinations/:id` — 제휴 링크·평균가 수정 (body: `affiliateUrl`, `averageFlightPrice`)

## 배포 (MVP)

```bash
npm run deploy:build   # 클라이언트 빌드 + DB 시드
npm start              # 서버 실행 (client/dist 자동 제공)
```

- 서버는 `client/dist`가 있으면 정적 파일을 제공하고, `/api`는 그대로 동작합니다.
- 상세: [DEPLOY.md](./DEPLOY.md) (Railway/Render/Docker 등)

## 관리자

- 경로: `/admin`
- 인증: 서버의 `ADMIN_PASSWORD` 환경 변수와 일치하는 비밀번호로 로그인 (개발 시 .env 설정)

## 지도 에셋 (Figma 국가 PNG)

지도는 Figma [SVG World Map](https://www.figma.com/design/83V4lURbAg1Dqyly4JS5PJ/)의 국가 단위 PNG를 사용합니다.

- Figma에서 각 국가 그룹(2글자 코드: `kr`, `jp`, `us` 등)을 선택 후 **Export → PNG**로 저장
- `client/public/countries/{코드}.png` 에 넣기 (예: `kr.png`, `jp.png`)
- 자세한 절차는 `client/public/countries/README.md` 참고
- PNG가 없는 국가는 회색 영역으로만 표시됨
# trip-month
