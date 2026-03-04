import readline from 'node:readline'
import process from 'node:process'

const MCP_VERSION = '2025-03-26'
const BASE_URL = process.env.FLASHCARD_BASE_URL || 'http://localhost:3000'
const DEFAULT_ACCOUNT_ID = process.env.FLASHCARD_ACCOUNT_ID || ''

function formatError(id, code, message) {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
    },
  }
}

function formatResult(id, result) {
  return {
    jsonrpc: '2.0',
    id,
    result,
  }
}

function getAccountId(candidate) {
  if (typeof candidate === 'string') {
    const trimmed = candidate.trim()
    if (trimmed) return trimmed
  }
  return DEFAULT_ACCOUNT_ID || null
}

async function callApi(path, options = {}) {
  const accountId = getAccountId(options.accountId)
  const headers = {
    ...(options.headers || {}),
    'Content-Type': 'application/json',
  }
  if (accountId) headers['X-Account-Id'] = accountId

  const target = new URL(path, BASE_URL)
  const response = await fetch(target, {
    ...options,
    headers,
  })

  const text = await response.text()
  if (!response.ok) {
    let details = text
    try {
      const parsed = JSON.parse(text)
      if (typeof parsed?.error === 'string') details = parsed.error
    } catch {}
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${details}`)
  }

  return text ? JSON.parse(text) : null
}

function toToolResponse(payload) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
  }
}

function validateRequired(body, fields) {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      throw new Error(`Missing required argument: ${field}`)
    }
  }
}

async function handleToolCall(name, args = {}) {
  switch (name) {
    case 'flashcard_list_accounts': {
      const accounts = await callApi('/api/accounts', { method: 'GET' })
      return toToolResponse(accounts)
    }
    case 'flashcard_create_account': {
      validateRequired(args, ['name'])
      const created = await callApi('/api/accounts', {
        method: 'POST',
        body: JSON.stringify({ name: String(args.name) }),
      })
      return toToolResponse(created)
    }
    case 'flashcard_get_account': {
      const accountId = getAccountId(args.accountId)
      if (!accountId) throw new Error('accountId 또는 FLASHCARD_ACCOUNT_ID가 필요합니다.')
      const account = await callApi(`/api/accounts/${accountId}`, { method: 'GET' })
      return toToolResponse(account)
    }
    case 'flashcard_set_difficulty': {
      validateRequired(args, ['correct', 'total'])
      const accountId = getAccountId(args.accountId)
      if (!accountId) throw new Error('accountId 또는 FLASHCARD_ACCOUNT_ID가 필요합니다.')
      const correct = Number(args.correct)
      const total = Number(args.total)
      if (
        !Number.isFinite(correct) ||
        !Number.isFinite(total) ||
        !Number.isInteger(correct) ||
        !Number.isInteger(total) ||
        total <= 0 ||
        correct < 0 ||
        correct > total
      ) {
        throw new Error(
          'correct/total은 정수여야 하며 total은 1 이상, correct는 0 이상 total 이하이어야 합니다.',
        )
      }
      const result = await callApi(`/api/accounts/${accountId}/difficulty`, {
        method: 'POST',
        body: JSON.stringify({
          correct,
          total,
        }),
      })
      return toToolResponse(result)
    }
    case 'flashcard_list_cards': {
      const accountId = getAccountId(args.accountId)
      const params = new URLSearchParams()
      if (typeof args.topic === 'string' && args.topic.trim()) params.set('topic', args.topic.trim())
      if (typeof args.q === 'string' && args.q.trim()) params.set('q', args.q.trim())
      const query = params.toString() ? `?${params}` : ''
      const list = await callApi(`/api/cards${query}`, {
        method: 'GET',
        accountId,
      })
      return toToolResponse(list)
    }
    case 'flashcard_create_card': {
      validateRequired(args, ['front', 'back', 'topic'])
      const accountId = getAccountId(args.accountId)
      if (!accountId) throw new Error('accountId 또는 FLASHCARD_ACCOUNT_ID가 필요합니다.')
      const created = await callApi('/api/cards', {
        method: 'POST',
        accountId,
        body: JSON.stringify({
          front: String(args.front),
          back: String(args.back),
          topic: String(args.topic),
          ...(typeof args.difficulty === 'number' ? { difficulty: args.difficulty } : {}),
        }),
      })
      return toToolResponse(created)
    }
    case 'flashcard_delete_card': {
      validateRequired(args, ['cardId'])
      const accountId = getAccountId(args.accountId)
      if (!accountId) throw new Error('accountId 또는 FLASHCARD_ACCOUNT_ID가 필요합니다.')
      await callApi(`/api/cards/${encodeURIComponent(String(args.cardId))}`, {
        method: 'DELETE',
        accountId,
      })
      return toToolResponse({ ok: true })
    }
    case 'flashcard_get_stats': {
      const accountId = getAccountId(args.accountId)
      const stats = await callApi('/api/stats', {
        method: 'GET',
        accountId,
      })
      return toToolResponse(stats)
    }
    case 'flashcard_study_next': {
      const accountId = getAccountId(args.accountId)
      const card = await callApi('/api/study/next', {
        method: 'GET',
        accountId,
      })
      return toToolResponse(card)
    }
    case 'flashcard_review_card': {
      validateRequired(args, ['cardId', 'result'])
      const accountId = getAccountId(args.accountId)
      if (!accountId) throw new Error('accountId 또는 FLASHCARD_ACCOUNT_ID가 필요합니다.')
      const payload = await callApi(`/api/cards/${encodeURIComponent(String(args.cardId))}/review`, {
        method: 'POST',
        accountId,
        body: JSON.stringify({ result: String(args.result) }),
      })
      return toToolResponse(payload)
    }
    default:
      throw new Error(`지원하지 않는 도구: ${name}`)
  }
}

const toolSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
}

const tools = [
  {
    name: 'flashcard_list_accounts',
    description: '목록으로 모든 계정 정보를 조회합니다.',
    inputSchema: toolSchema,
  },
  {
    name: 'flashcard_create_account',
    description: '새 계정을 생성합니다.',
    inputSchema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
      },
    },
  },
  {
    name: 'flashcard_get_account',
    description: '특정 계정 정보를 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
      },
    },
  },
  {
    name: 'flashcard_set_difficulty',
    description: '초기 난이도를 측정/설정합니다.',
    inputSchema: {
      type: 'object',
      required: ['correct', 'total'],
      properties: {
        accountId: { type: 'string' },
        correct: { type: 'number' },
        total: { type: 'number' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'flashcard_list_cards',
    description: '카드 목록을 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
        topic: { type: 'string' },
        q: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'flashcard_create_card',
    description: '새 카드를 생성합니다.',
    inputSchema: {
      type: 'object',
      required: ['front', 'back', 'topic'],
      properties: {
        accountId: { type: 'string' },
        front: { type: 'string' },
        back: { type: 'string' },
        topic: { type: 'string' },
        difficulty: { type: 'number' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'flashcard_delete_card',
    description: '카드를 삭제합니다.',
    inputSchema: {
      type: 'object',
      required: ['cardId'],
      properties: {
        accountId: { type: 'string' },
        cardId: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'flashcard_get_stats',
    description: '계정 통계를 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'flashcard_study_next',
    description: '복습 대기 카드 하나를 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'flashcard_review_card',
    description: '카드 결과(again/hard/good)를 기록합니다.',
    inputSchema: {
      type: 'object',
      required: ['cardId', 'result'],
      properties: {
        accountId: { type: 'string' },
        cardId: { type: 'string' },
        result: { type: 'string', enum: ['again', 'hard', 'good'] },
      },
      additionalProperties: false,
    },
  },
]

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: 1e309,
})

rl.on('line', async (line) => {
  if (!line) return
  let message
  try {
    message = JSON.parse(line)
  } catch {
    process.stdout.write(
      JSON.stringify(formatError(null, -32700, 'Parse error: invalid JSON')) + '\n',
    )
    return
  }

  const { id, method, params = {} } = message
  if (!method) return

  if (method === 'initialize') {
    process.stdout.write(
      JSON.stringify(
        formatResult(id, {
          protocolVersion: MCP_VERSION,
          serverInfo: {
            name: 'flashcard-local-mcp',
            version: '1.0.0',
          },
          capabilities: {
            tools: { listChanged: false },
          },
        }),
      ) + '\n',
    )
    return
  }

  if (method === 'initialized') return

  if (method === 'tools/list') {
    process.stdout.write(
      JSON.stringify(
        formatResult(id, {
          tools,
        }),
      ) + '\n',
    )
    return
  }

  if (method === 'tools/call') {
    try {
      const result = await handleToolCall(params.name, params.arguments || {})
      process.stdout.write(JSON.stringify(formatResult(id, result)) + '\n')
    } catch (error) {
      process.stdout.write(
        JSON.stringify(formatError(id, -32603, error instanceof Error ? error.message : 'Tool error')) +
          '\n',
      )
    }
    return
  }

  process.stdout.write(
    JSON.stringify(formatError(id, -32601, `Method not supported: ${method}`)) + '\n',
  )
})
