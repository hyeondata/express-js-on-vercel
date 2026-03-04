#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL || process.env.FLASHCARD_BASE_URL || 'http://localhost:3000'

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { status: response.status, ok: response.ok, body }
}

async function assert(condition, message, payload = '') {
  if (!condition) {
    throw new Error(`${message}${payload ? `: ${payload}` : ''}`)
  }
}

async function main() {
  console.log(`[deploy-check] base=${BASE_URL}`)

  const health = await request('/healthz')
  console.log('[1/6] /healthz', health.status, health.body?.status)
  assert(health.ok && health.body?.status === 'ok', 'healthz check failed', JSON.stringify(health.body))

  const listAccounts = await request('/api/accounts')
  console.log('[2/6] GET /api/accounts', listAccounts.status, Array.isArray(listAccounts.body) ? listAccounts.body.length : '-')
  assert(listAccounts.ok, 'accounts list failed')
  assert(Array.isArray(listAccounts.body), 'accounts should be array')

  const createRes = await request('/api/accounts', {
    method: 'POST',
    body: JSON.stringify({ name: 'DeployCheck' }),
  })
  console.log('[3/6] POST /api/accounts', createRes.status, createRes.body?.id)
  assert(createRes.ok, 'create account failed')
  const accountId = createRes.body?.id
  assert(Boolean(accountId), 'accountId missing')

  const cardsRes = await request('/api/cards', {
    headers: { 'X-Account-Id': accountId },
  })
  console.log('[4/6] GET /api/cards', cardsRes.status, Array.isArray(cardsRes.body) ? cardsRes.body.length : '-')
  assert(cardsRes.ok, 'cards list failed')

  const createCard = await request('/api/cards', {
    method: 'POST',
    headers: { 'X-Account-Id': accountId },
    body: JSON.stringify({
      front: '검증단어',
      back: 'verification',
      topic: 'deploy',
    }),
  })
  console.log('[5/6] POST /api/cards', createCard.status, createCard.body?.id)
  assert(createCard.ok, 'create card failed')
  const studyBefore = await request('/api/study/next', {
    headers: { 'X-Account-Id': accountId },
  })
  console.log('[6/6] /api/study/next (pre-difficulty)', studyBefore.status)
  // 학습 자체는 난이도 미측정이어도 반환될 수 있지만 200/404 모두 허용
  assert(studyBefore.status === 200 || studyBefore.status === 404, 'study next unexpected status')

  const difficultyRes = await request(`/api/accounts/${accountId}/difficulty`, {
    method: 'POST',
    headers: { 'X-Account-Id': accountId },
    body: JSON.stringify({ correct: 3, total: 5 }),
  })
  console.log(' - difficulty post', difficultyRes.status, difficultyRes.body?.account?.difficultyAssessedAt ? 'ok' : 'none')

  if (difficultyRes.ok) {
    const studyAfter = await request('/api/study/next', {
      headers: { 'X-Account-Id': accountId },
    })
    console.log('[ok] /api/study/next (post-difficulty)', studyAfter.status)
    assert(studyAfter.status === 200 || studyAfter.status === 404, 'study next after difficulty failed')
  }

  const shareRes = await request('/api/cards', {
    method: 'POST',
    headers: {
      'X-Account-Id': accountId,
      'X-Share-Mode': '1',
    },
    body: JSON.stringify({ front: 'SHARE', back: 'SHARE', topic: 'CHECK' }),
  })
  console.log('[7] share-mode create should fail', shareRes.status)
  assert(shareRes.status === 403, 'share-mode write block not active')

  console.log('deploy-check: PASS')
}

main().catch((error) => {
  console.error(`deploy-check: FAIL - ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
