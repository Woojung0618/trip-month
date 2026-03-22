# 🌍 TripMonth

**월별 최적 여행지를 지도로 추천하는 서비스**

> 1월부터 12월까지, 지금 가기 가장 좋은 여행지를 한눈에 확인하세요.

🔗 **[www.tripmonth.com](https://www.tripmonth.com)**

---

## 주요 기능

- 🗺️ **세계 지도 기반 탐색** — 월별로 추천 여행지를 지도 위에 핀으로 표시
- ✈️ **항공권 최저가 연동** — 여행지별 항공권 최저가 및 예약 링크 제공
- 🌤️ **현지 날씨 & 추천 시즌** — 기온, 날씨, 최적 방문 시기 정보
- 📍 **220개 여행지** — 전 세계 주요 도시 및 숨겨진 여행지 수록
- 🔐 **관리자 페이지** — 여행지 정보 실시간 수정 및 관리

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React, Vite, TypeScript, Tailwind CSS |
| 백엔드 | Node.js, Express |
| 데이터베이스 | PostgreSQL (Supabase) |
| 지도 | react-simple-maps, world-atlas TopoJSON |
| 배포 | Render |

---

## 프로젝트 구조

```
trip-map-global/
├── client/               # React + Vite 프론트엔드
│   ├── src/
│   │   ├── components/   # UI 컴포넌트 (지도, 카드, 모달 등)
│   │   ├── pages/        # 메인 페이지, 관리자 페이지
│   │   └── data/         # 국가코드 매핑 등 정적 데이터
│   └── public/           # favicon, sitemap.xml, robots.txt
└── server/               # Express API 서버
    ├── db/               # DB 연결 및 쿼리
    ├── routes/           # API 라우터
    └── scripts/          # DB 관리 스크립트
```

---

## 로컬 실행

### 사전 요구사항
- Node.js 18+
- Supabase 프로젝트 (PostgreSQL)

### 설치 및 실행

```bash
# 1. 의존성 설치
npm install && cd client && npm install && cd ../server && npm install && cd ..

# 2. 환경변수 설정
cp .env.example .env
# .env에 DATABASE_URL, ADMIN_PASSWORD 입력

# 3. 개발 서버 실행 (클라이언트 + 서버 동시)
npm run dev
```

- 클라이언트: http://localhost:5173
- API 서버: http://localhost:3001

---

## API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/destinations?month=1` | 월별 추천 여행지 목록 |
| GET | `/api/destinations` | 전체 여행지 목록 |
| GET | `/api/destinations/:id/months` | 특정 여행지의 추천 월 목록 |
| PATCH | `/api/destinations/:id` | 여행지 정보 수정 |
| POST | `/api/admin/login` | 관리자 로그인 |
| GET | `/api/health` | 서버 상태 확인 |

---

## 관리자

- 경로: `/admin`
- 환경변수 `ADMIN_PASSWORD`와 일치하는 비밀번호로 로그인

---

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 프론트엔드 + 백엔드 개발 서버 동시 실행 |
| `npm run build` | 프론트엔드 프로덕션 빌드 |
| `npm start` | 프로덕션 서버 실행 |
| `npm run deploy:build` | 빌드 + DB 초기화 (배포 전용) |

---

## SEO

- `client/public/sitemap.xml` — 전체 페이지 사이트맵
- `client/public/robots.txt` — 크롤러 접근 설정
- Google Search Console 등록 완료
