---
name: flashcard-local
description: Manage accounts, cards, and study sessions in the local flashcard app.
user-invocable: true
---

# Flashcard Local Skill

This skill targets the app in the current project.

- Base endpoint: `{env.FLASHCARD_BASE_URL}` (예: `http://localhost:3000`)

## What you can do

- `flashcard_list_accounts`: 모든 계정 목록 조회
- `flashcard_create_account`: 계정 생성
- `flashcard_get_account`: 계정 정보 조회
- `flashcard_set_difficulty`: 초기 난이도 설정 (`correct`, `total`)
- `flashcard_list_cards`: 카드 목록 조회 (`topic`, `q`)
- `flashcard_create_card`: 카드 생성 (`front`, `back`, `topic`, `difficulty`)
- `flashcard_delete_card`: 카드 삭제 (`cardId`)
- `flashcard_get_stats`: 통계 조회
- `flashcard_study_next`: 복습 대기 카드 1개 조회
- `flashcard_review_card`: 카드 평가 처리 (`result`: `good`, `hard`, `again`)
## Notes

- The local app already supports per-account card separation (`X-Account-Id` header).
- If difficulty is not set yet, backend defaults to level 3.
- Keep `FLASHCARD_BASE_URL` in `.env` or shell environment before invoking.
