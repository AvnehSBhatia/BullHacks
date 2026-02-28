/* ============================================================
   GRAVITAS — Frontend App Logic (Multi-Page)
   ============================================================
   Pages: landing, quiz, profile, matches, map, match, inbox, chat, report
   user_id passed via localStorage or ?user_id= URL param
   Each page loads shared styles.css + app.js; app.js detects page and runs init
   ============================================================ */

const API_BASE = window.location.origin;

const STORAGE_KEYS = {
  USER_ID: 'gravitas_user_id',
  VECTOR: 'gravitas_vector',
  CITY: 'gravitas_city',
  INTERESTS: 'gravitas_interests',
  QUIZ_QUESTIONS: 'gravitas_quiz_questions',
  QUIZ_ANSWERS: 'gravitas_quiz_answers',
  MATCHES: 'gravitas_matches',
  ACTIVE_MATCH: 'gravitas_active_match',
  CONNECTIONS: 'gravitas_connections',
  PENDING: 'gravitas_pending',
};

const state = {
  user: {
    id: '',
    vector: [],
    city: '',
    interests: [],
    standing: 87,
  },
  quiz: {
    currentIndex: 0,
    answers: [],
    textAnswers: [],
    questions: [],
  },
  db: [],
  connections: [],
  pending: [],
};

function getUserId() {
  const params = new URLSearchParams(window.location.search);
  const urlId = params.get('user_id');
  const stored = localStorage.getItem(STORAGE_KEYS.USER_ID);
  return urlId || stored || '';
}

function setUserId(id) {
  localStorage.setItem(STORAGE_KEYS.USER_ID, id);
  state.user.id = id;
}

function loadStateFromStorage() {
  state.user.id = localStorage.getItem(STORAGE_KEYS.USER_ID) || '';
  const vec = localStorage.getItem(STORAGE_KEYS.VECTOR);
  state.user.vector = vec ? JSON.parse(vec) : [];
  state.user.city = localStorage.getItem(STORAGE_KEYS.CITY) || '';
  const ints = localStorage.getItem(STORAGE_KEYS.INTERESTS);
  state.user.interests = ints ? JSON.parse(ints) : [];
  const m = localStorage.getItem(STORAGE_KEYS.MATCHES);
  state.db = m ? JSON.parse(m) : [];
  const conn = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
  state.connections = conn ? JSON.parse(conn) : [];
  const pend = localStorage.getItem(STORAGE_KEYS.PENDING);
  state.pending = pend ? JSON.parse(pend) : [];
}

function saveStateToStorage() {
  if (state.user.id) localStorage.setItem(STORAGE_KEYS.USER_ID, state.user.id);
  if (state.user.vector?.length) localStorage.setItem(STORAGE_KEYS.VECTOR, JSON.stringify(state.user.vector));
  localStorage.setItem(STORAGE_KEYS.CITY, state.user.city);
  localStorage.setItem(STORAGE_KEYS.INTERESTS, JSON.stringify(state.user.interests));
  localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(state.db));
  localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(state.connections));
  localStorage.setItem(STORAGE_KEYS.PENDING, JSON.stringify(state.pending));
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast show';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// --- Page-specific inits ---

function initLanding() {
  loadStateFromStorage();
  initParticleBackground();
  initThemeToggle();

  const statProfiles = document.getElementById('stat-profiles');
  if (statProfiles) {
    fetch(`${API_BASE}/api/health`)
      .then(r => r.json())
      .then(d => { statProfiles.textContent = d.db_size ?? 0; })
      .catch(() => { statProfiles.textContent = '0'; });
  }

  const badge = document.getElementById('nav-badge');
  if (badge) {
    const total = state.connections.filter(c => c.unread).length + state.pending.length;
    badge.textContent = total;
    badge.classList.toggle('visible', total > 0);
  }
}

async function initQuiz() {
  loadStateFromStorage();
  initThemeToggle();

  const qCard = document.getElementById('question-card');
  const qCat = document.getElementById('q-category');
  const qText = document.getElementById('q-text');
  const qOptions = document.getElementById('q-options');
  const qSliderWrap = document.getElementById('q-slider-wrap');
  const qSlider = document.getElementById('q-slider');
  const sliderVal = document.getElementById('slider-value-display');
  const btnQuizNext = document.getElementById('quiz-next-btn');
  const qNum = document.getElementById('quiz-q-num');
  const progFill = document.getElementById('progress-fill');
  const progLabel = document.getElementById('progress-section-label');

  state.quiz.currentIndex = 0;
  state.quiz.answers = new Array(10).fill(50);
  state.quiz.textAnswers = new Array(10).fill('');
  state.quiz.questions = [];

  try {
    const res = await fetch(`${API_BASE}/api/questions`);
    const data = await res.json();
    if (!data.questions || data.questions.length !== 10) throw new Error('Invalid questions');
    state.quiz.questions = data.questions.map((text, i) => ({
      id: i < 5 ? 'c' + (i + 1) : 'n' + (i - 4),
      type: 'text',
      category: i < 5 ? 'Core' : 'Niche',
      text,
    }));
  } catch (e) {
    console.error(e);
    showToast('Could not load questions. Is the server running?');
    window.location.href = '/';
    return;
  }

  function loadQuestion(index) {
    state.quiz.currentIndex = index;
    const q = state.quiz.questions[index];
    qNum.textContent = `Question ${index + 1}`;
    progFill.style.width = `${(index + 1) * 10}%`;
    progLabel.textContent = q.category === 'Core' ? 'Core Anchors' : 'Niche Branching';
    qCat.textContent = q.category;
    qCat.style.color = q.category === 'Core' ? 'var(--accent)' : 'var(--accent-3)';
    qText.textContent = q.text;
    qOptions.innerHTML = '';
    btnQuizNext.disabled = true;
    document.getElementById('quiz-next-label').textContent = index === 9 ? 'Build Profile →' : 'Next →';

    let ta = qCard.querySelector('.q-textarea');
    if (!ta) {
      ta = document.createElement('textarea');
      ta.className = 'q-textarea';
      ta.placeholder = 'Write your answer here…';
      ta.rows = 5;
      qCard.appendChild(ta);
    }
    ta.value = state.quiz.textAnswers[index] || '';
    btnQuizNext.disabled = ta.value.trim().length < 3;
    ta.oninput = () => {
      state.quiz.textAnswers[index] = ta.value;
      btnQuizNext.disabled = ta.value.trim().length < 3;
    };
    setTimeout(() => ta.focus(), 100);
  }

  async function finishQuiz() {
    const questions = state.quiz.questions.map(q => q.text);
    const answers = state.quiz.textAnswers.map(a => (a && a.trim()) || "I'm not sure.");
    btnQuizNext.disabled = true;
    document.getElementById('quiz-next-label').textContent = 'Building profile...';

    try {
      const res = await fetch(`${API_BASE}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Embed failed');
      state.user.vector = data.vector;
      localStorage.setItem(STORAGE_KEYS.VECTOR, JSON.stringify(data.vector));
      localStorage.setItem(STORAGE_KEYS.QUIZ_QUESTIONS, JSON.stringify(questions));
      localStorage.setItem(STORAGE_KEYS.QUIZ_ANSWERS, JSON.stringify(answers));
    } catch (e) {
      showToast('Could not build profile. Is the server running?');
      btnQuizNext.disabled = false;
      document.getElementById('quiz-next-label').textContent = 'Build Profile →';
      return;
    }
    window.location.href = '/profile';
  }

  document.querySelector('.back-btn').addEventListener('click', (e) => {
    e.preventDefault();
    if (state.quiz.currentIndex > 0) loadQuestion(state.quiz.currentIndex - 1);
    else window.location.href = '/';
  });

  btnQuizNext.addEventListener('click', () => {
    if (state.quiz.currentIndex < 9) loadQuestion(state.quiz.currentIndex + 1);
    else finishQuiz();
  });

  loadQuestion(0);
}

function initProfile() {
  loadStateFromStorage();
  initThemeToggle();

  const profileId = document.getElementById('profile-id');
  const vectorBars = document.getElementById('vector-bars');
  const cityInput = document.getElementById('city-input');
  const interestChips = document.getElementById('interest-chips');
  const findMatchesBtn = document.getElementById('find-matches-btn');
  const geoBtn = document.getElementById('geo-btn');
  const copyBtn = document.getElementById('copy-id-btn');

  profileId.textContent = state.user.id || '(ID appears after finding matches)';
  cityInput.value = state.user.city;

  // Vector bars
  const labels = ['Extroversion', 'Spontaneity', 'Logic vs Emotion', 'Intellect', 'Leadership', 'Tech Optimism', 'Adventure', 'Competitiveness', 'Patience', 'Bluntness'];
  const vec = state.user.vector || [];
  vectorBars.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const val = vec[i] ?? 0;
    const uiWidth = Math.max(0, Math.min(100, ((val + 1) / 2) * 100));
    const color = uiWidth > 50 ? 'var(--accent)' : 'var(--accent-3)';
    const row = document.createElement('div');
    row.className = 'vector-bar-row';
    row.innerHTML = `
      <div class="vb-label">${labels[i]}</div>
      <div class="vb-track"><div class="vb-fill" style="width:${uiWidth}%; background:${color}"></div></div>
      <div class="vb-pct">${Math.round(uiWidth)}%</div>
    `;
    vectorBars.appendChild(row);
  }

  const interestsList = ['Coffee', 'Hackathons', 'Anime', 'Gym', 'Hiking', 'Reading', 'Philosophy', 'Raving', 'Board Games', 'Art Galleries'];
  interestChips.innerHTML = interestsList.map(int =>
    `<div class="interest-chip" data-int="${int}">${int}</div>`
  ).join('');
  interestChips.querySelectorAll('.interest-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      const selected = [...interestChips.querySelectorAll('.interest-chip.selected')].map(c => c.dataset.int);
      state.user.interests = selected;
    });
  });
  state.user.interests.forEach(int => {
    const chip = interestChips.querySelector(`[data-int="${int}"]`);
    if (chip) chip.classList.add('selected');
  });

  document.getElementById('avatar-emoji').textContent = ['✨', '⚡', '🌌', '🌠'][Math.floor(Math.random() * 4)];

  geoBtn.addEventListener('click', () => {
    geoBtn.innerHTML = '<span>⏳</span> Locating...';
    setTimeout(() => {
      cityInput.value = 'San Francisco, CA';
      state.user.city = 'San Francisco, CA';
      geoBtn.innerHTML = '<span>✓</span> Located';
    }, 800);
  });

  copyBtn.addEventListener('click', () => {
    if (state.user.id) {
      navigator.clipboard.writeText(state.user.id);
      showToast('ID Copied!');
    }
  });

  if (!state.user.vector?.length) {
    showToast('Complete the quiz first.');
    window.location.href = '/quiz';
    return;
  }

  findMatchesBtn.addEventListener('click', async () => {
    state.user.city = cityInput.value || state.user.city;
    if (!state.user.city) {
      showToast('Please enter your city.');
      return;
    }
    const selected = [...interestChips.querySelectorAll('.interest-chip.selected')].map(c => c.dataset.int);
    state.user.interests = selected;
    saveStateToStorage();

    findMatchesBtn.disabled = true;
    findMatchesBtn.textContent = 'Finding matches...';

    const questions = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZ_QUESTIONS) || '[]');
    const answers = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZ_ANSWERS) || '[]');

    try {
      const res = await fetch(`${API_BASE}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vector: state.user.vector,
          city: state.user.city,
          interests: state.user.interests,
          standing: state.user.standing,
          user_id: state.user.id || undefined,
          questions: questions.length ? questions : undefined,
          answers: answers.length ? answers : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Matches failed');
      state.user.id = data.user_id;
      state.db = data.matches || [];
      setUserId(data.user_id);
      saveStateToStorage();
      window.location.href = '/matches';
    } catch (e) {
      showToast('Could not find matches. Is the server running?');
    }
    findMatchesBtn.disabled = false;
    findMatchesBtn.textContent = 'Find My Matches →';
  });
}

function initMatches() {
  loadStateFromStorage();
  initThemeToggle();

  const matchesList = document.getElementById('matches-list');
  const viewMapBtn = document.getElementById('view-map-btn');

  function fetchMatchesIfNeeded() {
    if (state.db.length > 0) return;
    const uid = getUserId();
    if (!uid) {
      window.location.href = '/profile';
      return;
    }
    fetch(`${API_BASE}/api/matches?user_id=${encodeURIComponent(uid)}`)
      .then(r => r.json())
      .then(d => {
        state.db = d.matches || [];
        localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(state.db));
        renderMatches();
      })
      .catch(() => showToast('Could not load matches.'));
  }

  function renderMatches() {
    matchesList.innerHTML = '';
    const top = state.db.slice(0, 5);
    top.forEach((m, idx) => {
      const color = m.matchScore > 80 ? 'var(--accent)' : m.matchScore > 60 ? 'var(--accent-2)' : 'var(--warning)';
      const div = document.createElement('div');
      div.className = 'match-card';
      div.style.setProperty('--match-color', color);
      div.innerHTML = `
        <div class="match-avatar">${m.emoji || '👤'}</div>
        <div class="match-info">
          <div class="match-id">${m.id} <span title="Public Standing">⭐ ${m.standing}</span></div>
          <div class="match-traits">${m.traits || ''}</div>
        </div>
        <div class="match-right">
          <div class="match-score">${Math.round(m.matchScore)}%</div>
          <div class="match-dist">${(m.distance || 0).toFixed(1)}mi away</div>
        </div>
      `;
      div.addEventListener('click', () => {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_MATCH, JSON.stringify(m));
        window.location.href = `/match?user_id=${encodeURIComponent(state.user.id || getUserId())}`;
      });
      matchesList.appendChild(div);
    });
  }

  fetchMatchesIfNeeded();
  renderMatches();
}

function initMap() {
  loadStateFromStorage();
  initThemeToggle();

  const canvas = document.getElementById('gravity-canvas');
  if (!canvas) return;

  // Need vector for map - if none, show empty state (user can explore after quiz)
  if (!state.user.vector?.length) {
    document.getElementById('hud-nearby').textContent = state.db.length;
    document.getElementById('hud-matches').textContent = Math.min(5, state.db.length);
    document.getElementById('hud-city').textContent = state.user.city || '—';
    const canvas = document.getElementById('gravity-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = canvas.parentElement?.clientWidth || 400;
      canvas.height = (canvas.parentElement?.clientHeight || 400) - 80;
      ctx.fillStyle = 'var(--bg-card)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'var(--text-muted)';
      ctx.font = '16px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Complete the quiz to see your gravity map', canvas.width / 2, canvas.height / 2);
    }
    return;
  }

  document.getElementById('hud-nearby').textContent = state.db.length;
  document.getElementById('hud-matches').textContent = Math.min(5, state.db.length);
  document.getElementById('hud-city').textContent = (state.user.city || '—').substring(0, 8);

  let mapCtx = null;
  let mapLayout = { positions: {}, edges: [] };
  let mapNodes = [];
  let mapOffset = { x: 0, y: 0 };
  let isDragging = false;
  let startDrag = { x: 0, y: 0 };
  let animId = null;

  function resizeMap() {
    canvas.width = canvas.parentElement?.clientWidth || 400;
    canvas.height = (canvas.parentElement?.clientHeight || 400) - 80;
  }

  function layoutToCanvas(x, y, cw, ch, cx, cy, scale) {
    return [cx + x * scale, cy + y * scale];
  }

  async function initGravityMap() {
    mapCtx = canvas.getContext('2d');
    resizeMap();
    window.addEventListener('resize', resizeMap);
    canvas.addEventListener('mousedown', e => { isDragging = true; startDrag = { x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y }; });
    canvas.addEventListener('mousemove', e => { if (isDragging) { mapOffset.x = e.clientX - startDrag.x; mapOffset.y = e.clientY - startDrag.y; } });
    window.addEventListener('mouseup', () => isDragging = false);

    const centerId = state.user.id || 'center';
    const matches = state.db.map(u => ({ id: u.id, matchScore: u.matchScore ?? 50, standing: u.standing ?? 80 }));

    try {
      const res = await fetch(`${API_BASE}/api/map-layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ center_id: centerId, matches })
      });
      const data = await res.json();
      if (res.ok && data.positions) {
        mapLayout = { positions: data.positions, edges: data.edges || [] };
      } else {
        mapLayout = { positions: { [centerId]: [0, 0] }, edges: [] };
        matches.forEach((m, i) => {
          const theta = (2 * Math.PI * i) / Math.max(matches.length, 1);
          mapLayout.positions[m.id] = [Math.cos(theta) * 1.2, Math.sin(theta) * 1.2];
          mapLayout.edges.push([centerId, m.id, m.matchScore]);
        });
      }
    } catch (e) {
      console.error('Map layout failed:', e);
      mapLayout = { positions: { [centerId]: [0, 0] }, edges: [] };
      matches.forEach((m, i) => {
        const theta = (2 * Math.PI * i) / Math.max(matches.length, 1);
        mapLayout.positions[m.id] = [Math.cos(theta) * 1.2, Math.sin(theta) * 1.2];
        mapLayout.edges.push([centerId, m.id, m.matchScore]);
      });
    }

    mapNodes = state.db.map(u => ({
      ...u,
      score: u.matchScore ?? 50,
      r: 8 + (u.standing || 80) / 15
    }));

    function animate() {
      animId = requestAnimationFrame(animate);
      const cw = canvas.width;
      const ch = canvas.height;
      const cx = cw / 2 + mapOffset.x;
      const cy = ch / 2 + mapOffset.y;
      const scale = Math.min(cw, ch) * 0.35;
      mapCtx.clearRect(0, 0, cw, ch);

      const pos = mapLayout.positions;

      mapNodes.forEach(n => {
        const p = pos[n.id];
        if (!p) return;
        const [nx, ny] = layoutToCanvas(p[0], p[1], cw, ch, cx, cy, scale);
        const color = n.score > 80 ? '#818cf8' : n.score > 60 ? '#34d399' : '#fb923c';
        mapCtx.beginPath();
        mapCtx.arc(nx, ny, n.r, 0, Math.PI * 2);
        mapCtx.fillStyle = color;
        mapCtx.fill();
      });

      const centerPos = pos[centerId];
      const [ccx, ccy] = centerPos ? layoutToCanvas(centerPos[0], centerPos[1], cw, ch, cx, cy, scale) : [cx, cy];

      const drawConns = document.getElementById('ctrl-connections')?.classList.contains('active');
      if (drawConns !== false) {
        mapLayout.edges.forEach(([u, v, weight]) => {
          const pu = pos[u];
          const pv = pos[v];
          if (!pu || !pv) return;
          const [x1, y1] = layoutToCanvas(pu[0], pu[1], cw, ch, cx, cy, scale);
          const [x2, y2] = layoutToCanvas(pv[0], pv[1], cw, ch, cx, cy, scale);
          mapCtx.beginPath();
          mapCtx.moveTo(x1, y1);
          mapCtx.lineTo(x2, y2);
          mapCtx.strokeStyle = weight > 80 ? 'rgba(129,140,248,0.45)' : weight > 60 ? 'rgba(52,211,153,0.3)' : 'rgba(251,146,60,0.2)';
          mapCtx.lineWidth = weight > 80 ? 2 : 1;
          mapCtx.stroke();
        });
      }

      mapCtx.beginPath();
      mapCtx.arc(ccx, ccy, 18, 0, Math.PI * 2);
      const g = mapCtx.createLinearGradient(ccx - 18, ccy - 18, ccx + 18, ccy + 18);
      g.addColorStop(0, '#818cf8');
      g.addColorStop(1, '#f472b6');
      mapCtx.fillStyle = g;
      mapCtx.fill();
      mapCtx.fillStyle = '#fff';
      mapCtx.font = '12px Inter';
      mapCtx.textAlign = 'center';
      mapCtx.fillText('YOU', ccx, ccy + 4);
    }
    animate();
  }

  document.querySelectorAll('.map-ctrl-btn').forEach(btn => btn.addEventListener('click', () => btn.classList.toggle('active')));
  initGravityMap();
}

function initMatch() {
  loadStateFromStorage();
  initThemeToggle();

  const activeMatchJson = localStorage.getItem(STORAGE_KEYS.ACTIVE_MATCH);
  const activeMatch = activeMatchJson ? JSON.parse(activeMatchJson) : null;
  if (!activeMatch) {
    window.location.href = '/matches';
    return;
  }

  const detailProfile = document.getElementById('detail-profile-card');
  const color = activeMatch.matchScore > 80 ? 'var(--accent)' : activeMatch.matchScore > 60 ? 'var(--accent-2)' : 'var(--warning)';
  detailProfile.innerHTML = `
    <div class="detail-avatar">${activeMatch.emoji || '👤'}</div>
    <div style="flex:1">
      <div style="font-family:monospace;color:var(--text-muted);font-size:0.85rem;">${activeMatch.id}</div>
      <div style="font-size:0.9rem;">${activeMatch.traits || ''}</div>
    </div>
    <div class="detail-score-ring">
      <svg width="60" height="60" viewBox="0 0 60 60" style="transform:rotate(-90deg)">
        <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="4"/>
        <circle cx="30" cy="30" r="26" fill="none" stroke="${color}" stroke-width="4" stroke-dasharray="163" stroke-dashoffset="${163 - (163 * (activeMatch.matchScore || 0) / 100)}"/>
      </svg>
      <div class="detail-score-text" style="color:${color}">${Math.round(activeMatch.matchScore || 0)}%</div>
    </div>
  `;

  document.getElementById('regen-plan-btn').addEventListener('click', () => {
    const places = ['Golden Gate Park', 'Dolores Park', 'Local Bookshop', 'Boba Guys', 'Art Museum'];
    const times = ['Sunday morning', 'Friday evening', 'Saturday afternoon', 'Thursday 6 PM'];
    const acts = ['Coffee walk', 'Gallery hopping', 'Deep discussion over drinks', 'Light competitive gaming'];
    document.getElementById('plan-location').textContent = places[Math.floor(Math.random() * places.length)];
    document.getElementById('plan-time').textContent = times[Math.floor(Math.random() * times.length)];
    document.getElementById('plan-activity').textContent = acts[Math.floor(Math.random() * acts.length)];
  });

  document.getElementById('send-invite-btn').addEventListener('click', () => {
    const conn = { user: activeMatch, messages: [], unread: true };
    state.connections.push(conn);
    setTimeout(() => {
      conn.messages.push({ from: 'them', text: "Hey! I saw we matched. Would love to chat 👋", time: new Date() });
      conn.unread = true;
      saveStateToStorage();
    }, 1500);
    saveStateToStorage();
    showToast("Connection request sent!");
    window.location.href = '/inbox';
  });
}

function initInbox() {
  loadStateFromStorage();
  initThemeToggle();

  const connList = document.getElementById('inbox-connections-list');
  const pendList = document.getElementById('inbox-pending-list');
  const empty = document.getElementById('inbox-empty');

  document.getElementById('count-connections').textContent = state.connections.length;
  document.getElementById('count-pending').textContent = state.pending.length;

  const badge = document.getElementById('nav-badge');
  if (badge) {
    const total = state.connections.filter(c => c.unread).length + state.pending.length;
    badge.textContent = total;
    badge.classList.toggle('visible', total > 0);
  }

  connList.innerHTML = '';
  if (state.connections.length === 0) {
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    state.connections.forEach(conn => {
      const lastMsg = conn.messages?.[conn.messages.length - 1];
      const row = document.createElement('div');
      row.className = 'conn-row';
      row.innerHTML = `
        <div class="conn-avatar">${conn.user?.emoji || '👤'}</div>
        <div class="conn-info">
          <div class="conn-id">${conn.user?.id || ''}</div>
          <div class="conn-preview ${conn.unread ? 'unread' : ''}">${lastMsg?.text || 'Say hello 👋'}</div>
        </div>
        <div class="conn-meta">
          <span class="conn-time">${lastMsg ? formatTime(lastMsg.time) : ''}</span>
          ${conn.unread ? '<div class="conn-unread-dot"></div>' : ''}
        </div>
      `;
      row.addEventListener('click', () => {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_MATCH, JSON.stringify(conn));
        window.location.href = '/chat';
      });
      connList.appendChild(row);
    });
  }

  pendList.innerHTML = '';
  state.pending.forEach((req, idx) => {
    const card = document.createElement('div');
    card.className = 'pending-card';
    card.innerHTML = `
      <div class="pending-top">
        <div class="conn-avatar">${req.from?.emoji || '👤'}</div>
        <div class="pending-info">
          <div class="pending-id">${req.from?.id || ''}</div>
          <div class="pending-score">⚡ ${req.matchScore || 0}% match</div>
        </div>
      </div>
      <div class="pending-msg">"${req.note || ''}"</div>
      <div class="pending-actions">
        <button class="btn-accept" data-idx="${idx}">✓ Accept</button>
        <button class="btn-decline" data-idx="${idx}">✕ Decline</button>
      </div>
    `;
    card.querySelector('.btn-accept').addEventListener('click', () => {
      const r = state.pending.splice(idx, 1)[0];
      state.connections.push({ user: r.from, messages: [{ from: 'them', text: r.note, time: new Date() }], unread: true });
      saveStateToStorage();
      showToast('Connected!');
      window.location.reload();
    });
    card.querySelector('.btn-decline').addEventListener('click', () => {
      state.pending.splice(idx, 1);
      saveStateToStorage();
      showToast('Declined.');
      window.location.reload();
    });
    pendList.appendChild(card);
  });
}

function initChat() {
  loadStateFromStorage();
  initThemeToggle();

  const connJson = localStorage.getItem(STORAGE_KEYS.ACTIVE_MATCH);
  const activeChat = connJson ? JSON.parse(connJson) : null;
  if (!activeChat?.user) {
    window.location.href = '/inbox';
    return;
  }

  document.getElementById('chat-avatar').textContent = activeChat.user?.emoji || '👤';
  document.getElementById('chat-name').textContent = activeChat.user?.id || '';

  const container = document.getElementById('chat-messages');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');

  function renderMessages() {
    container.innerHTML = '';
    (activeChat.messages || []).forEach(msg => {
      const b = document.createElement('div');
      b.className = `chat-msg ${msg.from === 'me' ? 'me' : 'them'}`;
      b.innerHTML = `${msg.text}<span class="chat-msg-time">${formatTime(msg.time)}</span>`;
      container.appendChild(b);
    });
    if (activeChat.messages?.length === 0) {
      const p = document.createElement('div');
      p.className = 'chat-date-divider';
      p.textContent = 'Start the conversation!';
      container.appendChild(p);
    }
    container.scrollTop = container.scrollHeight;
  }

  const autoReplies = ["That's really interesting!", "Haha agreed 😄", "Tell me more!", "We should definitely meet up!"];
  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    activeChat.messages = activeChat.messages || [];
    activeChat.messages.push({ from: 'me', text, time: new Date() });
    input.value = '';
    sendBtn.disabled = true;
    const idx = state.connections.findIndex(c => c.user?.id === activeChat.user?.id);
    if (idx >= 0) state.connections[idx] = activeChat;
    saveStateToStorage();
    renderMessages();
    setTimeout(() => {
      activeChat.messages.push({ from: 'them', text: autoReplies[Math.floor(Math.random() * autoReplies.length)], time: new Date() });
      if (idx >= 0) state.connections[idx] = activeChat;
      saveStateToStorage();
      renderMessages();
    }, 1500 + Math.random() * 1000);
  }

  renderMessages();
  input.addEventListener('input', () => { sendBtn.disabled = !input.value.trim(); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
  sendBtn.addEventListener('click', sendMessage);
}

function initReport() {
  loadStateFromStorage();
  initThemeToggle();

  const targetCard = document.getElementById('report-target-card');
  const reasonsDiv = document.getElementById('report-reasons');
  const activeMatchJson = localStorage.getItem(STORAGE_KEYS.ACTIVE_MATCH);
  const target = activeMatchJson ? JSON.parse(activeMatchJson) : null;

  const u = target?.user || target;
  if (u) {
    targetCard.innerHTML = `
      <div class="conn-avatar">${u.emoji || '👤'}</div>
      <div class="conn-id">${u.id || ''}</div>
    `;
  }

  ['Harassment', 'Spam', 'Inappropriate content', 'Other'].forEach(r => {
    const btn = document.createElement('button');
    btn.className = 'report-reason';
    btn.textContent = r;
    btn.addEventListener('click', () => {
      reasonsDiv.querySelectorAll('.report-reason').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    reasonsDiv.appendChild(btn);
  });

  document.getElementById('submit-report-btn').addEventListener('click', () => {
    const desc = document.getElementById('report-description').value;
    if (!desc) { showToast('Please provide a description.'); return; }
    showToast('Report submitted. Your identity remains hidden.');
    window.location.href = '/matches';
  });
}

function initThemeToggle() {
  const t = document.getElementById('theme-toggle');
  if (t) {
    t.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      t.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
    });
  }
}

function initParticleBackground() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();
  const particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 2, alpha: Math.random() * 0.4,
  }));
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// --- Boot: detect page and run init ---
(function () {
  const page = document.body?.getAttribute('data-page') || 'landing';
  const inits = {
    landing: initLanding,
    quiz: initQuiz,
    profile: initProfile,
    matches: initMatches,
    map: initMap,
    match: initMatch,
    inbox: initInbox,
    chat: initChat,
    report: initReport,
  };
  const init = inits[page] || initLanding;
  init();
})();
