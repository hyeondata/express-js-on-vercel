# OpenClaw 연동 가이드 (MCP + Skill 등록)

## 1) 이 프로젝트용 Skill 등록

1. `skills/flashcard-local/SKILL.md`를 OpenClaw workspace skill 경로로 복사합니다.
   - OpenClaw 기본 workspace: `~/.openclaw/skills`
2. 또는 프로젝트 폴더 자체를 워크스페이스로 쓰는 경우, `skills/` 폴더를 그대로 인식합니다.
3. 아래 예시로 `~/.openclaw/openclaw.json`에 Skill entry를 추가합니다.

```bash
mkdir -p ~/.openclaw/skills
cp -R "$(pwd)/skills/flashcard-local" ~/.openclaw/skills/
```

```json5
{
  "skills": {
    "load": {
      "extraDirs": ["./skills", "~/.openclaw/skills"]
    },
    "entries": {
      "flashcard-local": {
        "enabled": true,
        "env": {
          "FLASHCARD_BASE_URL": "http://localhost:3000"
        }
      }
    }
  }
}
```

## 2) MCP 등록(표준 클라이언트 기준)

요청하신 MCP 등록은 아래처럼 진행하는 구조를 권장합니다.

- MCP 서버 실행 바이너리/커맨드 준비
- 클라이언트 설정에 아래 형태로 서버 등록
- 현재 저장소에서 제공하는 MCP 서버 스크립트:
  - `scripts/mcp-flashcard-server.mjs`

```json
{
  "mcpServers": {
    "flashcard-local": {
      "command": "node",
      "args": ["<PROJECT_PATH>/scripts/mcp-flashcard-server.mjs"],
      "env": {
        "FLASHCARD_BASE_URL": "http://localhost:3000",
        "FLASHCARD_ACCOUNT_ID": "guest"
      }
    }
  }
}
```

또는 동일 기능을 `mcp.config.example.json` 파일로 그대로 복사/붙여넣기해 사용할 수 있습니다.

## 3) 원클릭 등록(추천)

```bash
npm run openclaw:register
```

실행 결과:
- `~/.openclaw/skills/flashcard-local`로 스킬이 복사됨
- `~/.openclaw/openclaw.json`에 `skills.load.extraDirs`, `skills.entries.flashcard-local` 설정 반영

## 4) 디버그 실행

- 백엔드 동작 점검:
```bash
npm run debug:flashcard
```
- 백엔드가 안 올라올 때는 먼저:
```bash
npm run dev:local
```
- (터미널을 분리해) `localhost:3000` 서버를 실행한 뒤:
- MCP 서버 동작 점검:
```bash
npm run mcp:flashcard
```

`npm run mcp:flashcard`는 stdio MCP 런타임으로 동작하며, 아래와 같이
OpenClaw가 아니라 로컬에서도 직접 `tools/call` 메시지를 확인할 수 있습니다.

```bash
printf '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}\n' | npm run mcp:flashcard
printf '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}\n' | npm run mcp:flashcard
```

## 5) 디버깅 체크리스트

- 앱 열기 직후 계정 선택이 비정상적인 경우:
  - 브라우저 devtools의 Network에서 `/api/accounts` 응답이 200인지 확인
  - `flash-account-id` 로컬스토리지 값이 유효한 계정인지 확인
- difficulty가 `미측정`으로 남는 경우:
  - `correct <= total`인지 확인
  - `/api/accounts/{id}/difficulty` 요청 바디가 숫자 형태인지 확인
- 카드가 한 번도 안 보이는 경우:
  - 계정의 `accountId`가 실제 카드 생성 요청에 함께 들어가는지 확인
