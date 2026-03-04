# Express.js on Vercel

Basic Express.js + Vercel example that serves html content, JSON data and simulates an api route.

## How to Use

You can choose from one of the following two methods to use this repository:

### One-Click Deploy

Deploy the example using [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=vercel-examples):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/hyeondata/express-js-on-vercel&project-name=express-js-on-vercel&repository-name=express-js-on-vercel)

### Clone and Deploy

```bash
git clone https://github.com/hyeondata/express-js-on-vercel.git
cd express-js-on-vercel
```

Install the Vercel CLI:

```bash
npm i -g vercel
```

Then run the app at the root of the repository:

```bash
vercel dev
```

### OpenClaw 연동

- [OpenClaw 설정 및 Skill/MCP 등록 가이드](OPENCLAW_SETUP.md)
- Skills 디렉터리: `skills/flashcard-local/SKILL.md`
- MCP 샘플 설정: `mcp.config.example.json`
- MCP 서버 스크립트: `scripts/mcp-flashcard-server.mjs`
- 디버그 스크립트: `npm run debug:flashcard` (기본: health/accounts/cards/stats/difficulty 순으로 호출)
- MCP 서버 실행: `npm run mcp:flashcard`
- OpenClaw 등록 자동 반영: `npm run openclaw:register`
- 로컬 실행: `npm run start` (동일: `npm run dev:local`)

### Vercel 배포 디버깅

배포 실패 시 아래 순서로 점검하세요.

1) 인증/토큰 상태 확인

```bash
vercel login
```

로그인 후 `vercel link` 또는 새 배포를 진행하세요.  
`The specified token is not valid` 메시지는 토큰/세션 만료가 원인인 경우가 많습니다.

2) 로컬에서 앱이 정상 실행되는지 확인

```bash
npm run start
```

`http://localhost:3000/healthz`가 200 응답인지, `/api/accounts`가 JSON을 반환하는지 확인하세요.

3) Vercel 빌드/라우팅 설정 확인

- `vercel.json`의 `builds`가 `src/index.ts`를 가리키는지
- `routes`가 요청을 `src/index.ts`로 전달하는지
- 변경 후 `vercel deploy` 재시도

4) 자주 보이는 실패 메시지 체크
- `Cannot find module .../src/index.ts`: 빌드 루트/경로 불일치
- `EACCES`/권한 오류: 런타임 저장 경로(`/tmp`) 사용 여부 점검
- `Function crashed`/`Unhandled`: `npm run start`로 동일 요청을 재현해 오류 로그 확인
