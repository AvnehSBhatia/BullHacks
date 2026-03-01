"""Depolarizer backend: political compatibility matching — connect people who think alike but identify differently."""

import json
import os
import random
import sqlite3
import string
import sys

import numpy as np
import torch
import torch.nn.functional as F

_here = os.path.dirname(os.path.abspath(__file__))
_parent = os.path.dirname(_here)
if _parent not in sys.path:
    sys.path.insert(0, _parent)
os.chdir(_here)

from flask import Flask, jsonify, redirect, request, send_from_directory

UI_BASE = os.environ.get("DEPOLARIZER_UI", "http://localhost:3000")

# Depolarizer uses its own response_modify and train_political (run from depolarizer/)
sys.path.insert(0, _here)
from response_modify import to_matrix
from train_political import load_checkpoint, get_device

app = Flask(__name__, static_folder=".", static_url_path="")

# CORS for Bridge UI (Next.js on port 3000)
@app.after_request
def _cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return resp

SIMILARITY_THRESHOLD = 75.0  # Must be >= 75% similar to match
POLITICAL_STANCES = [
    "far-left",
    "left-leaning",
    "moderate-left",
    "centrist",
    "moderate-right",
    "right-leaning",
    "far-right",
    # Backward compatibility with older saved values
    "progressive",
    "conservative",
    "moderate",
]
STANCE_ERROR_MSG = f"political_stance required ({', '.join(POLITICAL_STANCES[:7])})"

GLOBAL_QUESTIONS = [
    "Do you believe the government should take an active role in solving social problems, or should individuals and private organizations handle them?",
    "Which is more important to you: economic growth even if it increases inequality, or reducing inequality even if it slows growth?",
    "Should society prioritize preserving traditional values or adapting to changing social norms?",
    "How urgent is it for governments to take strong action against climate change?",
    "Do you think a country should focus more on global cooperation or prioritize national interests?",
]

Q11_POLITICAL_STANCE = {
    "question": "How would you describe your overall political stance?",
    "options": [
        {"id": "far-left", "label": "Far-left"},
        {"id": "left-leaning", "label": "Left-leaning"},
        {"id": "moderate-left", "label": "Moderate-left"},
        {"id": "centrist", "label": "Centrist"},
        {"id": "moderate-right", "label": "Moderate-right"},
        {"id": "right-leaning", "label": "Right-leaning"},
        {"id": "far-right", "label": "Far-right"},
    ],
}

_model = None
_device = None
_db_path = os.path.join(_here, "depolarizer.db")
_niche_pool = []


def get_db():
    conn = sqlite3.connect(_db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            vector TEXT NOT NULL,
            political_stance TEXT NOT NULL,
            city TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            questions TEXT NOT NULL,
            answers TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)
    conn.commit()
    conn.close()


def _load_niche_pool():
    global _niche_pool
    path = os.path.join(_parent, "niche_political_questions.json")
    if os.path.exists(path):
        with open(path) as f:
            data = json.load(f)
            _niche_pool = data.get("qa_pairs", [])
    else:
        _niche_pool = []


def _load_models():
    global _model, _device
    _device = get_device()
    # Check depolarizer/ first, then project root
    model_path = os.path.join(_here, "political_compression_model.pt")
    if not os.path.exists(model_path):
        model_path = os.path.join(_parent, "political_compression_model.pt")
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model not found: {model_path}. Run python depolarizer/train_political.py first."
        )
    _model, _ = load_checkpoint(path=model_path, device=_device)
    _model.eval()


def _embed(questions: list[str], answers: list[str]) -> list[float]:
    """Compute political compatibility embedding from 10 Q/A."""
    if len(questions) != 10 or len(answers) != 10:
        raise ValueError("Need exactly 10 questions and 10 answers")
    embeddings = to_matrix(questions + answers)
    n = 10
    Q = torch.tensor(embeddings[:n], dtype=torch.float32, device=_device).unsqueeze(0)
    A = torch.tensor(embeddings[n : 2 * n], dtype=torch.float32, device=_device).unsqueeze(0)
    with torch.no_grad():
        v = _model(Q, A)
        v = F.normalize(v, dim=-1)
        return v.cpu().numpy().flatten().tolist()


def _cosine_sim(vec_a: list[float], vec_b: list[float]) -> float:
    a = np.array(vec_a, dtype=np.float32)
    b = np.array(vec_b, dtype=np.float32)
    return float(np.dot(a, b))


def _similarity_to_pct(sim: float) -> float:
    return ((sim + 1) / 2) * 100


def _stances_differ(s1: str, s2: str) -> bool:
    """True if two users have meaningfully different political stances."""
    if not s1 or not s2:
        return False
    return s1.lower() != s2.lower()


def _generate_user_id() -> str:
    return "DP-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def _load_users_from_db(exclude_id: str = None) -> list[dict]:
    conn = get_db()
    cur = conn.execute(
        "SELECT id, vector, political_stance, city FROM users"
    )
    rows = cur.fetchall()
    conn.close()

    users = []
    for row in rows:
        if exclude_id and row["id"] == exclude_id:
            continue
        vec = json.loads(row["vector"])
        users.append({
            "id": row["id"],
            "vector": vec,
            "political_stance": row["political_stance"] or "moderate",
            "distance": round(random.uniform(0.5, 12), 1),
            "emoji": "🔵" if (row["political_stance"] or "").lower() in {"far-left", "left-leaning", "moderate-left", "left", "center-left", "progressive"} else ("🔴" if (row["political_stance"] or "").lower() in {"moderate-right", "right-leaning", "far-right", "right", "center-right", "conservative"} else "🟣"),
        })
    return users


# --- Routes ---

# Redirect web routes to depolarizer-ui (Next.js) — API stays here
@app.route("/")
def index():
    return redirect(f"{UI_BASE}/", 302)


@app.route("/quiz")
def quiz():
    return redirect(f"{UI_BASE}/onboarding", 302)


@app.route("/profile")
def profile():
    return redirect(f"{UI_BASE}/profile", 302)


@app.route("/matches")
def matches_page():
    return redirect(f"{UI_BASE}/matches", 302)


@app.route("/match")
def match_detail_page():
    id_arg = request.args.get("id")
    if id_arg:
        return redirect(f"{UI_BASE}/match/{id_arg}", 302)
    return redirect(f"{UI_BASE}/matches", 302)


@app.route("/api/health")
def health():
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    conn.close()
    return jsonify({"ok": True, "db_size": count})


@app.route("/api/questions", methods=["GET"])
def get_questions():
    """Returns 5 global + 5 random niche political questions + Q11 political stance MCQ."""
    if len(_niche_pool) < 5:
        niche_sample = _niche_pool
    else:
        niche_sample = random.sample(_niche_pool, 5)
    niche_questions = [qa["question"] for qa in niche_sample]
    questions = GLOBAL_QUESTIONS + niche_questions
    return jsonify({
        "questions": questions,
        "q11": Q11_POLITICAL_STANCE,
    })


@app.route("/api/embed", methods=["POST"])
def embed():
    """
    Compute embedding from 10 political Q/A.
    Body: { questions, answers }
    Returns { vector }
    """
    data = request.get_json()
    if not data or "questions" not in data or "answers" not in data:
        return jsonify({"error": "questions and answers required"}), 400
    questions = data["questions"]
    answers = data["answers"]
    if len(questions) != 10 or len(answers) != 10:
        return jsonify({"error": "need exactly 10 questions and 10 answers"}), 400
    try:
        vec = _embed(questions, answers)
        return jsonify({"vector": vec})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/matches", methods=["GET"])
def get_matches():
    """Returns depolarizer matches for existing user with optional similarity filters."""
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id required"}), 400
    min_similarity = request.args.get("min_similarity", type=float)
    max_similarity = request.args.get("max_similarity", type=float)
    include_same_stance = (request.args.get("include_same_stance", "false") or "").lower() in {"1", "true", "yes"}
    if min_similarity is None:
        min_similarity = SIMILARITY_THRESHOLD
    conn = get_db()
    row = conn.execute(
        "SELECT vector, political_stance FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "user not found"}), 404
    user_vec = json.loads(row["vector"])
    user_stance = row["political_stance"] or "moderate"

    db_users = _load_users_from_db(exclude_id=user_id)
    results = []
    for u in db_users:
        raw_sim = _cosine_sim(user_vec, u["vector"])
        pct = _similarity_to_pct(raw_sim)
        if min_similarity is not None and pct < min_similarity:
            continue
        if max_similarity is not None and pct >= max_similarity:
            continue
        if not include_same_stance and not _stances_differ(user_stance, u["political_stance"]):
            continue
        dist_penalty = min(10, u["distance"] * 0.5)
        if min_similarity >= SIMILARITY_THRESHOLD and max_similarity is None:
            match_score = max(SIMILARITY_THRESHOLD, min(100, pct - dist_penalty))
        else:
            match_score = max(0, min(100, pct - dist_penalty))
        results.append({
            "id": u["id"],
            "emoji": u["emoji"],
            "matchScore": round(match_score, 1),
            "similarityScore": round(pct, 1),
            "politicalStance": u["political_stance"],
            "distance": u["distance"],
            "traits": f"Political stance: {u['political_stance'].title()}",
        })
    results.sort(key=lambda x: -x["matchScore"])
    return jsonify({"matches": results})


@app.route("/api/matches", methods=["POST"])
def matches():
    """
    Register user and return depolarizer matches.
    Body: { vector, political_stance, city, user_id?, questions?, answers? }
    Matches: >= 75% similar AND differing political stance.
    """
    data = request.get_json()
    if not data or "vector" not in data:
        return jsonify({"error": "vector required"}), 400
    if "political_stance" not in data or data["political_stance"] not in POLITICAL_STANCES:
        return jsonify({"error": STANCE_ERROR_MSG}), 400

    user_vec = data["vector"]
    political_stance = data["political_stance"].lower()
    city = data.get("city", "")
    user_id = data.get("user_id")
    questions = data.get("questions")
    answers = data.get("answers")

    conn = get_db()

    if user_id:
        conn.execute(
            "UPDATE users SET vector=?, political_stance=?, city=? WHERE id=?",
            (json.dumps(user_vec), political_stance, city, user_id),
        )
    else:
        user_id = _generate_user_id()
        conn.execute(
            "INSERT INTO users (id, vector, political_stance, city) VALUES (?, ?, ?, ?)",
            (user_id, json.dumps(user_vec), political_stance, city),
        )

    if questions and answers:
        conn.execute(
            "INSERT INTO responses (user_id, questions, answers) VALUES (?, ?, ?)",
            (user_id, json.dumps(questions), json.dumps(answers)),
        )

    conn.commit()
    conn.close()

    db_users = _load_users_from_db(exclude_id=user_id)
    results = []
    for u in db_users:
        raw_sim = _cosine_sim(user_vec, u["vector"])
        pct = _similarity_to_pct(raw_sim)
        if pct < SIMILARITY_THRESHOLD:
            continue
        if not _stances_differ(political_stance, u["political_stance"]):
            continue
        dist_penalty = min(10, u["distance"] * 0.5)
        match_score = max(SIMILARITY_THRESHOLD, min(100, pct - dist_penalty))
        results.append({
            "id": u["id"],
            "emoji": u["emoji"],
            "matchScore": round(match_score, 1),
            "similarityScore": round(pct, 1),
            "politicalStance": u["political_stance"],
            "distance": u["distance"],
            "traits": f"Political stance: {u['political_stance'].title()}",
        })

    results.sort(key=lambda x: -x["matchScore"])
    return jsonify({"user_id": user_id, "matches": results})


if __name__ == "__main__":
    print("Loading political compression model...")
    _load_models()
    print("Loading niche political questions...")
    _load_niche_pool()
    print("Initializing database...")
    init_db()
    port = int(os.environ.get("PORT", 5042))
    print(f"Depolarizer ready. Open http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)
