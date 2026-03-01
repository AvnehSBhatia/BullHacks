/* Emo — Emotional compatibility frontend logic */

const API_BASE = window.location.origin;
const STORAGE = {
  USER_ID: 'emo_user_id',
  VECTOR: 'emo_vector',
  QUESTIONS: 'emo_questions',
  ANSWERS: 'emo_answers',
  MATCHES: 'emo_matches',
};

// --- Landing ---
document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('landing')) initLanding();
  else if (document.body.classList.contains('quiz')) initQuiz();
  else if (document.body.classList.contains('matches')) initMatches();
});

function initLanding() {
  const el = document.getElementById('stat-profiles');
  if (el) {
    fetch(`${API_BASE}/api/health`)
      .then(r => r.json())
      .then(d => { el.textContent = d.db_size ?? 0; })
      .catch(() => { el.textContent = '0'; });
  }
}

// --- Quiz ---
async function initQuiz() {
  const qText = document.getElementById('q-text');
  const qAnswer = document.getElementById('q-answer');
  const qNum = document.getElementById('q-num');
  const progressFill = document.getElementById('progress-fill');
  const btnNext = document.getElementById('btn-next');
  const btnBack = document.getElementById('btn-back');

  let questions = [];
  let answers = new Array(5).fill('');

  try {
    const res = await fetch(`${API_BASE}/api/questions`);
    const data = await res.json();
    if (!data.questions || data.questions.length !== 5) throw new Error('Invalid questions');
    questions = data.questions;
  } catch (e) {
    qText.textContent = 'Could not load questions. Is the server running on port 5031?';
    return;
  }

  let index = 0;

  function render() {
    qNum.textContent = `Question ${index + 1}`;
    progressFill.style.width = `${((index + 1) / 5) * 100}%`;
    qText.textContent = questions[index];
    qAnswer.value = answers[index] || '';
    qAnswer.placeholder = 'Write your answer…';
    btnNext.disabled = (answers[index] || '').trim().length < 3;
    btnBack.style.visibility = index > 0 ? 'visible' : 'hidden';
  }

  qAnswer.addEventListener('input', () => {
    answers[index] = qAnswer.value;
    btnNext.disabled = (qAnswer.value || '').trim().length < 3;
  });

  btnBack.addEventListener('click', () => {
    if (index > 0) {
      index--;
      render();
    }
  });

  btnNext.addEventListener('click', async () => {
    answers[index] = qAnswer.value;
    if (index < 4) {
      index++;
      render();
    } else {
      await finishQuiz(questions, answers);
    }
  });

  render();
  qAnswer.focus();
}

async function finishQuiz(questions, answers) {
  const btnNext = document.getElementById('btn-next');
  const raw = answers.map(a => (a && a.trim()) || "I'm not sure.");
  btnNext.disabled = true;
  btnNext.textContent = 'Finding matches…';

  try {
    const embedRes = await fetch(`${API_BASE}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions, answers: raw }),
    });
    const embedData = await embedRes.json();
    if (!embedRes.ok) throw new Error(embedData.error || 'Embed failed');

    const matchRes = await fetch(`${API_BASE}/api/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector: embedData.vector,
        city: '',
        questions,
        answers: raw,
      }),
    });
    const matchData = await matchRes.json();
    if (!matchRes.ok) throw new Error(matchData.error || 'Match failed');

    localStorage.setItem(STORAGE.USER_ID, matchData.user_id);
    localStorage.setItem(STORAGE.VECTOR, JSON.stringify(embedData.vector));
    localStorage.setItem(STORAGE.QUESTIONS, JSON.stringify(questions));
    localStorage.setItem(STORAGE.ANSWERS, JSON.stringify(raw));
    localStorage.setItem(STORAGE.MATCHES, JSON.stringify(matchData.matches || []));
    window.location.href = '/matches';
  } catch (e) {
    alert(e.message || 'Something went wrong. Is the server running?');
    btnNext.disabled = false;
    btnNext.textContent = 'Find matches →';
  }
}

// --- Matches ---
function initMatches() {
  const list = document.getElementById('matches-list');
  const userId = localStorage.getItem(STORAGE.USER_ID);
  let matches = [];
  try {
    matches = JSON.parse(localStorage.getItem(STORAGE.MATCHES) || '[]');
  } catch (_) {}

  if (!userId) {
    list.innerHTML = '<p class="matches-empty">No profile found. <a href="/quiz" style="color:var(--emo-accent)">Take the check-in</a> first.</p>';
    return;
  }

  if (matches.length === 0) {
    fetch(`${API_BASE}/api/matches?user_id=${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then(data => {
        if (data.matches) {
          localStorage.setItem(STORAGE.MATCHES, JSON.stringify(data.matches));
          renderMatches(list, data.matches);
        } else {
          renderMatches(list, []);
        }
      })
      .catch(() => renderMatches(list, []));
  } else {
    renderMatches(list, matches);
  }
}

function renderMatches(container, matches) {
  if (!matches.length) {
    container.innerHTML = '<p class="matches-empty">No matches yet. <a href="/quiz" style="color:var(--emo-accent)">Take the check-in</a> to be added to the pool, or run /api/seed-fake to add demo profiles.</p>';
    return;
  }
  container.innerHTML = matches.map(m => `
    <div class="match-card">
      <span class="match-emoji">${m.emoji || '💜'}</span>
      <div class="match-info">
        <div class="match-id">${m.id}</div>
        <div class="match-score">${m.matchScore ?? m.similarityScore ?? 0}% match</div>
        <div class="match-traits">${m.traits || 'Emotional compatibility'}</div>
      </div>
    </div>
  `).join('');
}
