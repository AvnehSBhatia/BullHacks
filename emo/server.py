"""Emo backend: emotional compatibility matching — 5-question check-in, cycling between question sets."""

import json
import os
import random
import sqlite3
import string
import sys
import threading

import numpy as np
import torch
import torch.nn.functional as F

_here = os.path.dirname(os.path.abspath(__file__))
_parent = os.path.dirname(_here)
if _parent not in sys.path:
    sys.path.insert(0, _parent)
sys.path.insert(0, _here)
os.chdir(_here)

from flask import Flask, jsonify, request, send_from_directory

from response_modify import vectorize_5qa
from compression_model_5xn import CompressionModel5xn
from train import load_checkpoint, get_device

app = Flask(__name__, static_folder=".", static_url_path="")

# CORS for frontend
@app.after_request
def _cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return resp

_model = None
_device = None
_db_path = os.path.join(_here, "emo.db")
_question_sets = []
_question_cycle_index = 0
_cycle_lock = threading.Lock()


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


def _load_questions():
    global _question_sets
    path = os.path.join(_here, "emotional_questions.json")
    with open(path) as f:
        data = json.load(f)
        _question_sets = data.get("question_sets", [])


def _load_models():
    global _model, _device
    _device = get_device()
    model_path = os.path.join(_here, "compression_model_emo.pt")
    if os.path.exists(model_path):
        _model, _ = load_checkpoint(path=model_path, device=_device)
        _model.eval()
    else:
        # Fallback: use randomly initialized model (works without training)
        _model = CompressionModel5xn(n=384).to(_device)
        _model.eval()
        print("No trained model found — using untrained weights. Run train.py to improve matches.")


def _embed(questions: list[str], answers: list[str]) -> list[float]:
    """Compute 64-dim embedding from 5 Q/A pairs."""
    if len(questions) != 5 or len(answers) != 5:
        raise ValueError("Need exactly 5 questions and 5 answers")
    Q, A = vectorize_5qa(questions, answers)
    Q_t = torch.tensor(Q, dtype=torch.float32, device=_device).unsqueeze(0)
    A_t = torch.tensor(A, dtype=torch.float32, device=_device).unsqueeze(0)
    with torch.no_grad():
        v = _model(Q_t, A_t)
        v = F.normalize(v, dim=-1)
        return v.cpu().numpy().flatten().tolist()


def _cosine_sim(vec_a: list[float], vec_b: list[float]) -> float:
    a = np.array(vec_a, dtype=np.float32)
    b = np.array(vec_b, dtype=np.float32)
    return float(np.dot(a, b))


def _similarity_to_pct(sim: float) -> float:
    return ((sim + 1) / 2) * 100


def _generate_user_id() -> str:
    return "EMO-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def _load_users_from_db(exclude_id: str = None) -> list[dict]:
    conn = get_db()
    cur = conn.execute("SELECT id, vector, city FROM users")
    rows = cur.fetchall()
    conn.close()
    users = []
    for row in rows:
        if exclude_id and row["id"] == exclude_id:
            continue
        users.append({
            "id": row["id"],
            "vector": json.loads(row["vector"]),
            "city": row["city"] or "",
            "distance": round(random.uniform(0.5, 12), 1),
        })
    return users


# --- Routes ---

@app.route("/")
def index():
    return send_from_directory(_here, "index.html")


@app.route("/quiz")
def quiz():
    return send_from_directory(_here, "quiz.html")


@app.route("/matches")
def matches_page():
    return send_from_directory(_here, "matches.html")


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(_here, path)


@app.route("/api/health")
def health():
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    conn.close()
    return jsonify({"ok": True, "db_size": count})


@app.route("/api/questions", methods=["GET"])
def get_questions():
    """
    Returns 5 emotional check-in questions.
    Cycles between different question sets on each request.
    """
    global _question_cycle_index
    if not _question_sets:
        return jsonify({"error": "No question sets loaded"}), 500
    with _cycle_lock:
        idx = _question_cycle_index % len(_question_sets)
        _question_cycle_index += 1
    questions = _question_sets[idx]
    return jsonify({
        "questions": questions,
        "set_index": idx,
    })


@app.route("/api/embed", methods=["POST"])
def embed():
    """Compute 64-dim embedding from 5 Q/A. Body: { questions, answers }."""
    data = request.get_json()
    if not data or "questions" not in data or "answers" not in data:
        return jsonify({"error": "questions and answers required"}), 400
    questions = data["questions"]
    answers = data["answers"]
    if len(questions) != 5 or len(answers) != 5:
        return jsonify({"error": "need exactly 5 questions and 5 answers"}), 400
    try:
        vec = _embed(questions, answers)
        return jsonify({"vector": vec})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/matches", methods=["GET"])
def get_matches():
    """Returns emotional compatibility matches. Query: user_id=EMO-XXXXXX"""
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id required"}), 400
    conn = get_db()
    row = conn.execute("SELECT vector FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "user not found"}), 404
    user_vec = json.loads(row["vector"])
    db_users = _load_users_from_db(exclude_id=user_id)
    results = []
    for u in db_users:
        raw_sim = _cosine_sim(user_vec, u["vector"])
        pct = _similarity_to_pct(raw_sim)
        dist_penalty = min(10, u["distance"] * 0.5)
        match_score = max(0, min(100, pct - dist_penalty))
        results.append({
            "id": u["id"],
            "emoji": "💜",
            "matchScore": round(match_score, 1),
            "similarityScore": round(pct, 1),
            "distance": u["distance"],
            "traits": f"Emotional compatibility",
        })
    results.sort(key=lambda x: -x["matchScore"])
    return jsonify({"matches": results})


@app.route("/api/matches", methods=["POST"])
def matches():
    """Register user and return matches. Body: { vector, city?, user_id?, questions?, answers? }"""
    data = request.get_json()
    if not data or "vector" not in data:
        return jsonify({"error": "vector required"}), 400
    user_vec = data["vector"]
    city = data.get("city", "")
    user_id = data.get("user_id")
    questions = data.get("questions")
    answers = data.get("answers")

    conn = get_db()
    if user_id:
        conn.execute(
            "UPDATE users SET vector=?, city=? WHERE id=?",
            (json.dumps(user_vec), city, user_id),
        )
    else:
        user_id = _generate_user_id()
        conn.execute(
            "INSERT INTO users (id, vector, city) VALUES (?, ?, ?)",
            (user_id, json.dumps(user_vec), city),
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
        dist_penalty = min(10, u["distance"] * 0.5)
        match_score = max(0, min(100, pct - dist_penalty))
        results.append({
            "id": u["id"],
            "emoji": "💜",
            "matchScore": round(match_score, 1),
            "similarityScore": round(pct, 1),
            "distance": u["distance"],
            "traits": "Emotional compatibility",
        })
    results.sort(key=lambda x: -x["matchScore"])
    return jsonify({"user_id": user_id, "matches": results})


@app.route("/api/seed-fake", methods=["GET", "POST"])
def seed_fake():
    """Seed fake profiles for demo. Query: n=10 (default)."""
    n = request.args.get("n", 10, type=int)
    n = max(0, min(50, n))
    data_path = os.path.join(_here, "emotional_answers.json")
    if not os.path.exists(data_path):
        return jsonify({"ok": False, "error": "emotional_answers.json not found"}), 500
    with open(data_path) as f:
        data = json.load(f)
    sets = data.get("question_sets", [])
    responses = data.get("responses", [])
    if not sets or not responses:
        return jsonify({"ok": False, "error": "No question sets or responses"}), 500
    rng = random.Random(42)
    conn = get_db()
    added = 0
    try:
        for i in range(n):
            q_set = rng.choice(sets)[:5]
            resp = rng.choice(responses)
            ans = (resp.get("answers", []) + ["I'm not sure."] * 5)[:5]
            vec = _embed(q_set, ans)
            bot_id = f"EMO-BOT-{i:03d}-" + "".join(rng.choices(string.ascii_uppercase + string.digits, k=4))
            conn.execute("INSERT INTO users (id, vector, city) VALUES (?, ?, ?)",
                         (bot_id, json.dumps(vec), ""))
            conn.execute("INSERT INTO responses (user_id, questions, answers) VALUES (?, ?, ?)",
                         (bot_id, json.dumps(q_set), json.dumps(ans)))
            added += 1
        conn.commit()
    finally:
        conn.close()
    return jsonify({"ok": True, "added": added})


if __name__ == "__main__":
    print("Loading emo compression model...")
    _load_models()
    print("Loading question sets...")
    _load_questions()
    print("Initializing database...")
    init_db()
    port = int(os.environ.get("PORT", 5031))
    print(f"Emo ready. Open http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)
