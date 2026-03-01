/* ============================================================
   DEPOLARIZER — Frontend App Logic
   Matches users 75%+ similar with differing political stance.
   Q1–10: political text answers. Q11: political stance MCQ.
   ============================================================ */

const API_BASE = window.location.origin;

const STORAGE_KEYS = {
  USER_ID: 'depolarizer_user_id',
  VECTOR: 'depolarizer_vector',
  POLITICAL_STANCE: 'depolarizer_political_stance',
  CITY: 'depolarizer_city',
  QUIZ_QUESTIONS: 'depolarizer_quiz_questions',
  QUIZ_ANSWERS: 'depolarizer_quiz_answers',
  MATCHES: 'depolarizer_matches',
  ACTIVE_MATCH: 'depolarizer_active_match',
};

const state = {
  user: {
    id: '',
    vector: [],
    politicalStance: '',
    city: '',
  },
  quiz: {
    currentIndex: 0,
    answers: [],
    textAnswers: [],
    questions: [],
    q11: null,
  },
  db: [],
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
  state.user.politicalStance = localStorage.getItem(STORAGE_KEYS.POLITICAL_STANCE) || '';
  state.user.city = localStorage.getItem(STORAGE_KEYS.CITY) || '';
  const m = localStorage.getItem(STORAGE_KEYS.MATCHES);
  state.db = m ? JSON.parse(m) : [];
}

function saveStateToStorage() {
  if (state.user.id) localStorage.setItem(STORAGE_KEYS.USER_ID, state.user.id);
  if (state.user.vector?.length) localStorage.setItem(STORAGE_KEYS.VECTOR, JSON.stringify(state.user.vector));
  localStorage.setItem(STORAGE_KEYS.POLITICAL_STANCE, state.user.politicalStance);
  localStorage.setItem(STORAGE_KEYS.CITY, state.user.city);
  localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(state.db));
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

// --- Page inits ---

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
}

async function initQuiz() {
  loadStateFromStorage();
  initThemeToggle();

  const qCard = document.getElementById('question-card');
  const qCat = document.getElementById('q-category');
  const qText = document.getElementById('q-text');
  const qOptions = document.getElementById('q-options');
  const qMcqWrap = document.getElementById('q-mcq-wrap');
  const qMcqOptions = document.getElementById('q-mcq-options');
  const qTextareaWrap = document.getElementById('q-textarea-wrap');
  const qTextarea = document.getElementById('q-textarea');
  const btnQuizNext = document.getElementById('quiz-next-btn');
  const qNum = document.getElementById('quiz-q-num');
  const progFill = document.getElementById('progress-fill');
  const progLabel = document.getElementById('progress-section-label');

  state.quiz.currentIndex = 0;
  state.quiz.answers = new Array(11).fill(null);
  state.quiz.textAnswers = new Array(10).fill('');
  state.quiz.questions = [];
  state.quiz.q11 = null;

  try {
    const res = await fetch(`${API_BASE}/api/questions`);
    const data = await res.json();
    if (!data.questions || data.questions.length !== 10) throw new Error('Invalid questions');
    state.quiz.questions = data.questions.map((text, i) => ({
      id: i < 5 ? 'g' + (i + 1) : 'n' + (i - 4),
      type: 'text',
      category: i < 5 ? 'Core' : 'Niche',
      text,
    }));
    state.quiz.q11 = data.q11 || {
      question: 'How would you describe your overall political stance?',
      options: [
        { id: 'far-left', label: 'Far-left' },
        { id: 'left-leaning', label: 'Left-leaning' },
        { id: 'moderate-left', label: 'Moderate-left' },
        { id: 'centrist', label: 'Centrist' },
        { id: 'moderate-right', label: 'Moderate-right' },
        { id: 'right-leaning', label: 'Right-leaning' },
        { id: 'far-right', label: 'Far-right' },
      ],
    };
    // Add Q11 as virtual question
    state.quiz.questions.push({
      id: 'q11',
      type: 'mcq',
      category: 'Stance',
      text: state.quiz.q11.question,
      options: state.quiz.q11.options,
    });
  } catch (e) {
    console.error(e);
    showToast('Could not load questions. Is the server running?');
    window.location.href = '/';
    return;
  }

  function loadQuestion(index) {
    state.quiz.currentIndex = index;
    const q = state.quiz.questions[index];
    const isMcq = q.type === 'mcq';

    qNum.textContent = `Question ${index + 1}`;
    progFill.style.width = `${((index + 1) / 11) * 100}%`;
    progLabel.textContent = q.category;
    progLabel.style.color = q.category === 'Core' ? 'var(--accent)' : q.category === 'Stance' ? 'var(--accent-3)' : 'var(--accent-2)';

    qCat.textContent = q.category;
    qCat.style.color = q.category === 'Core' ? 'var(--accent)' : q.category === 'Stance' ? 'var(--accent-3)' : 'var(--accent-2)';
    qText.textContent = q.text;

    qOptions.innerHTML = '';
    qMcqWrap.classList.add('hidden');
    qTextareaWrap.classList.add('hidden');

    btnQuizNext.disabled = true;
    document.getElementById('quiz-next-label').textContent = index === 10 ? 'Build Profile →' : 'Next →';

    if (isMcq) {
      qMcqWrap.classList.remove('hidden');
      qMcqOptions.innerHTML = '';
      (q.options || []).forEach(opt => {
        const div = document.createElement('div');
        div.className = 'q-option' + (state.quiz.answers[10] === opt.id ? ' selected' : '');
        div.dataset.id = opt.id;
        div.innerHTML = `<div class="q-option-dot"></div><span>${opt.label}</span>`;
        div.addEventListener('click', () => {
          qMcqOptions.querySelectorAll('.q-option').forEach(o => o.classList.remove('selected'));
          div.classList.add('selected');
          state.quiz.answers[10] = opt.id;
          btnQuizNext.disabled = false;
        });
        qMcqOptions.appendChild(div);
      });
      if (state.quiz.answers[10]) btnQuizNext.disabled = false;
    } else {
      qTextareaWrap.classList.remove('hidden');
      qTextarea.value = state.quiz.textAnswers[index] || '';
      btnQuizNext.disabled = (qTextarea.value.trim().length || 0) < 3;
      qTextarea.oninput = () => {
        state.quiz.textAnswers[index] = qTextarea.value;
        btnQuizNext.disabled = qTextarea.value.trim().length < 3;
      };
      setTimeout(() => qTextarea.focus(), 100);
    }
  }

  async function finishQuiz() {
    const questions = state.quiz.questions.slice(0, 10).map(q => q.text);
    const answers = state.quiz.textAnswers.map(a => (a && a.trim()) || "I'm not sure.");
    const politicalStance = state.quiz.answers[10] || 'centrist';

    btnQuizNext.disabled = true;
    document.getElementById('quiz-next-label').textContent = 'Building profile...';

    try {
      const embedRes = await fetch(`${API_BASE}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, answers }),
      });
      const embedData = await embedRes.json();
      if (!embedRes.ok) throw new Error(embedData.error || 'Embed failed');

      state.user.vector = embedData.vector;
      state.user.politicalStance = politicalStance;
      localStorage.setItem(STORAGE_KEYS.VECTOR, JSON.stringify(embedData.vector));
      localStorage.setItem(STORAGE_KEYS.POLITICAL_STANCE, politicalStance);
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
    if (state.quiz.currentIndex < 10) loadQuestion(state.quiz.currentIndex + 1);
    else finishQuiz();
  });

  loadQuestion(0);
}

function initProfile() {
  loadStateFromStorage();
  initThemeToggle();

  const profileId = document.getElementById('profile-id');
  const stanceBadge = document.getElementById('profile-stance-badge');
  const cityInput = document.getElementById('city-input');
  const findMatchesBtn = document.getElementById('find-matches-btn');
  const geoBtn = document.getElementById('geo-btn');
  const copyBtn = document.getElementById('copy-id-btn');

  profileId.textContent = state.user.id || '(ID appears after finding matches)';
  cityInput.value = state.user.city;
  stanceBadge.textContent = state.user.politicalStance ? `Stance: ${state.user.politicalStance.charAt(0).toUpperCase() + state.user.politicalStance.slice(1)}` : '';
  stanceBadge.style.display = state.user.politicalStance ? 'inline-block' : 'none';

  document.getElementById('avatar-emoji').textContent = '⚖';

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
          political_stance: state.user.politicalStance,
          city: state.user.city,
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
  const matchesEmpty = document.getElementById('matches-empty');

  function fetchMatchesIfNeeded() {
    if (state.db.length > 0) {
      renderMatches();
      return;
    }
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
    if (state.db.length === 0) {
      matchesList.classList.add('hidden');
      if (matchesEmpty) {
        matchesEmpty.classList.remove('hidden');
      }
      return;
    }
    if (matchesEmpty) matchesEmpty.classList.add('hidden');
    matchesList.classList.remove('hidden');

    state.db.forEach((m) => {
      const color = m.matchScore >= 75 ? 'var(--accent)' : 'var(--warning)';
      const div = document.createElement('div');
      div.className = 'match-card';
      div.style.setProperty('--match-color', color);
      div.innerHTML = `
        <div class="match-avatar">${m.emoji || '👤'}</div>
        <div class="match-info">
          <div class="match-id">${m.id} <span class="stance-tag">${(m.politicalStance || '').charAt(0).toUpperCase() + (m.politicalStance || '').slice(1)}</span></div>
          <div class="match-traits">${m.traits || ''}</div>
        </div>
        <div class="match-right">
          <div class="match-score">${Math.round(m.matchScore)}%</div>
          <div class="match-dist">${(m.distance || 0).toFixed(1)}mi • ${(m.similarityScore || m.matchScore).toFixed(0)}% similar</div>
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
  const color = activeMatch.matchScore >= 75 ? 'var(--accent)' : 'var(--warning)';
  detailProfile.innerHTML = `
    <div class="detail-avatar">${activeMatch.emoji || '👤'}</div>
    <div style="flex:1">
      <div style="font-family:monospace;color:var(--text-muted);font-size:0.85rem;">${activeMatch.id}</div>
      <div style="font-size:0.9rem;margin-top:0.25rem;">${(activeMatch.politicalStance || '').charAt(0).toUpperCase() + (activeMatch.politicalStance || '').slice(1)} • ${activeMatch.traits || ''}</div>
    </div>
    <div class="detail-score-ring">
      <svg width="60" height="60" viewBox="0 0 60 60" style="transform:rotate(-90deg)">
        <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="4"/>
        <circle cx="30" cy="30" r="26" fill="none" stroke="${color}" stroke-width="4" stroke-dasharray="163" stroke-dashoffset="${163 - (163 * (activeMatch.matchScore || 0) / 100)}"/>
      </svg>
      <div class="detail-score-text" style="color:${color}">${Math.round(activeMatch.matchScore || 0)}%</div>
    </div>
  `;

  document.getElementById('send-invite-btn').addEventListener('click', () => {
    showToast('Connection request sent! Start the conversation.');
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

// Boot
(function () {
  const page = document.body?.getAttribute('data-page') || 'landing';
  const inits = {
    landing: initLanding,
    quiz: initQuiz,
    profile: initProfile,
    matches: initMatches,
    match: initMatch,
  };
  const init = inits[page] || initLanding;
  init();
})();
