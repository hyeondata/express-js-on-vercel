let cards = []
let currentCardId = null
let answerRevealed = false
let quizCurrentCardId = null
let quizModeActive = false
let quizCorrect = 0
let quizTotal = 0
let accountId = localStorage.getItem('flash-account-id') || ''
let accountInfo = null
let difficultyReady = false
const shareModeAccount = normalizeAccountId(
  new URLSearchParams(window.location.search).get('shareAccount') ||
    new URLSearchParams(window.location.search).get('share'),
)
let shareMode = Boolean(shareModeAccount)

const statsWrap = document.getElementById('stats')
const form = document.getElementById('card-form')
const frontInput = document.getElementById('front')
const backInput = document.getElementById('back')
const topicInput = document.getElementById('topic')
const clearBtn = document.getElementById('clear')
const searchInput = document.getElementById('search')
const topicFilter = document.getElementById('topic-filter')
const cardList = document.getElementById('card-list')
const flashTopic = document.getElementById('flashTopic')
const flashText = document.getElementById('flashText')
const flashAnswer = document.getElementById('flashAnswer')
const studyMessage = document.getElementById('study-message')
const nextCardBtn = document.getElementById('next-card')
const revealBtn = document.getElementById('reveal')
const gradeButtons = document.querySelectorAll('[data-result]')
const exportBtn = document.getElementById('export')
const importInput = document.getElementById('import-file')

const createAccountBtn = document.getElementById('create-account')
const newAccountName = document.getElementById('new-account-name')
const accountSelect = document.getElementById('account-select')
const setAccountBtn = document.getElementById('set-account')
const accountInfoLabel = document.getElementById('account-info')
const difficultyCorrectInput = document.getElementById('difficulty-correct')
const difficultyTotalInput = document.getElementById('difficulty-total')
const applyDifficultyBtn = document.getElementById('apply-difficulty')
const difficultyInfo = document.getElementById('difficulty-info')
const difficultyWarningBanner = document.getElementById('difficulty-ready-banner')
const shareModeInfo = document.getElementById('share-mode-info')
const shareLinkInput = document.getElementById('share-link')
const createShareLinkBtn = document.getElementById('create-share-link')
const copyShareLinkBtn = document.getElementById('copy-share-link')
const studyArea = document.querySelector('.study-area')
const quizModeSelect = document.getElementById('quiz-mode')
const quizStartBtn = document.getElementById('start-quiz')
const quizQuestion = document.getElementById('quiz-question')
const quizScore = document.getElementById('quiz-score')
const quizChoiceWrap = document.getElementById('quiz-choice-wrap')
const quizAnswerInput = document.getElementById('quiz-answer')
const quizSubmitBtn = document.getElementById('submit-quiz-answer')
const quizNextBtn = document.getElementById('next-quiz-question')
const quizMessage = document.getElementById('quiz-message')
const connectivityStatus = document.getElementById('connectivity-status')

function request(path, options = {}, includeAccount = true) {
  const headers = new Headers(options.headers || {})
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (includeAccount && accountId) {
    headers.set('X-Account-Id', accountId)
  }
  return fetch(path, { ...options, headers })
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function normalizeAccountId(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeAnswer(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function canUseStudyActions() {
  return Boolean(accountId) && difficultyReady
}

function isOnlineNow() {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

function renderConnectivityStatus() {
  if (!connectivityStatus) return
  const online = isOnlineNow()
  connectivityStatus.textContent = online ? '온라인: 실시간 동기화 모드' : '오프라인: 네트워크 연결이 없어 일부 기능 비활성'
  connectivityStatus.classList.toggle('is-offline', !online)
}

function setOfflineSafeDisabled(state = true) {
  const online = isOnlineNow()
  const disabled = state ? !online : false
  if (createAccountBtn) createAccountBtn.disabled = disabled
  if (newAccountName) newAccountName.disabled = disabled
  if (accountSelect) accountSelect.disabled = disabled
  if (setAccountBtn) setAccountBtn.disabled = disabled
  if (difficultyCorrectInput) difficultyCorrectInput.disabled = disabled
  if (difficultyTotalInput) difficultyTotalInput.disabled = disabled
  if (applyDifficultyBtn) applyDifficultyBtn.disabled = disabled
  if (quizStartBtn) quizStartBtn.disabled = disabled
  if (quizSubmitBtn) quizSubmitBtn.disabled = disabled
  if (quizNextBtn) quizNextBtn.disabled = disabled
  if (quizModeSelect) quizModeSelect.disabled = disabled
  if (quizAnswerInput) quizAnswerInput.disabled = disabled
  if (nextCardBtn) nextCardBtn.disabled = disabled
  if (revealBtn) revealBtn.disabled = disabled
  if (exportBtn) exportBtn.disabled = disabled
  if (importInput) importInput.disabled = disabled
  if (form) {
    form.querySelectorAll('input,button').forEach((element) => {
      element.disabled = disabled
    })
  }
  gradeButtons.forEach((button) => {
    button.disabled = disabled
  })
  if (!isOnlineNow() && quizChoiceWrap) {
    hideQuizChoiceMode()
  }
  if (quizModeActive && !isOnlineNow()) {
    quizModeActive = false
  }
  if (!isOnlineNow() && quizMessage) {
    quizMessage.textContent = '오프라인 상태에서는 퀴즈/학습 채점 기능이 일시적으로 비활성입니다.'
  }
}

function getRandomCardCandidate() {
  if (cards.length === 0) return null
  return cards[Math.floor(Math.random() * cards.length)]
}

function encodeQuizChoice(value) {
  return encodeURIComponent(String(value || '').trim())
}

function decodeQuizChoice(value) {
  try {
    return decodeURIComponent(value || '')
  } catch {
    return ''
  }
}

function hideQuizChoiceMode() {
  if (!quizChoiceWrap) return
  quizChoiceWrap.classList.add('hidden')
  quizChoiceWrap.innerHTML = ''
}

function setupQuizTextMode() {
  if (quizAnswerInput) {
    quizAnswerInput.value = ''
    quizAnswerInput.disabled = false
  }
  if (quizSubmitBtn) quizSubmitBtn.disabled = false
}

function setupQuizChoiceMode() {
  if (quizAnswerInput) quizAnswerInput.disabled = true
  if (quizSubmitBtn) quizSubmitBtn.disabled = true
}

function renderQuizQuestion(card) {
  if (!card) {
    quizModeActive = false
    quizQuestion.textContent = '현재 출제 가능한 문제가 없습니다.'
    quizNextBtn.disabled = true
    quizSubmitBtn.disabled = true
    quizAnswerInput.disabled = true
    if (!cards.length) {
      showQuizLockedMessage()
    }
    return
  }

  quizCurrentCardId = card.id
  quizQuestion.textContent = card.front
  quizScore.textContent = `정답: ${quizCorrect} / ${quizTotal}`
  quizMessage.textContent = '정답을 제출해주세요.'
  quizNextBtn.disabled = true

  const mode = quizModeSelect ? quizModeSelect.value : 'text'
  if (mode === 'choice') {
    const correct = card.back
    const normalizedCorrect = normalizeAnswer(correct)
    const wrongPool = cards
      .filter((item) => item.id !== card.id)
      .map((item) => item.back)
      .filter((item) => normalizeAnswer(item) && normalizeAnswer(item) !== normalizedCorrect)

    const normalizedSet = new Set([normalizedCorrect])
    const candidateWrong = []
    while (candidateWrong.length < 3 && wrongPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * wrongPool.length)
      const picked = wrongPool.splice(randomIndex, 1)[0]
      const normalizedPicked = normalizeAnswer(picked)
      if (!normalizedSet.has(normalizedPicked)) {
        candidateWrong.push(picked)
        normalizedSet.add(normalizedPicked)
      }
    }

    const options = [correct, ...candidateWrong]
    while (options.length < 4) {
      options.push(correct)
    }

    const shuffled = options.sort(() => Math.random() - 0.5)

    setupQuizChoiceMode()
    quizChoiceWrap.classList.remove('hidden')
    quizChoiceWrap.innerHTML = shuffled
      .map(
        (option) =>
          `<button class="secondary quiz-choice-btn" type="button" data-choice="${encodeQuizChoice(option)}">${escapeHtml(
            option,
          )}</button>`,
      )
      .join('')
  } else {
    hideQuizChoiceMode()
    setupQuizTextMode()
  }
}

function showQuizLockedMessage() {
  if (!quizMessage) return
  if (!accountId) {
    quizMessage.textContent = '퀴즈 시작/진행은 계정을 먼저 선택해 주세요.'
    return
  }
  if (!difficultyReady) {
    quizMessage.textContent = '퀴즈 시작/진행은 난이도 측정 이후에만 가능합니다.'
    return
  }
  if (!cards.length) {
    quizMessage.textContent = '카드가 없습니다. 먼저 카드를 추가해주세요.'
    return
  }
  quizMessage.textContent = '퀴즈를 진행할 수 있습니다.'
}

function finishQuizAnswer(resultText, isCorrect, card) {
  quizTotal += 1
  if (isCorrect) quizCorrect += 1
  quizMessage.textContent = resultText
  quizScore.textContent = `정답: ${quizCorrect} / ${quizTotal}`

  request(`/api/cards/${card.id}/review`, {
    method: 'POST',
    body: JSON.stringify({ result: isCorrect ? 'good' : 'again' }),
  })
    .then((response) => response.json())
      .then((payload) => {
        if (payload.error) throw new Error(payload.error)
        renderStats()
        loadCards()
        setTimeout(() => nextQuizCard(), 450)
      })
    .catch((error) => {
      studyMessage.textContent = `퀴즈 채점 실패: ${error.message}`
    })
}

function submitTextAnswer() {
  if (!quizModeActive) {
    quizMessage.textContent = '퀴즈를 먼저 시작해 주세요.'
    return
  }
  if (!quizModeSelect || quizModeSelect.value !== 'text') {
    return
  }
  const answer = normalizeAnswer(quizAnswerInput.value)
  const card = cards.find((item) => item.id === quizCurrentCardId)
  if (!card) {
    startQuiz()
    return
  }
  if (!answer) {
    quizMessage.textContent = '정답을 입력해주세요.'
    return
  }
  const expected = normalizeAnswer(card.back)
  const isCorrect = answer === expected
  finishQuizAnswer(isCorrect ? '정답입니다.' : `오답입니다. 정답: ${card.back}`, isCorrect, card)
  quizSubmitBtn.disabled = true
  quizAnswerInput.disabled = true
  quizNextBtn.disabled = false
}

function submitChoiceAnswerByEvent(event) {
  if (!quizModeActive) {
    return
  }
  const target = event.target
  if (!(target instanceof HTMLButtonElement)) return
  const rawValue = target.dataset.choice
  if (!rawValue) return
  const selectedValue = decodeQuizChoice(rawValue)
  submitChoiceAnswer(selectedValue)
}

function submitChoiceAnswer(selectedValue) {
  const card = cards.find((item) => item.id === quizCurrentCardId)
  if (!card) {
    startQuiz()
    return
  }
  const expected = card.back
  const isCorrect = normalizeAnswer(selectedValue) === normalizeAnswer(expected)
  finishQuizAnswer(isCorrect ? '정답입니다.' : `오답입니다. 정답: ${expected}`, isCorrect, card)
  if (quizChoiceWrap) {
    const buttons = quizChoiceWrap.querySelectorAll('button[data-choice]')
    buttons.forEach((button) => {
      button.disabled = true
    })
    hideQuizChoiceMode()
  }
  quizNextBtn.disabled = false
}

function nextQuizCard() {
  if (!quizModeActive) return
  if (!canUseStudyActions()) {
    quizModeActive = false
    showQuizLockedMessage()
    return
  }
  const selected = getRandomCardCandidate()
  if (!selected) {
    renderQuizQuestion(null)
    return
  }
  renderQuizQuestion(selected)
}

function startQuiz() {
  if (!canUseStudyActions()) {
    showQuizLockedMessage()
    return
  }
  if (!cards.length) {
    showQuizLockedMessage()
    return
  }
  quizModeActive = true
  quizCorrect = 0
  quizTotal = 0
  quizCurrentCardId = null
  if (quizChoiceWrap) hideQuizChoiceMode()
  if (quizAnswerInput) {
    quizAnswerInput.value = ''
    quizAnswerInput.disabled = quizModeSelect?.value !== 'choice'
  }
  if (quizSubmitBtn) quizSubmitBtn.disabled = quizModeSelect?.value !== 'choice'
  quizScore.textContent = '정답: 0 / 0'
  quizMessage.textContent = '문제를 생성합니다.'
  nextQuizCard()
  quizStartBtn.textContent = '퀴즈 재시작'
}

function setSharedModeState(enabled) {
  const readOnlyTargets = [
    createAccountBtn,
    newAccountName,
    accountSelect,
    setAccountBtn,
    difficultyCorrectInput,
    difficultyTotalInput,
    applyDifficultyBtn,
    exportBtn,
    importInput,
  ]
  readOnlyTargets.forEach((element) => {
    if (element) element.disabled = enabled
  })

  if (form) {
    form.querySelectorAll('input,button').forEach((element) => {
      element.disabled = enabled
    })
  }
}

function renderAccountInfo() {
  if (!accountInfo) {
    accountInfoLabel.textContent = '현재 계정: 정보를 읽는 중입니다.'
    difficultyReady = false
    difficultyWarningBanner.textContent = '현재 계정 정보를 불러오는 중입니다.'
    applyStudyGate()
    return
  }
  difficultyReady = Boolean(accountInfo.difficultyAssessedAt)
  accountInfoLabel.textContent = `현재 계정: ${accountInfo.name} (${accountInfo.id})`
  difficultyInfo.textContent = `현재 계정 난이도: ${accountInfo.difficulty} (${accountInfo.difficultyAssessedAt ? '측정 완료' : '미측정 / 학습 불가'})`
  difficultyWarningBanner.textContent = difficultyReady
    ? '난이도 측정 완료: 카드 복습을 시작할 수 있습니다.'
    : '난이도 미측정 상태입니다. 먼저 난이도를 측정해 주세요.'
  applyStudyGate()
}

async function loadAccount(accountIdCandidate, { persist = true } = {}) {
  const targetId = normalizeAccountId(accountIdCandidate)
  if (!targetId) return null

  try {
    const response = await request(`/api/accounts/${targetId}`, {}, false)
    if (!response.ok) return null
    const info = await response.json()
    accountId = info.id
    accountInfo = info
    if (persist) {
      localStorage.setItem('flash-account-id', accountId)
      accountSelect.value = accountId
    }
    renderAccountInfo()
    return info
  } catch {
    return null
  }
}

async function loadAccountOptions(selectedId = '') {
  try {
    const response = await request('/api/accounts', {}, false)
    if (!response.ok) return []
    const list = await response.json()

    accountSelect.innerHTML = ''
    list.forEach((account) => {
      const option = document.createElement('option')
      option.value = account.id
      const assessed = account.difficultyAssessedAt ? ' [측정됨]' : ' [미측정]'
      option.textContent = `${account.name} (${account.id})${assessed}`
      accountSelect.appendChild(option)
    })

    const normalizedSelectedId = normalizeAccountId(selectedId)
    if (normalizedSelectedId && list.some((item) => item.id === normalizedSelectedId)) {
      accountSelect.value = normalizedSelectedId
    }

    return list
  } catch {
    return []
  }
}

async function ensureAccount() {
  if (shareMode && shareModeAccount) {
    const loaded = await loadAccount(shareModeAccount, { persist: false })
    if (!loaded) {
      studyMessage.textContent = '공유 계정 정보를 불러오지 못했습니다.'
      return null
    }
    setSharedModeState(true)
    return loaded
  }

  const normalizedSavedId = normalizeAccountId(accountId)
  const accountList = await loadAccountOptions(normalizedSavedId)

  if (accountList.length > 0) {
    const validSavedId = normalizedSavedId && accountList.some((item) => item.id === normalizedSavedId)
    const preferredId = validSavedId ? normalizedSavedId : normalizeAccountId(accountList[0]?.id)

    const loaded = await loadAccount(preferredId)
    if (loaded) return loaded
  }

  try {
    const response = await request(
      '/api/accounts',
      {
        method: 'POST',
        body: JSON.stringify({ name: 'Guest' }),
      },
      false,
    )
    if (!response.ok) {
      studyMessage.textContent = '기본 계정 생성에 실패했습니다.'
      return null
    }
    const created = await response.json()
    await loadAccountOptions()
    return await loadAccount(created.id)
  } catch {
    studyMessage.textContent = '기본 계정 생성에 실패했습니다.'
    return null
  }
}

async function createAccount() {
  const name = newAccountName.value.trim() || 'New User'
  const response = await request(
    '/api/accounts',
    {
      method: 'POST',
      body: JSON.stringify({ name }),
    },
    false,
  )
  if (!response.ok) {
    studyMessage.textContent = '계정 생성 실패'
    return
  }

  const created = await response.json()
  await loadAccountOptions(created.id)
  await loadAccount(created.id)
  newAccountName.value = ''
  await loadAllData()
}

async function setAccountFromInput() {
  const next = accountSelect.value
  if (!next) {
    studyMessage.textContent = '계정을 선택하세요.'
    return
  }

  const loaded = await loadAccount(next)
  if (!loaded) {
    studyMessage.textContent = '해당 계정을 찾을 수 없습니다.'
    return
  }

  await loadAllData()
  studyMessage.textContent = '계정 전환 완료.'
}

async function applyDifficulty() {
  if (!accountId) {
    studyMessage.textContent = '계정이 선택되지 않았습니다.'
    return
  }

  const correct = Number(difficultyCorrectInput.value)
  const total = Number(difficultyTotalInput.value)
  if (!Number.isInteger(correct) || !Number.isInteger(total) || total <= 0 || correct < 0 || correct > total) {
    studyMessage.textContent = '난이도 계산 조건: total은 1 이상의 정수, correct는 0~total 사이 정수여야 합니다.'
    return
  }

  applyDifficultyBtn.disabled = true
  studyMessage.textContent = '난이도 측정을 진행합니다...'

  try {
    const response = await request(
      `/api/accounts/${accountId}/difficulty`,
      {
        method: 'POST',
        body: JSON.stringify({ correct, total }),
      },
      false,
    )
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      studyMessage.textContent = `난이도 측정 실패: ${payload.error || response.statusText}`
      return
    }

    const payload = await response.json()
    accountInfo = payload.account
    await loadAllData()
    renderAccountInfo()
    studyMessage.textContent = payload.message || '난이도 측정 완료.'
  } catch (error) {
    studyMessage.textContent = `난이도 측정 실패: ${error.message}`
  } finally {
    applyDifficultyBtn.disabled = false
  }
}

function renderStats() {
  request('/api/stats')
    .then((r) => r.json())
    .then((s) => {
      statsWrap.innerHTML = `
        <div class="pill">전체 카드<strong>${s.total}</strong></div>
        <div class="pill">복습 진행<strong>${s.reviewed}</strong></div>
        <div class="pill">복습 가능<strong>${s.dueToday}</strong></div>
        <div class="pill">정답률<strong>${s.accuracy}%</strong></div>
        <div class="pill">기본 난이도<strong>${s.difficulty}</strong></div>
      `
    })
    .catch(() => {
      statsWrap.innerHTML = `<div class="pill">통계를 불러오지 못했습니다</div>`
    })
}

function renderCardList() {
  cardList.innerHTML = ''
  cards.forEach((card) => {
    const node = document.createElement('li')
    node.className = 'card-item'
    node.innerHTML = `
      <div class="card-top">
        <strong>${escapeHtml(card.front)}</strong>
        <span class="card-meta">${card.topic}</span>
      </div>
      <div>${escapeHtml(card.back)}</div>
      <div class="card-meta">복습 ${card.reviewCount}회 / 난이도 ${card.difficulty} / 최근: ${card.lastReviewedAt || '미복습'}</div>
      ${
        shareMode
          ? ''
          : `<div class="card-actions">
            <button class="secondary edit" data-id="${card.id}">수정</button>
            <button class="danger delete" data-id="${card.id}">삭제</button>
          </div>`
      }
    `
    cardList.appendChild(node)
  })
}

function loadCards() {
  if (!accountId) return
  const q = searchInput.value.trim()
  const topic = topicFilter.value
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (topic) params.set('topic', topic)

  const path = `/api/cards${params.toString() ? `?${params.toString()}` : ''}`
  request(path)
    .then((r) => r.json())
    .then((list) => {
      cards = list
      renderCardList()
    })
}

function hydrateTopics() {
  if (!accountId) return
  request('/api-data')
    .then((r) => r.json())
    .then((payload) => {
      const topics = payload.topics || []
      const current = topicFilter.value
      topicFilter.innerHTML = '<option value="">전체 주제</option>'
      topics.forEach((topic) => {
        const option = document.createElement('option')
        option.value = topic
        option.textContent = topic
        topicFilter.appendChild(option)
      })
      topicFilter.value = current || ''
    })
}

function setCurrentCard(card) {
  if (!card) return
  currentCardId = card.id
  answerRevealed = false
  flashTopic.textContent = `주제: ${card.topic}`
  flashText.textContent = card.front
  flashAnswer.textContent = card.back
  flashAnswer.classList.add('hidden')
  flashAnswer.classList.add('answer-hidden')
  flashText.classList.remove('hidden')
  flashText.classList.remove('answer-hidden')
  studyMessage.textContent = '답안을 확인한 뒤 점수를 남겨주세요.'
}

function clearStudyCard() {
  currentCardId = null
  flashTopic.textContent = '주제: -'
  flashText.textContent = '학습 시작 버튼을 눌러보세요.'
  flashAnswer.textContent = ''
  flashAnswer.classList.add('hidden')
  flashAnswer.classList.add('answer-hidden')
  flashText.classList.remove('hidden')
  flashText.classList.remove('answer-hidden')
  answerRevealed = false
}

function applyStudyGate() {
  const canStudy = canUseStudyActions() && isOnlineNow()
  nextCardBtn.disabled = !canStudy
  revealBtn.disabled = !canStudy
  if (quizStartBtn) quizStartBtn.disabled = !canStudy
  if (quizSubmitBtn) quizSubmitBtn.disabled = !canStudy
  if (quizNextBtn) quizNextBtn.disabled = !canStudy
  if (quizModeSelect) quizModeSelect.disabled = !canStudy
  if (quizAnswerInput) quizAnswerInput.disabled = !canStudy
  if (quizChoiceWrap) quizChoiceWrap.classList.toggle('hidden', !canStudy)
  gradeButtons.forEach((button) => {
    button.disabled = !canStudy
  })

  if (studyArea) {
    studyArea.classList.toggle('is-ready', canStudy)
  }
  setOfflineSafeDisabled()
  if (!canStudy && quizModeActive) {
    quizModeActive = false
    quizCurrentCardId = null
    if (quizQuestion) quizQuestion.textContent = '퀴즈 시작 버튼을 눌러주세요.'
    if (quizScore) quizScore.textContent = `정답: ${quizCorrect} / ${quizTotal}`
    showQuizLockedMessage()
  } else if (canStudy && quizMessage) {
    showQuizLockedMessage()
  }
  if (!difficultyReady && difficultyWarningBanner) {
    difficultyWarningBanner.classList.toggle('is-warning', true)
    return
  }
  if (difficultyWarningBanner) {
    difficultyWarningBanner.classList.toggle('is-warning', false)
  }
}

function loadNextCard() {
  if (!difficultyReady) {
    studyMessage.textContent = '학습 전에 난이도를 먼저 측정해 주세요.'
    return
  }
  request('/api/study/next')
    .then((r) => {
      if (!r.ok) throw new Error('NO_NEXT')
      return r.json()
    })
    .then((card) => {
      setCurrentCard(card)
    })
    .catch(() => {
      clearStudyCard()
      studyMessage.textContent = '복습할 카드가 없습니다.'
    })
}

function revealAnswer() {
  if (!currentCardId) {
    studyMessage.textContent = '먼저 카드부터 불러주세요.'
    return
  }

  answerRevealed = !answerRevealed
  if (answerRevealed) {
    flashAnswer.classList.remove('hidden')
    flashAnswer.classList.remove('answer-hidden')
    flashText.classList.add('hidden')
    flashText.classList.add('answer-hidden')
    studyMessage.textContent = '평가 버튼을 눌러 점수를 입력하세요.'
  } else {
    flashText.classList.remove('hidden')
    flashText.classList.remove('answer-hidden')
    flashAnswer.classList.add('hidden')
    flashAnswer.classList.add('answer-hidden')
    studyMessage.textContent = '답안을 확인한 뒤 점수를 남겨주세요.'
  }
}

function gradeCurrent(result) {
  if (!difficultyReady) {
    studyMessage.textContent = '학습 전에 난이도를 먼저 측정해 주세요.'
    return
  }
  if (!currentCardId) {
    studyMessage.textContent = '카드를 먼저 선택하세요.'
    return
  }

  request(`/api/cards/${currentCardId}/review`, {
    method: 'POST',
    body: JSON.stringify({ result }),
  })
    .then((r) => r.json())
    .then((payload) => {
      if (payload.error) throw new Error(payload.error)
      renderStats()
      loadCards()
      setTimeout(() => loadNextCard(), 500)
      studyMessage.textContent = `다음 복습 예정: ${new Date(payload.nextReviewAt).toLocaleString('ko-KR')}`
    })
    .catch((err) => {
      studyMessage.textContent = `채점 실패: ${err.message || '오류'}`
    })
}

function handleSubmit(event) {
  event.preventDefault()
  const body = {
    front: frontInput.value.trim(),
    back: backInput.value.trim(),
    topic: topicInput.value.trim(),
  }
  if (!body.front || !body.back || !body.topic) return

  request('/api/cards', {
    method: 'POST',
    body: JSON.stringify(body),
  })
    .then((r) => r.json())
    .then(() => {
      frontInput.value = ''
      backInput.value = ''
      topicInput.value = ''
      loadCards()
      hydrateTopics()
      renderStats()
      loadAccount(accountId)
    })
}

function handleCardActions(event) {
  if (shareMode) return
  const target = event.target
  if (target.tagName !== 'BUTTON') return
  const id = target.dataset.id
  if (!id) return

  if (target.classList.contains('delete')) {
    if (!confirm('정말 삭제하시겠습니까?')) return
    request(`/api/cards/${id}`, { method: 'DELETE' }).then(() => {
      loadCards()
      hydrateTopics()
      renderStats()
      if (id === currentCardId) clearStudyCard()
    })
    return
  }

  if (target.classList.contains('edit')) {
    const card = cards.find((item) => item.id === id)
    if (!card) return
    const front = prompt('앞면 수정', card.front)
    const back = prompt('뒤면 수정', card.back)
    const topic = prompt('주제 수정', card.topic)
    if (front === null && back === null && topic === null) return

    request(`/api/cards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        front: front ?? card.front,
        back: back ?? card.back,
        topic: topic ?? card.topic,
      }),
    }).then(() => {
      loadCards()
      hydrateTopics()
      renderStats()
    })
  }
}

function exportCards() {
  request('/api/export')
    .then((r) => r.json())
    .then((list) => {
      const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${accountId}-quokka-flash-cards.json`
      a.click()
      URL.revokeObjectURL(url)
    })
}

function importCards(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result))
      if (!Array.isArray(parsed)) throw new Error('JSON 배열이 아닙니다.')

      request(
        '/api/import',
        {
          method: 'POST',
          body: JSON.stringify(parsed),
        },
      )
        .then((r) => r.json())
        .then((payload) => {
          if (payload.error) throw new Error(payload.error)
          loadAllData()
          studyMessage.textContent = `${payload.imported}개 카드가 가져와졌습니다.`
        })
        .catch((error) => {
          studyMessage.textContent = `가져오기 실패: ${error.message}`
        })
    } catch (error) {
      studyMessage.textContent = `가져오기 실패: ${error.message}`
    }
  }
  reader.readAsText(file)
}

async function loadAllData() {
  if (!accountId) return
  quizModeActive = false
  quizCurrentCardId = null
  if (quizQuestion) quizQuestion.textContent = '퀴즈 시작 버튼을 눌러주세요.'
  if (quizScore) quizScore.textContent = '정답: 0 / 0'
  if (quizMessage) quizMessage.textContent = '난이도 측정 후 시작할 수 있습니다.'
  if (quizAnswerInput) quizAnswerInput.value = ''
  if (quizChoiceWrap) {
    quizChoiceWrap.classList.add('hidden')
    quizChoiceWrap.innerHTML = ''
  }
  await hydrateTopics()
  loadCards()
  renderStats()
  applyStudyGate()
  renderShareControls()
}

function getShareUrl() {
  if (!accountId) return ''
  const url = new URL(window.location.origin + window.location.pathname)
  url.searchParams.set('shareAccount', accountId)
  return url.toString()
}

function renderShareControls() {
  if (shareMode && shareModeInfo) {
    shareModeInfo.textContent = '공유 모드: 조회/학습 기능만 사용 가능합니다.'
  } else if (shareModeInfo) {
    shareModeInfo.textContent = ''
  }
  if (shareLinkInput) {
    shareLinkInput.value = getShareUrl()
  }
}

async function copyShareLink() {
  if (!shareLinkInput?.value) {
    shareLinkInput.value = getShareUrl()
  }
  if (!shareLinkInput?.value) {
    studyMessage.textContent = '공유할 대상 계정이 없습니다.'
    return
  }

  try {
    await navigator.clipboard.writeText(shareLinkInput.value)
    studyMessage.textContent = '공유 링크가 클립보드에 복사되었습니다.'
  } catch {
    studyMessage.textContent = `복사할 수 없습니다. 링크: ${shareLinkInput.value}`
  }
}

form.addEventListener('submit', handleSubmit)
clearBtn.addEventListener('click', () => {
  frontInput.value = ''
  backInput.value = ''
  topicInput.value = ''
})
searchInput.addEventListener('input', loadCards)
topicFilter.addEventListener('change', loadCards)
cardList.addEventListener('click', handleCardActions)
nextCardBtn.addEventListener('click', loadNextCard)
revealBtn.addEventListener('click', revealAnswer)
gradeButtons.forEach((button) => {
  button.addEventListener('click', () => gradeCurrent(button.dataset.result))
})
exportBtn.addEventListener('click', exportCards)
importInput.addEventListener('change', importCards)
createAccountBtn.addEventListener('click', createAccount)
setAccountBtn.addEventListener('click', setAccountFromInput)
applyDifficultyBtn.addEventListener('click', applyDifficulty)
if (createShareLinkBtn) {
  createShareLinkBtn.addEventListener('click', () => {
    renderShareControls()
    if (shareLinkInput) {
      shareLinkInput.focus()
      shareLinkInput.select()
    }
  })
}
if (copyShareLinkBtn) {
  copyShareLinkBtn.addEventListener('click', copyShareLink)
}
if (quizStartBtn) {
  quizStartBtn.addEventListener('click', startQuiz)
}
if (quizSubmitBtn) {
  quizSubmitBtn.addEventListener('click', submitTextAnswer)
}
if (quizNextBtn) {
  quizNextBtn.addEventListener('click', nextQuizCard)
}
if (quizChoiceWrap) {
  quizChoiceWrap.addEventListener('click', submitChoiceAnswerByEvent)
}
if (quizModeSelect) {
  quizModeSelect.addEventListener('change', () => {
    if (!quizModeActive || !quizCurrentCardId) return
    const card = cards.find((item) => item.id === quizCurrentCardId)
    if (card) renderQuizQuestion(card)
  })
}

async function init() {
  applyStudyGate()
  renderConnectivityStatus()
  setupServiceWorker()
  window.addEventListener('online', () => {
    renderConnectivityStatus()
    setOfflineSafeDisabled()
    loadAllData()
  })
  window.addEventListener('offline', () => {
    renderConnectivityStatus()
    setOfflineSafeDisabled()
  })
  const loaded = await ensureAccount()
  if (!loaded) return
  if (shareMode) {
    setSharedModeState(true)
  }
  loadAllData()
}

function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch(() => {
        if (connectivityStatus) {
          connectivityStatus.textContent = '서비스워커 등록에 실패했습니다. 오프라인 모드가 제한될 수 있습니다.'
          connectivityStatus.classList.add('is-offline')
        }
      })
  })
}

init()
