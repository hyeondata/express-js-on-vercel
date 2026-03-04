# Express.js on Vercel

Basic Express.js + Vercel example that serves html content, JSON data and simulates an api route.

## How to Use

You can choose from one of the following two methods to use this repository:

### One-Click Deploy

Deploy the example using [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=vercel-examples):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/vercel/examples/tree/main/solutions/express&project-name=express&repository-name=express)

### Clone and Deploy

```bash
git clone https://github.com/vercel/examples.git
cd examples/solutions/express
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
