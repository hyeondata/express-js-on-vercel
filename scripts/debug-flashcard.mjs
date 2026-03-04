#!/usr/bin/env node

import process from 'node:process'

const BASE_URL = process.env.FLASHCARD_BASE_URL || 'http://localhost:3000'
const ACCOUNT_ID = process.env.FLASHCARD_ACCOUNT_ID || ''
const mode = process.argv[2] || 'all'
const MCP_MODE = mode === 'mcp'

function withAccount(headers = {}) {
  if (!ACCOUNT_ID) return headers
  return {
    ...headers,
    'X-Account-Id': ACCOUNT_ID,
  }
}

async function call(path, options = {}) {
  const headers = withAccount({ 'Content-Type': 'application/json', ...(options.headers || {}) })
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  const text = await response.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  if (!response.ok) {
    throw new Error(`[HTTP ${response.status}] ${response.statusText}\n${JSON.stringify(body)}`)
  }
  return body
}

async function runHealth() {
  const health = await call('/healthz', { method: 'GET' })
  console.log('health', health)
}

async function runAccounts() {
  const accounts = await call('/api/accounts', { method: 'GET' })
  console.log('accounts', accounts)
}

async function runCards() {
  const cards = await call('/api/cards', { method: 'GET' })
  console.log('cards', cards)
}

async function runStats() {
  const stats = await call('/api/stats', { method: 'GET' })
  console.log('stats', stats)
}

async function runStudy() {
  const card = await call('/api/study/next', { method: 'GET' })
  console.log('study_next', card)
}

async function runDifficulty() {
  if (!ACCOUNT_ID) {
    console.log('difficulty', 'skipped: FLASHCARD_ACCOUNT_ID is not set')
    return
  }
  const payload = await call(`/api/accounts/${ACCOUNT_ID}/difficulty`, {
    method: 'POST',
    body: JSON.stringify({ correct: 3, total: 5 }),
  })
  console.log('difficulty', payload)
}

function normalizeMcpMessage(payload) {
  if (!payload || typeof payload !== 'object') return ''
  if (payload.result) return JSON.stringify(payload.result, null, 2)
  if (payload.error) return JSON.stringify(payload.error, null, 2)
  return JSON.stringify(payload, null, 2)
}

async function runMcpProbe() {
  if (MCP_MODE) {
    process.stdout.write('MCP probe mode uses MCP server stdio handshake.\n')
  }

  const server = process.env.MCP_SERVER_CMD || 'node scripts/mcp-flashcard-server.mjs'
  const [cmd, ...args] = server.split(' ')
  const child = new (await import('node:child_process')).spawn(cmd, args.length ? args : undefined, {
    cwd: process.cwd(),
    env: { ...process.env, FLASHCARD_BASE_URL: BASE_URL, FLASHCARD_ACCOUNT_ID: ACCOUNT_ID },
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  const send = (payload) => {
    child.stdin.write(JSON.stringify(payload) + '\n')
  }
  const recv = () =>
    new Promise((resolve, reject) => {
      const cleanup = () => {
        child.stderr.removeAllListeners('data')
        child.stdout.removeAllListeners('data')
      }
      const onData = (chunk) => {
        child.stdout.off('data', onData)
        cleanup()
        try {
          resolve(JSON.parse(String(chunk).trim().split('\n')[0]))
        } catch (error) {
          reject(error)
        }
      }
      const onError = (chunk) => {
        child.stderr.off('data', onError)
        reject(new Error(String(chunk)))
      }
      child.stdout.on('data', onData)
      child.stderr.on('data', onError)
    })

  send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })
  const init = await recv()
  process.stdout.write(`initialize: ${normalizeMcpMessage(init)}\n`)
  if (init.error) {
    throw new Error(`initialize failed: ${normalizeMcpMessage(init.error)}`)
  }

  send({ jsonrpc: '2.0', id: 2, method: 'tools/list' })
  const toolList = await recv()
  const toolNames = (toolList?.result?.tools || []).map((tool) => tool.name).sort()
  process.stdout.write(`tools/list: ${toolNames.join(', ')}\n`)

  const findTool = (name) => toolList?.result?.tools?.find((tool) => tool.name === name)
  if (!findTool('flashcard_set_difficulty')) {
    throw new Error('flashcard_set_difficulty not found in tools/list')
  }
  if (!findTool('flashcard_study_next')) {
    throw new Error('flashcard_study_next not found in tools/list')
  }

  if (!ACCOUNT_ID) {
    process.stdout.write('mcp-study: skipped: FLASHCARD_ACCOUNT_ID is not set\n')
  } else {
    send({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'flashcard_set_difficulty',
        arguments: { accountId: ACCOUNT_ID, correct: 3, total: 5 },
      },
    })
    const difficulty = await recv()
    process.stdout.write(`flashcard_set_difficulty: ${normalizeMcpMessage(difficulty)}\n`)

    send({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'flashcard_study_next',
        arguments: { accountId: ACCOUNT_ID },
      },
    })
    const studyNext = await recv()
    process.stdout.write(`flashcard_study_next: ${normalizeMcpMessage(studyNext)}\n`)
  }

  child.kill()
}

async function main() {
  try {
    if (mode === 'health') {
      await runHealth()
      return
    }
    if (mode === 'accounts') {
      await runAccounts()
      return
    }
    if (mode === 'cards') {
      await runCards()
      return
    }
    if (mode === 'stats') {
      await runStats()
      return
    }
    if (mode === 'study') {
      await runStudy()
      return
    }
    if (mode === 'difficulty') {
      await runDifficulty()
      return
    }
    if (mode === 'mcp') {
      await runMcpProbe()
      return
    }

    await runHealth()
    await runAccounts()
    await runCards()
    await runStats()
    await runDifficulty()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

main()
