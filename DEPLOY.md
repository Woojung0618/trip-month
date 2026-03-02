# MVP 배포 가이드

## Render로 지금 배포하기 (Blueprint)

1. **코드 푸시**  
   변경 사항을 GitHub 저장소에 푸시합니다.  
   `git add . && git commit -m "Deploy MVP" && git push origin main`

2. **Render 가입/로그인**  
   [render.com](https://render.com) 에서 GitHub 계정으로 로그인합니다.

3. **Blueprint로 서비스 생성**  
   - Dashboard → **New** → **Blueprint**
   - 연결된 GitHub에서 이 저장소 선택
   - Render가 `render.yaml`을 읽어 서비스를 만듭니다.

4. **환경 변수 설정**  
   생성된 Web Service → **Environment** 탭에서:
   - `ADMIN_PASSWORD`: 관리자 비밀번호 (원하는 값으로 설정)

5. **Deploy**  
   Blueprint 적용 후 자동으로 배포됩니다.  
   첫 배포 후에는 GitHub에 푸시할 때마다 자동 재배포됩니다.

6. **DB 참고**  
   Render 무료 플랜에는 영속 디스크가 없어, 재시작/재배포 시 SQLite DB가 초기화될 수 있습니다.  
   데이터 유지가 필요하면 유료 플랜에서 Disk를 `server/db`에 마운트하거나, 외부 DB를 사용하세요.

---

## 로컬에서 프로덕션 빌드 확인

```bash
# 의존성 (루트 + client + server)
npm install && cd client && npm install && cd ../server && npm install && cd ..

# 클라이언트 빌드 + DB 시드
npm run deploy:build

# 서버 실행 (client/dist 정적 제공 + API)
npm start
```

브라우저에서 `http://localhost:3001` 로 접속해 동작을 확인한 뒤 배포하면 됩니다.

## 환경 변수

배포 시 서버에서 다음을 설정하세요.

| 변수 | 설명 | 필수 |
|------|------|------|
| `PORT` | 서버 포트 (기본 3001) | 선택 |
| `ADMIN_PASSWORD` | 관리자 로그인 비밀번호 | 권장 (기본값 사용 시 변경) |

`.env`는 서버 루트(프로젝트 루트) 기준으로 로드됩니다. 호스팅에서 환경 변수로 넣으면 됩니다.

## 배포 옵션

### 1. Railway / Render / Fly.io (권장)

- **Node** 런타임, **루트 디렉터리**를 프로젝트 루트로 설정.
- **빌드 명령**: `npm run deploy:build`  
  (또는 `npm run build && npm run db:init`)
- **시작 명령**: `npm start`
- **영속 디스크**: SQLite DB 파일을 유지하려면 호스팅의 **Volume / Persistent Disk**를 서버의 DB 디렉터리(예: `server/db`)에 마운트.  
  Volume을 쓰지 않으면 재시작 시 DB가 초기화될 수 있음.
- **PORT**: 호스팅이 주는 `PORT`를 쓰면 되고, 보통 자동 주입됨.

### 2. Docker (선택)

같은 방식으로 동작하는 Docker 예시입니다.

```dockerfile
# Dockerfile (프로젝트 루트)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
RUN npm ci && cd client && npm ci && cd ../server && npm ci && cd ..
COPY . .
RUN npm run deploy:build
EXPOSE 3001
ENV NODE_ENV=production
CMD ["npm", "start"]
```

- DB 영속화가 필요하면 `server/db`를 volume으로 마운트하세요.

### 3. 정적 + API 분리

- **클라이언트**: Vercel/Netlify 등에 `client`만 배포 (빌드: `npm run build`, 출력: `client/dist`).
- **API**: 서버를 Railway/Render 등에 배포하고, 클라이언트의 API 요청을 해당 URL로 보내도록 `client/src/api/client.ts`에서 `API_BASE`를 배포된 API 주소로 바꾸거나, 환경 변수(`VITE_API_URL`)로 설정해 빌드 시 주입해야 합니다.

## 체크리스트

- [ ] `npm run deploy:build` 후 `npm start`로 로컬에서 동작 확인
- [ ] `ADMIN_PASSWORD` 등 환경 변수 설정
- [ ] DB 영속화(Volume) 필요 시 호스팅에서 설정
- [ ] 관리자 페이지(`/admin`) 로그인 동작 확인
