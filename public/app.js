/* ===== QuokkaWords — Main App ===== */

// ── Constants ──

const SEED_DECKS = [
  { id: 'basic-300', name: '기초 300', emoji: '📚', description: '필수 기초 영단어' },
  { id: 'toeic', name: '토익 빈출', emoji: '📝', description: '토익 시험 빈출 단어' },
  { id: 'business', name: '비즈니스 영어', emoji: '💼', description: '비즈니스 필수 영단어' },
];

const SEED_CARDS = [
  { deckId: 'basic-300', english: 'abandon', koreanMeaning: '버리다', koreanExplanation: '무언가를 포기하다.', example: 'He abandoned the project.', exampleKorean: '그는 프로젝트를 포기했다.' },
  { deckId: 'basic-300', english: 'abundant', koreanMeaning: '풍부한', koreanExplanation: '매우 많고 충분한.', example: 'The region has abundant resources.', exampleKorean: '그 지역은 자원이 풍부하다.' },
  { deckId: 'basic-300', english: 'acquire', koreanMeaning: '얻다', koreanExplanation: '노력이나 경험으로 획득하다.', example: 'She acquired new skills.', exampleKorean: '그녀는 새로운 기술을 습득했다.' },
  { deckId: 'basic-300', english: 'adequate', koreanMeaning: '충분한', koreanExplanation: '필요한 조건을 만족하는.', example: 'The supply is adequate.', exampleKorean: '공급이 충분하다.' },
  { deckId: 'basic-300', english: 'adverse', koreanMeaning: '불리한', koreanExplanation: '상황이 나쁜.', example: 'Adverse weather delayed the flight.', exampleKorean: '악천후로 비행기가 지연됐다.' },
  { deckId: 'basic-300', english: 'anticipate', koreanMeaning: '예상하다', koreanExplanation: '미리 예측하다.', example: 'We anticipate strong sales.', exampleKorean: '우리는 강한 매출을 예상한다.' },
  { deckId: 'basic-300', english: 'brief', koreanMeaning: '간단한', koreanExplanation: '짧고 핵심적인.', example: 'He gave a brief summary.', exampleKorean: '그는 간단한 요약을 했다.' },
  { deckId: 'basic-300', english: 'convey', koreanMeaning: '전달하다', koreanExplanation: '의미나 감정을 전하다.', example: 'Words convey meaning.', exampleKorean: '말은 의미를 전달한다.' },
  { deckId: 'basic-300', english: 'decline', koreanMeaning: '감소하다', koreanExplanation: '줄어들다 또는 거절하다.', example: 'Sales declined last quarter.', exampleKorean: '지난 분기 매출이 감소했다.' },
  { deckId: 'basic-300', english: 'despite', koreanMeaning: '~에도 불구하고', koreanExplanation: '반대 상황에서도.', example: 'Despite the rain, we went out.', exampleKorean: '비에도 불구하고 우리는 외출했다.' },
];

const QUOKKA_MESSAGES = {
  default: ['안녕! 오늘도 같이 공부하자!', '오늘은 뭘 배워볼까?', '화이팅! 같이 해보자!'],
  correct: ['역시 넌 최고야!', '완벽해!', '대단해! 잘했어!', '멋지다!'],
  unknown: ['괜찮아, 다시 해보자!', '조금만 더 힘내!', '다음엔 꼭!', '천천히 해도 괜찮아!'],
  streak: ['와! 연속 정답이야!', '불타오르고 있어! 🔥', '멈출 수 없는 기세!'],
  gameCorrect: ['정답! 대단해!', '맞았어! 최고!', '역시!'],
  gameWrong: ['아쉽다! 다음엔 맞출 수 있어!', '괜찮아, 실수해도 돼!'],
};

const LS = {
  cards: 'qw-cards',
  states: 'qw-card-states',
  decks: 'qw-decks',
  child: 'qw-child',
  gameHistory: 'qw-game-history',
};

// ── Quokka SVG ──

function quokkaSVG(size = 120) {
  const s = size;
  const cx = s / 2, cy = s / 2;
  const bodyR = s * 0.38;
  const faceR = s * 0.28;
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
    <!-- ears -->
    <ellipse cx="${cx - bodyR * 0.55}" cy="${cy - bodyR * 0.7}" rx="${s * 0.09}" ry="${s * 0.13}" fill="#B8845A" transform="rotate(-15 ${cx - bodyR * 0.55} ${cy - bodyR * 0.7})"/>
    <ellipse cx="${cx + bodyR * 0.55}" cy="${cy - bodyR * 0.7}" rx="${s * 0.09}" ry="${s * 0.13}" fill="#B8845A" transform="rotate(15 ${cx + bodyR * 0.55} ${cy - bodyR * 0.7})"/>
    <ellipse cx="${cx - bodyR * 0.55}" cy="${cy - bodyR * 0.7}" rx="${s * 0.055}" ry="${s * 0.085}" fill="#E8C9A0" transform="rotate(-15 ${cx - bodyR * 0.55} ${cy - bodyR * 0.7})"/>
    <ellipse cx="${cx + bodyR * 0.55}" cy="${cy - bodyR * 0.7}" rx="${s * 0.055}" ry="${s * 0.085}" fill="#E8C9A0" transform="rotate(15 ${cx + bodyR * 0.55} ${cy - bodyR * 0.7})"/>
    <!-- body -->
    <circle cx="${cx}" cy="${cy + s * 0.05}" r="${bodyR}" fill="#C4956A"/>
    <!-- face -->
    <circle cx="${cx}" cy="${cy - s * 0.02}" r="${faceR}" fill="#F0DFC0"/>
    <!-- eyes -->
    <circle cx="${cx - s * 0.08}" cy="${cy - s * 0.07}" r="${s * 0.04}" fill="#2D2D2D"/>
    <circle cx="${cx + s * 0.08}" cy="${cy - s * 0.07}" r="${s * 0.04}" fill="#2D2D2D"/>
    <circle cx="${cx - s * 0.065}" cy="${cy - s * 0.085}" r="${s * 0.015}" fill="#FFFFFF"/>
    <circle cx="${cx + s * 0.095}" cy="${cy - s * 0.085}" r="${s * 0.015}" fill="#FFFFFF"/>
    <!-- nose -->
    <ellipse cx="${cx}" cy="${cy + s * 0.02}" rx="${s * 0.035}" ry="${s * 0.025}" fill="#A0694B"/>
    <!-- mouth -->
    <path d="M${cx - s * 0.05} ${cy + s * 0.06} Q${cx} ${cy + s * 0.11} ${cx + s * 0.05} ${cy + s * 0.06}" stroke="#A0694B" stroke-width="${s * 0.018}" fill="none" stroke-linecap="round"/>
    <!-- cheeks -->
    <circle cx="${cx - s * 0.14}" cy="${cy + s * 0.03}" r="${s * 0.04}" fill="#FFBBA8" opacity="0.5"/>
    <circle cx="${cx + s * 0.14}" cy="${cy + s * 0.03}" r="${s * 0.04}" fill="#FFBBA8" opacity="0.5"/>
  </svg>`;
}

// ── State ──

const state = {
  decks: [],
  cards: [],
  cardStates: {},
  child: null,
  currentDeckId: null,
  studySet: [],
  studyIndex: 0,
  streak: 0,
  isFlipped: false,
  searchQuery: '',
  filterMode: 'all',
  // game
  gameQuestions: [],
  gameIndex: 0,
  gameCorrect: 0,
  gameHistory: [],
};

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS.decks);
    state.decks = raw ? JSON.parse(raw) : [];
    if (state.decks.length === 0) {
      state.decks = SEED_DECKS.map(d => ({ ...d }));
      saveTo(LS.decks, state.decks);
    }
  } catch { state.decks = SEED_DECKS.map(d => ({ ...d })); }

  try {
    const raw = localStorage.getItem(LS.cards);
    state.cards = raw ? JSON.parse(raw) : [];
    if (state.cards.length === 0) {
      state.cards = SEED_CARDS.map(c => ({ ...c, id: uid(), createdAt: new Date().toISOString() }));
      saveTo(LS.cards, state.cards);
    }
  } catch { state.cards = []; }

  try {
    const raw = localStorage.getItem(LS.states);
    state.cardStates = raw ? JSON.parse(raw) : {};
  } catch { state.cardStates = {}; }

  try {
    const raw = localStorage.getItem(LS.child);
    state.child = raw ? JSON.parse(raw) : null;
  } catch { state.child = null; }

  try {
    const raw = localStorage.getItem(LS.gameHistory);
    state.gameHistory = raw ? JSON.parse(raw) : [];
  } catch { state.gameHistory = []; }
}

function saveTo(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function saveCards() { saveTo(LS.cards, state.cards); }
function saveStates() { saveTo(LS.states, state.cardStates); }
function saveChild() { saveTo(LS.child, state.child); }
function saveGameHistory() { saveTo(LS.gameHistory, state.gameHistory); }

// ── Screen Navigation ──

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function showChildInfoScreen() {
  showScreen('screen-child-info');
  document.getElementById('mascot-main').innerHTML = quokkaSVG(120);
}

function showDeckScreen() {
  if (!state.child) { showChildInfoScreen(); return; }
  showScreen('screen-deck');
  document.getElementById('mascot-deck').innerHTML = quokkaSVG(100);
  const greeting = state.child.name + '아, 어떤 덱을 공부할까?';
  document.getElementById('deck-greeting').textContent = greeting;
  document.getElementById('speech-deck').textContent = randomMsg(QUOKKA_MESSAGES.default);
  renderDeckGrid();
}

function showStudyScreen(deckId) {
  state.currentDeckId = deckId;
  state.streak = 0;
  state.isFlipped = false;
  state.searchQuery = '';
  state.filterMode = 'all';
  showScreen('screen-study');
  const deck = state.decks.find(d => d.id === deckId);
  document.getElementById('deck-title').textContent = deck ? `${deck.emoji} ${deck.name}` : '';
  document.getElementById('streak-counter').textContent = '🔥 0';
  document.getElementById('search-input').value = '';
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === 'all');
  });
  hideReaction('quokka-reaction');
  applyFilters();
}

function showGameScreen() {
  if (!state.currentDeckId) return;
  showScreen('screen-game');
  const deck = state.decks.find(d => d.id === state.currentDeckId);
  document.getElementById('game-deck-title').textContent = deck ? `${deck.emoji} 게임` : '게임 학습';
  document.getElementById('game-complete').style.display = 'none';
  document.getElementById('game-area').style.display = 'block';
  hideReaction('game-reaction');
  initGame();
}

function showAdminScreen() {
  showScreen('screen-admin');
  renderAdminDeckSelect();
  renderAdminCardList();
}

function showReportScreen() {
  showScreen('screen-report');
  renderReport();
}

// ── Toast ──

function showToast(message, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.classList.add('toast-exit'), 2500);
  setTimeout(() => t.remove(), 3000);
}

// ── Helpers ──

function randomMsg(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function cardsForDeck(deckId) { return state.cards.filter(c => c.deckId === deckId); }

function isMemorized(cardId) { return !!state.cardStates[cardId]?.memorized; }

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── Deck Grid ──

function renderDeckGrid() {
  const grid = document.getElementById('deck-grid');
  grid.innerHTML = '';
  state.decks.forEach(deck => {
    const cards = cardsForDeck(deck.id);
    const total = cards.length;
    const memorized = cards.filter(c => isMemorized(c.id)).length;
    const pct = total > 0 ? Math.round(memorized / total * 100) : 0;

    const el = document.createElement('div');
    el.className = 'deck-card';
    el.innerHTML = `
      <span class="deck-card-emoji">${deck.emoji}</span>
      <div class="deck-card-info">
        <div class="deck-card-name">${deck.name}</div>
        <div class="deck-card-desc">${deck.description}</div>
        <div class="deck-card-stats">
          <span>📄 ${total}개</span>
          <span>✅ ${memorized}개 외움</span>
        </div>
        <div class="deck-mini-bar"><div class="deck-mini-bar-fill" style="width:${pct}%"></div></div>
      </div>
      <span class="deck-card-badge">🦘</span>
    `;
    el.addEventListener('click', () => showStudyScreen(deck.id));
    grid.appendChild(el);
  });
}

// ── Study Screen ──

function applyFilters() {
  let list = cardsForDeck(state.currentDeckId);
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(c =>
      c.english.toLowerCase().includes(q) ||
      c.koreanMeaning.includes(q)
    );
  }
  if (state.filterMode === 'memorized') {
    list = list.filter(c => isMemorized(c.id));
  } else if (state.filterMode === 'unknown') {
    list = list.filter(c => !isMemorized(c.id));
  }
  state.studySet = list;
  state.studyIndex = Math.min(state.studyIndex, Math.max(0, list.length - 1));
  if (list.length === 0) state.studyIndex = 0;
  renderCurrentCard();
}

function renderCurrentCard() {
  const card = state.studySet[state.studyIndex];
  const fc = document.getElementById('flashcard');

  if (!card) {
    fc.style.display = 'none';
    document.getElementById('progress-text').textContent = '카드가 없습니다';
    document.getElementById('progress-bar').style.width = '0%';
    return;
  }

  fc.style.display = 'block';
  fc.classList.remove('flipped');
  state.isFlipped = false;

  document.getElementById('card-english').textContent = card.english;
  document.getElementById('card-korean-meaning').textContent = card.koreanMeaning;
  document.getElementById('card-korean-explanation').textContent = card.koreanExplanation || '';
  document.getElementById('card-example').textContent = card.example ? `"${card.example}"` : '';
  document.getElementById('card-example-korean').textContent = card.exampleKorean || '';

  const total = state.studySet.length;
  const idx = state.studyIndex + 1;
  document.getElementById('progress-text').textContent = `${idx} / ${total}`;
  document.getElementById('progress-bar').style.width = `${(idx / total) * 100}%`;
}

function flipCard() {
  if (state.studySet.length === 0) return;
  state.isFlipped = !state.isFlipped;
  document.getElementById('flashcard').classList.toggle('flipped', state.isFlipped);
}

function nextCard() {
  if (state.studySet.length === 0) return;
  state.studyIndex = (state.studyIndex + 1) % state.studySet.length;
  renderCurrentCard();
  hideReaction('quokka-reaction');
}

function prevCard() {
  if (state.studySet.length === 0) return;
  state.studyIndex = (state.studyIndex - 1 + state.studySet.length) % state.studySet.length;
  renderCurrentCard();
  hideReaction('quokka-reaction');
}

function randomCard() {
  if (state.studySet.length <= 1) return;
  let idx;
  do { idx = Math.floor(Math.random() * state.studySet.length); } while (idx === state.studyIndex);
  state.studyIndex = idx;
  renderCurrentCard();
  hideReaction('quokka-reaction');
}

function markMemorized() {
  const card = state.studySet[state.studyIndex];
  if (!card) return;
  state.cardStates[card.id] = { memorized: true };
  saveStates();
  state.streak++;
  updateStreak();
  showReaction('quokka-reaction', 'reaction-mascot', 'reaction-bubble', 'correct');
  if (state.streak > 0 && state.streak % 5 === 0) {
    showReaction('quokka-reaction', 'reaction-mascot', 'reaction-bubble', 'streak');
    launchConfetti();
  }
  setTimeout(() => nextCard(), 900);
}

function markUnknown() {
  const card = state.studySet[state.studyIndex];
  if (!card) return;
  state.cardStates[card.id] = { memorized: false };
  saveStates();
  state.streak = 0;
  updateStreak();
  showReaction('quokka-reaction', 'reaction-mascot', 'reaction-bubble', 'unknown');
  setTimeout(() => nextCard(), 900);
}

function updateStreak() {
  const el = document.getElementById('streak-counter');
  el.textContent = `🔥 ${state.streak}`;
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

// ── Reactions ──

function showReaction(containerId, mascotId, bubbleId, type) {
  const container = document.getElementById(containerId);
  const mascot = document.getElementById(mascotId);
  const bubble = document.getElementById(bubbleId);
  mascot.innerHTML = quokkaSVG(50);
  const msgs = QUOKKA_MESSAGES[type] || QUOKKA_MESSAGES.correct;
  bubble.textContent = randomMsg(msgs);
  container.classList.add('visible');
}

function hideReaction(containerId) {
  document.getElementById(containerId).classList.remove('visible');
}

// ── Confetti ──

function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const colors = ['#FF6B4A', '#7ECEC1', '#FF8A6B', '#87CEEB', '#FFD93D', '#6BCB77'];
  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * 0.3 - canvas.height * 0.1,
    w: Math.random() * 8 + 4,
    h: Math.random() * 6 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 3 + 2,
    rot: Math.random() * 360,
    vr: (Math.random() - 0.5) * 10,
    opacity: 1,
  }));

  let frame = 0;
  const maxFrames = 120;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.rot += p.vr;
      p.opacity = Math.max(0, 1 - frame / maxFrames);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < maxFrames) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(draw);
}

// ── Game (Quiz) ──

function initGame() {
  const deckCards = cardsForDeck(state.currentDeckId);
  if (deckCards.length < 2) {
    document.getElementById('game-area').innerHTML =
      '<div class="study-empty"><div class="empty-emoji">😅</div><p>카드가 2개 이상 필요해요!</p></div>';
    return;
  }

  const shuffled = [...deckCards].sort(() => Math.random() - 0.5);
  const count = Math.min(shuffled.length, 10);
  state.gameQuestions = shuffled.slice(0, count).map(card => {
    const wrongPool = deckCards.filter(c => c.id !== card.id);
    const wrongOptions = wrongPool.sort(() => Math.random() - 0.5).slice(0, 3).map(c => c.koreanMeaning);
    const options = [card.koreanMeaning, ...wrongOptions].sort(() => Math.random() - 0.5);
    return { card, options, answered: false, correct: false };
  });
  state.gameIndex = 0;
  state.gameCorrect = 0;

  updateGameProgress();
  renderGameQuestion();
}

function updateGameProgress() {
  const total = state.gameQuestions.length;
  const idx = state.gameIndex + 1;
  document.getElementById('game-progress-text').textContent = `${idx} / ${total}`;
  document.getElementById('game-progress-bar').style.width = `${(idx / total) * 100}%`;
  document.getElementById('game-score').textContent = `${state.gameCorrect} 정답`;
}

function renderGameQuestion() {
  const q = state.gameQuestions[state.gameIndex];
  if (!q) return;
  const area = document.getElementById('game-area');
  area.innerHTML = `
    <div style="text-align:center;padding:30px 10px">
      <p style="font-size:.85rem;color:var(--text-light);margin-bottom:8px">이 단어의 뜻은?</p>
      <p style="font-family:'Poppins',sans-serif;font-size:2.2rem;font-weight:700;margin-bottom:24px">${q.card.english}</p>
      <div id="game-options" style="display:flex;flex-direction:column;gap:10px;max-width:400px;margin:0 auto"></div>
    </div>
  `;
  const optionsEl = document.getElementById('game-options');
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.style.width = '100%';
    btn.style.padding = '14px';
    btn.style.fontSize = '1rem';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleGameAnswer(opt, q));
    optionsEl.appendChild(btn);
  });
}

function handleGameAnswer(selected, q) {
  if (q.answered) return;
  q.answered = true;
  const isCorrect = selected === q.card.koreanMeaning;
  q.correct = isCorrect;

  if (isCorrect) {
    state.gameCorrect++;
    showReaction('game-reaction', 'game-reaction-mascot', 'game-reaction-bubble', 'gameCorrect');
  } else {
    showReaction('game-reaction', 'game-reaction-mascot', 'game-reaction-bubble', 'gameWrong');
  }
  updateGameProgress();

  // Highlight buttons
  const btns = document.querySelectorAll('#game-options .nav-btn');
  btns.forEach(btn => {
    btn.style.pointerEvents = 'none';
    if (btn.textContent === q.card.koreanMeaning) {
      btn.style.background = 'linear-gradient(135deg,#6BCB77,#4ECDC4)';
      btn.style.color = '#fff';
      btn.style.borderColor = '#6BCB77';
    } else if (btn.textContent === selected && !isCorrect) {
      btn.style.background = 'linear-gradient(135deg,#FF6B6B,#FF8A6B)';
      btn.style.color = '#fff';
      btn.style.borderColor = '#FF6B6B';
    }
  });

  setTimeout(() => {
    state.gameIndex++;
    hideReaction('game-reaction');
    if (state.gameIndex < state.gameQuestions.length) {
      updateGameProgress();
      renderGameQuestion();
    } else {
      finishGame();
    }
  }, 1200);
}

function finishGame() {
  document.getElementById('game-area').style.display = 'none';
  const complete = document.getElementById('game-complete');
  complete.style.display = 'block';
  document.getElementById('mascot-game-complete').innerHTML = quokkaSVG(100);

  const total = state.gameQuestions.length;
  const correct = state.gameCorrect;
  const pct = Math.round(correct / total * 100);
  document.getElementById('game-result-text').textContent =
    `${total}문제 중 ${correct}개 정답! (${pct}%)`;

  if (pct >= 80) launchConfetti();

  // Save history
  const record = {
    date: new Date().toISOString(),
    deckId: state.currentDeckId,
    total,
    correct,
    pct,
  };
  state.gameHistory.push(record);
  if (state.gameHistory.length > 50) state.gameHistory = state.gameHistory.slice(-50);
  saveGameHistory();
}

// ── Admin ──

function renderAdminDeckSelect() {
  const sel = document.getElementById('admin-deck-select');
  sel.innerHTML = '';
  state.decks.forEach(d => {
    const o = document.createElement('option');
    o.value = d.id;
    o.textContent = `${d.emoji} ${d.name}`;
    sel.appendChild(o);
  });
}

function renderAdminCardList() {
  const deckId = document.getElementById('admin-deck-select').value;
  const list = cardsForDeck(deckId);
  const container = document.getElementById('admin-card-list');
  const title = document.getElementById('admin-list-title');
  title.textContent = `단어 목록 (${list.length}개)`;
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<p style="color:var(--text-light);font-size:.9rem;padding:16px 0">이 덱에 단어가 없습니다.</p>';
    return;
  }

  list.forEach(card => {
    const el = document.createElement('div');
    el.className = 'admin-card-item';
    el.innerHTML = `
      <div class="admin-card-text">
        <div class="admin-card-english">${card.english}</div>
        <div class="admin-card-korean">${card.koreanMeaning}${card.koreanExplanation ? ' — ' + card.koreanExplanation : ''}</div>
      </div>
      <button class="danger-btn" data-id="${card.id}">삭제</button>
    `;
    el.querySelector('.danger-btn').addEventListener('click', () => {
      state.cards = state.cards.filter(c => c.id !== card.id);
      delete state.cardStates[card.id];
      saveCards();
      saveStates();
      renderAdminCardList();
      showToast('단어가 삭제되었습니다.', 'info');
    });
    container.appendChild(el);
  });
}

function handleAddWord(e) {
  e.preventDefault();
  const english = document.getElementById('input-english').value.trim();
  const koreanMeaning = document.getElementById('input-korean-meaning').value.trim();
  if (!english || !koreanMeaning) return showToast('영어와 한국어 뜻은 필수입니다.', 'error');

  const card = {
    id: uid(),
    deckId: document.getElementById('admin-deck-select').value,
    english,
    koreanMeaning,
    koreanExplanation: document.getElementById('input-korean-explanation').value.trim(),
    example: document.getElementById('input-example').value.trim(),
    exampleKorean: document.getElementById('input-example-korean').value.trim(),
    createdAt: new Date().toISOString(),
  };
  state.cards.push(card);
  saveCards();
  renderAdminCardList();
  showToast(`"${english}" 추가 완료!`, 'success');
  e.target.reset();
}

function handleCSVImport() {
  const raw = document.getElementById('csv-input').value.trim();
  if (!raw) return showToast('CSV 데이터를 입력하세요.', 'error');
  const deckId = document.getElementById('admin-deck-select').value;
  const lines = raw.split('\n').filter(l => l.trim());
  let count = 0;

  lines.forEach(line => {
    if (line.toLowerCase().startsWith('english,')) return;
    const parts = line.split(',').map(p => p.trim());
    if (parts.length < 2 || !parts[0] || !parts[1]) return;
    state.cards.push({
      id: uid(),
      deckId,
      english: parts[0],
      koreanMeaning: parts[1],
      koreanExplanation: parts[2] || '',
      example: parts[3] || '',
      exampleKorean: parts[4] || '',
      createdAt: new Date().toISOString(),
    });
    count++;
  });

  if (count === 0) return showToast('유효한 데이터가 없습니다.', 'error');
  saveCards();
  renderAdminCardList();
  document.getElementById('csv-input').value = '';
  showToast(`${count}개 단어가 등록되었습니다!`, 'success');
}

// ── Report ──

function renderReport() {
  // Child info
  if (state.child) {
    document.getElementById('report-child-name').textContent = `${state.child.name}의 학습 리포트`;
    const levels = { beginner: '초급 (유아~초등 저학년)', elementary: '초등 (초등 고학년)', intermediate: '중급 (중학생 이상)' };
    document.getElementById('report-child-level').textContent = `레벨: ${levels[state.child.level] || state.child.level}`;
  }

  // Summary
  const totalCards = state.cards.length;
  const memorized = state.cards.filter(c => isMemorized(c.id)).length;
  const totalGames = state.gameHistory.length;
  const avgPct = totalGames > 0 ? Math.round(state.gameHistory.reduce((s, g) => s + g.pct, 0) / totalGames) : 0;

  const summaryEl = document.getElementById('report-summary');
  summaryEl.innerHTML = `
    <div class="add-word-form" style="padding:16px;margin:0;text-align:center">
      <div style="font-size:1.8rem;font-weight:700;color:var(--main-orange)">${totalCards}</div>
      <div style="font-size:.8rem;color:var(--text-medium)">전체 단어</div>
    </div>
    <div class="add-word-form" style="padding:16px;margin:0;text-align:center">
      <div style="font-size:1.8rem;font-weight:700;color:var(--success)">${memorized}</div>
      <div style="font-size:.8rem;color:var(--text-medium)">외운 단어</div>
    </div>
    <div class="add-word-form" style="padding:16px;margin:0;text-align:center">
      <div style="font-size:1.8rem;font-weight:700;color:var(--secondary-mint)">${totalGames}</div>
      <div style="font-size:.8rem;color:var(--text-medium)">게임 횟수</div>
    </div>
    <div class="add-word-form" style="padding:16px;margin:0;text-align:center">
      <div style="font-size:1.8rem;font-weight:700;color:var(--secondary-sky)">${avgPct}%</div>
      <div style="font-size:.8rem;color:var(--text-medium)">평균 정답률</div>
    </div>
  `;

  // Per-deck
  const decksEl = document.getElementById('report-decks');
  decksEl.innerHTML = '';
  state.decks.forEach(deck => {
    const dc = cardsForDeck(deck.id);
    const dm = dc.filter(c => isMemorized(c.id)).length;
    const pct = dc.length > 0 ? Math.round(dm / dc.length * 100) : 0;
    decksEl.innerHTML += `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f0e6da">
        <span style="font-size:1.4rem">${deck.emoji}</span>
        <div style="flex:1">
          <div style="font-weight:600;font-size:.9rem">${deck.name}</div>
          <div class="deck-mini-bar" style="margin-top:4px"><div class="deck-mini-bar-fill" style="width:${pct}%"></div></div>
        </div>
        <span style="font-size:.85rem;color:var(--text-medium)">${dm}/${dc.length} (${pct}%)</span>
      </div>
    `;
  });

  // Game history
  const gamesEl = document.getElementById('report-games');
  if (state.gameHistory.length === 0) {
    gamesEl.innerHTML = '<p style="color:var(--text-light);font-size:.85rem;padding:8px 0">아직 게임 기록이 없습니다.</p>';
  } else {
    const recent = state.gameHistory.slice(-10).reverse();
    gamesEl.innerHTML = recent.map(g => {
      const deck = state.decks.find(d => d.id === g.deckId);
      const d = new Date(g.date);
      const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f0e6da;font-size:.85rem">
          <span>${deck ? deck.emoji : '📄'}</span>
          <span style="flex:1">${g.correct}/${g.total} (${g.pct}%)</span>
          <span style="color:var(--text-light)">${dateStr}</span>
        </div>
      `;
    }).join('');
  }
}

// ── Child Info ──

function handleChildInfo(e) {
  e.preventDefault();
  const name = document.getElementById('child-name').value.trim();
  if (!name) return showToast('이름을 입력해주세요!', 'error');
  const level = document.getElementById('child-level').value;
  state.child = { name, level, createdAt: new Date().toISOString() };
  saveChild();
  showToast(`${name}아, 환영해!`, 'success');
  showDeckScreen();
}

// ── Keyboard ──

document.addEventListener('keydown', (e) => {
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) return;

  if (document.getElementById('screen-study').classList.contains('active')) {
    switch (e.code) {
      case 'Space': e.preventDefault(); flipCard(); break;
      case 'ArrowRight': e.preventDefault(); nextCard(); break;
      case 'ArrowLeft': e.preventDefault(); prevCard(); break;
    }
  }
});

// ── Init ──

function init() {
  loadState();

  // Decide initial screen
  if (state.child) {
    showDeckScreen();
  } else {
    showChildInfoScreen();
  }

  // Child info form
  document.getElementById('child-info-form').addEventListener('submit', handleChildInfo);

  // Deck screen
  document.getElementById('goto-admin').addEventListener('click', showAdminScreen);
  document.getElementById('goto-report').addEventListener('click', showReportScreen);

  // Study screen
  document.getElementById('back-to-decks').addEventListener('click', showDeckScreen);
  document.getElementById('flashcard').addEventListener('click', flipCard);
  document.getElementById('btn-prev').addEventListener('click', prevCard);
  document.getElementById('btn-next').addEventListener('click', nextCard);
  document.getElementById('btn-random').addEventListener('click', randomCard);
  document.getElementById('btn-memorized').addEventListener('click', markMemorized);
  document.getElementById('btn-unknown').addEventListener('click', markUnknown);
  document.getElementById('goto-game').addEventListener('click', showGameScreen);

  // Search & filter
  document.getElementById('search-input').addEventListener('input', debounce(() => {
    state.searchQuery = document.getElementById('search-input').value.trim();
    state.studyIndex = 0;
    applyFilters();
  }, 200));

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filterMode = btn.dataset.filter;
      state.studyIndex = 0;
      applyFilters();
    });
  });

  // Game screen
  document.getElementById('back-to-study').addEventListener('click', () => showStudyScreen(state.currentDeckId));
  document.getElementById('game-retry').addEventListener('click', showGameScreen);
  document.getElementById('game-to-report').addEventListener('click', showReportScreen);
  document.getElementById('game-to-decks').addEventListener('click', showDeckScreen);

  // Admin screen
  document.getElementById('back-to-decks-admin').addEventListener('click', showDeckScreen);
  document.getElementById('add-word-form').addEventListener('submit', handleAddWord);
  document.getElementById('csv-import-btn').addEventListener('click', handleCSVImport);
  document.getElementById('admin-deck-select').addEventListener('change', renderAdminCardList);

  // Report screen
  document.getElementById('back-to-decks-report').addEventListener('click', showDeckScreen);
}

init();
