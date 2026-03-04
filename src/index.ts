import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PROJECT_ROOT_CANDIDATES = [
  process.cwd(),
  path.resolve(__dirname, '..', '..'),
  path.resolve(__dirname, '..'),
]

function resolveProjectPath(...segments: string[]) {
  for (const base of PROJECT_ROOT_CANDIDATES) {
    const candidate = path.join(base, ...segments)
    if (fs.existsSync(candidate)) return candidate
  }
  return path.join(process.cwd(), ...segments)
}

type Account = {
  id: string
  name: string
  createdAt: string
  difficulty: number
  difficultyAssessedAt: string | null
}

type FlashCard = {
  id: string
  accountId: string
  front: string
  back: string
  topic: string
  createdAt: string
  lastReviewedAt: string | null
  reviewCount: number
  correctCount: number
  incorrectCount: number
  strength: number
  difficulty: number
}

type StoreFile = {
  accounts: Omit<Account, 'difficultyAssessedAt'>[] | Account[]
  cards: Omit<FlashCard, 'difficulty' | 'reviewCount' | 'correctCount' | 'incorrectCount' | 'strength' | 'accountId'>[]
    | FlashCard[]
}

const app = express()
app.use(express.json())
app.use(express.static(resolveProjectPath('public')))

const dataDir = resolveProjectPath('data')
const storePath = path.join(dataDir, 'store.json')

const defaultAccountId = 'guest'
const defaultDifficulty = 3

const accounts = new Map<string, Account>()
let cards: FlashCard[] = []

function now() {
  return new Date().toISOString()
}

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

function clampDifficulty(value: number) {
  if (!Number.isFinite(value)) return defaultDifficulty
  return Math.min(5, Math.max(1, Math.round(value)))
}

function clampRate(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

function difficultyMultiplier(level: number) {
  return {
    1: 1.45,
    2: 1.2,
    3: 1,
    4: 0.75,
    5: 0.55,
  }[clampDifficulty(level)]
}

function cloneCard(card: FlashCard) {
  return { ...card }
}

function nextReviewMinutes(strength: number) {
  const intervals = [5, 30, 240, 720, 2880, 4320]
  return intervals[Math.min(strength, intervals.length - 1)]
}

function getReviewDueDate(card: FlashCard) {
  if (!card.lastReviewedAt) return new Date(0)
  const due = nextReviewMinutes(card.strength)
  const minutes = Math.max(1, Math.round(due * difficultyMultiplier(card.difficulty)))
  return new Date(new Date(card.lastReviewedAt).getTime() + minutes * 60 * 1000)
}

function dueCardsSorted(source: FlashCard[]) {
  const base = [...source]
  base.sort((a, b) => {
    const nowTs = Date.now()
    const aDue = getReviewDueDate(a).getTime()
    const bDue = getReviewDueDate(b).getTime()
    const aIsDue = aDue <= nowTs
    const bIsDue = bDue <= nowTs
    if (aIsDue !== bIsDue) return aIsDue ? -1 : 1
    if (aIsDue && bIsDue) return aDue - bDue
    return aDue - bDue
  })
  return base
}

function createAccount(name = 'Guest', id = randomUUID()) {
  return {
    id,
    name,
    createdAt: now(),
    difficulty: defaultDifficulty,
    difficultyAssessedAt: null,
  } as Account
}

function calculateCardDifficulty(score: number, total: number) {
  const ratio = clampRate(total > 0 ? score / total : 0)
  const level = (1 - ratio) * 4 + 1
  return clampDifficulty(Math.round(level))
}

function createSeedCards(account: Account) {
  return [
    {
      id: randomUUID(),
      accountId: account.id,
      front: '안녕하세요',
      back: 'Hello',
      topic: '인사',
      createdAt: now(),
      lastReviewedAt: null,
      reviewCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      strength: 0,
      difficulty: account.difficulty,
    },
    {
      id: randomUUID(),
      accountId: account.id,
      front: '책상',
      back: 'desk',
      topic: '명사',
      createdAt: now(),
      lastReviewedAt: null,
      reviewCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      strength: 0,
      difficulty: account.difficulty,
    },
  ]
}

function getAccountId(req: express.Request) {
  const headerValue = req.header('x-account-id')
  const queryValue = typeof req.query.accountId === 'string' ? req.query.accountId : ''
  return (headerValue || queryValue || defaultAccountId).trim() || defaultAccountId
}

function isShareMode(req: express.Request) {
  const headerValue = req.header('x-share-mode')
  return headerValue === '1' || headerValue === 'true'
}

function rejectShareWrite(req: express.Request, res: express.Response) {
  if (!isShareMode(req)) return false
  res.status(403).json({ error: '공유 모드에서는 쓰기 작업이 제한됩니다.' })
  return true
}

function cardsForAccount(accountId: string) {
  return cards.filter((item) => item.accountId === accountId)
}

function normalizeCard(raw: any, fallbackAccount: Account): FlashCard {
  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : randomUUID(),
    accountId:
      typeof raw.accountId === 'string' && raw.accountId.trim()
        ? raw.accountId.trim()
        : fallbackAccount.id,
    front: typeof raw.front === 'string' ? raw.front.trim() : '',
    back: typeof raw.back === 'string' ? raw.back.trim() : '',
    topic: typeof raw.topic === 'string' ? raw.topic.trim() : '',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now(),
    lastReviewedAt:
      typeof raw.lastReviewedAt === 'string' || raw.lastReviewedAt === null ? raw.lastReviewedAt : null,
    reviewCount: Number.isFinite(Number(raw.reviewCount)) ? Number(raw.reviewCount) : 0,
    correctCount: Number.isFinite(Number(raw.correctCount)) ? Number(raw.correctCount) : 0,
    incorrectCount: Number.isFinite(Number(raw.incorrectCount)) ? Number(raw.incorrectCount) : 0,
    strength: Number.isFinite(Number(raw.strength)) ? Number(raw.strength) : 0,
    difficulty: clampDifficulty(
      Number.isFinite(Number(raw.difficulty)) ? Number(raw.difficulty) : fallbackAccount.difficulty,
    ),
  }
}

function normalizeAccounts(rawAccounts: any[]) {
  for (const raw of rawAccounts) {
    if (!raw || typeof raw !== 'object') continue
    const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : randomUUID()
    const name =
      typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : `User ${id.slice(0, 6)}`
    const difficulty =
      typeof raw.difficulty === 'number' ? clampDifficulty(raw.difficulty) : defaultDifficulty
    const createdAt =
      typeof raw.createdAt === 'string' && raw.createdAt.trim() ? raw.createdAt.trim() : now()
    const difficultyAssessedAt =
      typeof raw.difficultyAssessedAt === 'string' ? raw.difficultyAssessedAt : null
    accounts.set(id, {
      id,
      name,
      createdAt,
      difficulty,
      difficultyAssessedAt,
    })
  }
  if (!accounts.has(defaultAccountId)) {
    accounts.set(defaultAccountId, createAccount('Guest', defaultAccountId))
  }
}

function loadStoreFromDisk() {
  try {
    if (!fs.existsSync(storePath)) return
    const raw = fs.readFileSync(storePath, 'utf8')
    if (!raw.trim()) return

    const parsed = JSON.parse(raw)
    const storedAccounts = Array.isArray(parsed)
      ? []
      : Array.isArray((parsed as StoreFile).accounts)
        ? (parsed as StoreFile).accounts
        : []
    const storedCards = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as StoreFile).cards)
        ? (parsed as StoreFile).cards
        : []

    normalizeAccounts(storedAccounts)

    const fallback = accounts.get(defaultAccountId) || createAccount('Guest', defaultAccountId)
    cards = storedCards
      .map((raw) => normalizeCard(raw, fallback))
      .filter((item) => item.front && item.back && item.topic)
      .map((card) => ({
        ...card,
        accountId: accounts.has(card.accountId)
          ? card.accountId
          : fallback.id,
      }))
  } catch (error) {
    console.error('스토어 로드 실패', error)
  }
}

function saveStore() {
  try {
    ensureDataDir()
    const payload = {
      accounts: [...accounts.values()],
      cards,
    }
    fs.writeFileSync(storePath, JSON.stringify(payload, null, 2), 'utf8')
  } catch (error) {
    console.error('스토어 저장 실패', error)
  }
}

function syncSeedCards() {
  const guest = accounts.get(defaultAccountId)
  if (!guest) return
  const accountCards = cardsForAccount(guest.id)
  if (accountCards.length === 0) {
    cards.push(...createSeedCards(guest))
    saveStore()
  }
}

function validateReviewResult(result: string) {
  return result === 'again' || result === 'hard' || result === 'good'
}

loadStoreFromDisk()
if (!accounts.has(defaultAccountId)) {
  accounts.set(defaultAccountId, createAccount('Guest', defaultAccountId))
}
syncSeedCards()

app.get('/', (_req, res) => {
  res.sendFile(resolveProjectPath('public', 'index.html'))
})

app.get('/about', (_req, res) => {
  res.sendFile(path.join(resolveProjectPath('components'), 'about.htm'))
})

app.get('/api-data', (req, res) => {
  const accountId = getAccountId(req)
  const account = accounts.get(accountId)
  if (!account) return res.status(404).json({ error: '계정을 찾을 수 없습니다.' })
  const accountCards = cardsForAccount(accountId)
  res.json({
    message: 'Flash card data endpoint',
    accountId: account.id,
    count: accountCards.length,
    topics: [...new Set(accountCards.map((card) => card.topic))],
    difficulty: account.difficulty,
    difficultyAssessedAt: account.difficultyAssessedAt,
  })
})

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: now() })
})

app.post('/api/accounts', (req, res) => {
  if (rejectShareWrite(req, res)) return
  const name =
    typeof req.body?.name === 'string' && req.body.name.trim()
      ? req.body.name.trim()
      : `User ${randomUUID().slice(0, 6)}`
  const account = createAccount(name)
  accounts.set(account.id, account)
  saveStore()
  res.status(201).json(account)
})

app.get('/api/accounts', (_req, res) => {
  const list = [...accounts.values()]
  res.json(
    list
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((account) => ({
        id: account.id,
        name: account.name,
        difficulty: account.difficulty,
        difficultyAssessedAt: account.difficultyAssessedAt,
        createdAt: account.createdAt,
      })),
  )
})

app.get('/api/accounts/:accountId', (req, res) => {
  const account = accounts.get(req.params.accountId)
  if (!account) return res.status(404).json({ error: '계정을 찾을 수 없습니다.' })
  res.json(account)
})

app.post('/api/accounts/:accountId/difficulty', (req, res) => {
  if (rejectShareWrite(req, res)) return
  const account = accounts.get(req.params.accountId)
  if (!account) return res.status(404).json({ error: '계정을 찾을 수 없습니다.' })

  const correct = Number(req.body?.correct)
  const total = Number(req.body?.total)
  if (
    !Number.isFinite(correct) ||
    !Number.isFinite(total) ||
    !Number.isInteger(correct) ||
    !Number.isInteger(total) ||
    correct < 0 ||
    total <= 0 ||
    correct > total
  ) {
    return res.status(400).json({
      error:
        'correct/total은 정수여야 하며 total은 1 이상, correct는 0 이상 total 이하이어야 합니다.',
    })
  }

  const difficulty = calculateCardDifficulty(correct, total)
  account.difficulty = difficulty
  account.difficultyAssessedAt = now()

  cards
    .filter((card) => card.accountId === account.id && card.reviewCount === 0)
    .forEach((card) => {
      card.difficulty = difficulty
    })

  saveStore()
  res.json({
    account,
    message: `초기 난이도 설정 완료 (난이도 ${difficulty})`,
  })
})

app.get('/api/cards', (req, res) => {
  const accountId = getAccountId(req)
  const account = accounts.get(accountId)
  if (!account) return res.status(404).json({ error: '계정을 찾을 수 없습니다.' })

  const topic = typeof req.query.topic === 'string' ? req.query.topic.toLowerCase() : ''
  const q = typeof req.query.q === 'string' ? req.query.q.toLowerCase() : ''
  const list = cardsForAccount(account.id).filter((card) => {
    if (topic && card.topic.toLowerCase() !== topic) return false
    if (!q) return true
    return (
      card.front.toLowerCase().includes(q) ||
      card.back.toLowerCase().includes(q) ||
      card.topic.toLowerCase().includes(q)
    )
  })

  res.json(list.map(cloneCard))
})

app.get('/api/cards/:id', (req, res) => {
  const accountId = getAccountId(req)
  const account = accounts.get(accountId)
  if (!account) return res.status(404).json({ error: '계정을 찾을 수 없습니다.' })

  const card = cards.find((item) => item.id === req.params.id && item.accountId === account.id)
  if (!card) return res.status(404).json({ error: '카드를 찾을 수 없습니다.' })
  res.json(cloneCard(card))
})

app.post('/api/cards', (req, res) => {
  if (rejectShareWrite(req, res)) return
  const accountId = getAccountId(req)
  const account = accounts.get(accountId)
  if (!account) return res.status(404).json({ error: '계정을 찾을 수 없습니다.' })

  const { front, back, topic, difficulty } = req.body ?? {}
  if (typeof front !== 'string' || typeof back !== 'string' || typeof topic !== 'string') {
    return res.status(400).json({ error: 'front, back, topic은 문자열이어야 합니다.' })
  }
  if (!front.trim() || !back.trim() || !topic.trim()) {
    return res.status(400).json({ error: '빈 문자열은 허용되지 않습니다.' })
  }

  const newCard: FlashCard = {
    id: randomUUID(),
    accountId: account.id,
    front: front.trim(),
    back: back.trim(),
    topic: topic.trim(),
    difficulty: clampDifficulty(Number(difficulty) || account.difficulty),
    createdAt: now(),
    lastReviewedAt: null,
    reviewCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    strength: 0,
  }

  cards.push(newCard)
  saveStore()
  res.status(201).json(newCard)
})

app.patch('/api/cards/:id', (req, res) => {
  if (rejectShareWrite(req, res)) return
  const accountId = getAccountId(req)
  const account = accounts.get(accountId)
  if (!account) return res.status(404).json({ error: '계정을 찾을 수 없습니다.' })

  const card = cards.find((item) => item.id === req.params.id && item.accountId === account.id)
  if (!card) return res.status(404).json({ error: '카드를 찾을 수 없습니다.' })

  const { front, back, topic } = req.body ?? {}
  if (typeof front === 'string' && front.trim()) card.front = front.trim()
  if (typeof back === 'string' && back.trim()) card.back = back.trim()
  if (typeof topic === 'string' && topic.trim()) card.topic = topic.trim()
  saveStore()
  res.json(cloneCard(card))
})

app.delete('/api/cards/:id', (req, res) => {
  if (rejectShareWrite(req, res)) return
  const accountId = getAccountId(req)
  const account = accounts.get(accountId)
  if (!account) return res.status(404).json({ error: '계정을 찾을 수 없습니다.' })

  const idx = cards.findIndex((card) => card.id === req.params.id && card.accountId === account.id)
  if (idx === -1) return res.status(404).json({ error: '카드를 찾을 수 없습니다.' })
  cards.splice(idx, 1)
  saveStore()
  res.status(204).send()
})

app.get('/api/stats', (req, res) => {
  const accountId = getAccountId(req)
  const account = accounts.get(accountId)
  if (!account) return res.status(404).json({ error: '계정을 찾을 수 없습니다.' })

  const accountCards = cardsForAccount(account.id)
  const total = accountCards.length
  const reviewed = accountCards.filter((card) => card.lastReviewedAt).length
  const dueToday = accountCards.filter((card) => getReviewDueDate(card).getTime() <= Date.now()).length
  const accuracy =
    accountCards.reduce((sum, card) => sum + card.correctCount + card.incorrectCount, 0) === 0
      ? 0
      : (accountCards.reduce((sum, card) => sum + card.correctCount, 0) /
          accountCards.reduce((sum, card) => sum + card.correctCount + card.incorrectCount, 0)) *
        100

  res.json({
    total,
    reviewed,
    dueToday,
    accuracy: Number(accuracy.toFixed(1)),
    difficulty: account.difficulty,
  })
})

app.get('/api/study/next', (req, res) => {
  const accountId = getAccountId(req)
  const account = accounts.get(accountId)
  if (!account) return res.status(404).json({ error: '계정을 찾을 수 없습니다.' })

  const queue = dueCardsSorted(cardsForAccount(account.id))
  if (queue.length === 0) {
    return res.status(404).json({ message: '카드가 없습니다.' })
  }

  const card = queue[0]
  res.json(cloneCard(card))
})

app.post('/api/cards/:id/review', (req, res) => {
  const accountId = getAccountId(req)
  const account = accounts.get(accountId)
  if (!account) return res.status(404).json({ error: '계정을 찾을 수 없습니다.' })

  const card = cards.find((item) => item.id === req.params.id && item.accountId === account.id)
  if (!card) return res.status(404).json({ error: '카드를 찾을 수 없습니다.' })

  const result = req.body?.result
  if (!validateReviewResult(result)) {
    return res.status(400).json({ error: 'again, hard, good만 가능합니다.' })
  }

  card.reviewCount += 1
  card.lastReviewedAt = now()

  if (result === 'good') {
    card.correctCount += 1
    card.strength = Math.min(card.strength + 1, 5)
  } else if (result === 'hard') {
    card.correctCount += 1
    card.strength = Math.max(card.strength - 1, 0)
  } else {
    card.incorrectCount += 1
    card.strength = Math.max(card.strength - 2, 0)
  }

  saveStore()
  res.json({
    card: cloneCard(card),
    nextReviewAt: getReviewDueDate(card).toISOString(),
  })
})

app.post('/api/import', (req, res) => {
  if (rejectShareWrite(req, res)) return
  const accountId = getAccountId(req)
  const account = accounts.get(accountId)
  if (!account) return res.status(404).json({ error: '계정을 찾을 수 없습니다.' })

  const list = req.body
  if (!Array.isArray(list)) {
    return res.status(400).json({ error: '요청 바디는 배열이어야 합니다.' })
  }

  const accepted = list
    .filter(
      (raw) =>
        raw &&
        typeof raw.front === 'string' &&
        typeof raw.back === 'string' &&
        typeof raw.topic === 'string',
    )
    .map((raw) => ({
      id: randomUUID(),
      accountId: account.id,
      front: String(raw.front).trim(),
      back: String(raw.back).trim(),
      topic: String(raw.topic).trim(),
      createdAt: now(),
      lastReviewedAt: null,
      reviewCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      strength: 0,
      difficulty: clampDifficulty(raw.difficulty ? Number(raw.difficulty) : account.difficulty),
    }))
    .filter((raw) => raw.front && raw.back && raw.topic)

  if (accepted.length === 0) return res.status(400).json({ error: '유효한 데이터가 없습니다.' })

  cards.push(...accepted)
  saveStore()
  res.status(201).json({ imported: accepted.length })
})

app.get('/api/export', (req, res) => {
  const accountId = getAccountId(req)
  const account = accounts.get(accountId)
  if (!account) return res.status(404).json({ error: '계정을 찾을 수 없습니다.' })

  const list = cardsForAccount(account.id)
  res.json(list.map(cloneCard))
})

export default app
