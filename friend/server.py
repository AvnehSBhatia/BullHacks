"""Flask backend: serves frontend + API for embedding and matching."""

import json
import os
import random
import sqlite3
import string
import sys

import numpy as np
import torch
import torch.nn.functional as F

# Add parent dir so we can import from root (compression_model) when run from friend/
_here = os.path.dirname(os.path.abspath(__file__))
_parent = os.path.dirname(_here)
if _parent not in sys.path:
    sys.path.insert(0, _parent)
os.chdir(_here)

from flask import Flask, jsonify, request, send_from_directory

from gravity_map import GravityLayoutConfig, compute_gravity_layout
from response_modify import to_matrix
from train import load_checkpoint, get_device

app = Flask(__name__, static_folder=".", static_url_path="")

# Loaded at startup
_model = None
_device = None
_db_path = os.path.join(_here, "friend.db")
_niche_pool = []

_global_questions = [
    "What are your biggest motivations?",
    "What are your biggest weaknesses? Strengths?",
    "What activities do you do to handle stress or recharge?",
    "Do you think or act first?",
    "Do you work better alone or with a group?",
]


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
            interests TEXT NOT NULL DEFAULT '[]',
            standing INTEGER NOT NULL DEFAULT 87,
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
    path = os.path.join(_here, "niche_questions.json")
    if os.path.exists(path):
        with open(path) as f:
            data = json.load(f)
            _niche_pool = data.get("qa_pairs", [])
    else:
        _niche_pool = []


def _load_models():
    global _model, _device
    _device = get_device()
    model_path = os.path.join(_here, "compression_model.pt")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found: {model_path}. Run train.py first.")
    _model, _ = load_checkpoint(path=model_path, device=_device)
    _model.eval()


def _embed(questions: list[str], answers: list[str]) -> list[float]:
    """Compute 64-dim embedding for one user."""
    all_strings = questions + answers
    embeddings = to_matrix(all_strings)
    Q = torch.tensor(embeddings[:10], dtype=torch.float32, device=_device).unsqueeze(0)
    A = torch.tensor(embeddings[10:20], dtype=torch.float32, device=_device).unsqueeze(0)
    with torch.no_grad():
        v = _model(Q, A)
        v = F.normalize(v, dim=-1)
        return v.cpu().numpy().flatten().tolist()


def _cosine_sim(vec_a: list[float], vec_b: list[float]) -> float:
    a = np.array(vec_a, dtype=np.float32)
    b = np.array(vec_b, dtype=np.float32)
    return float(np.dot(a, b))


def _generate_user_id() -> str:
    return "USR-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def _load_users_from_db() -> list[dict]:
    conn = get_db()
    cur = conn.execute(
        "SELECT id, vector, city, interests, standing FROM users"
    )
    rows = cur.fetchall()
    conn.close()

    users = []
    for row in rows:
        vec = json.loads(row["vector"])
        interests = json.loads(row["interests"])
        users.append({
            "id": row["id"],
            "vector": vec,
            "distance": round(random.uniform(0.5, 15), 1),
            "standing": row["standing"],
            "traits": interests if isinstance(interests, list) else [],
            "emoji": "👤",
        })
    return users


# --- Routes ---

@app.route("/")
def index():
    return send_from_directory(_here, "index.html")


@app.route("/quiz")
def quiz():
    return send_from_directory(_here, "quiz.html")


@app.route("/profile")
def profile():
    return send_from_directory(_here, "profile.html")


@app.route("/matches")
def matches_page():
    return send_from_directory(_here, "matches.html")


@app.route("/map")
def map_page():
    return send_from_directory(_here, "map.html")


@app.route("/match")
def match_detail_page():
    return send_from_directory(_here, "match.html")


@app.route("/inbox")
def inbox_page():
    return send_from_directory(_here, "inbox.html")


@app.route("/chat")
def chat_page():
    return send_from_directory(_here, "chat.html")


@app.route("/report")
def report_page():
    return send_from_directory(_here, "report.html")


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(_here, path)


@app.route("/api/map-layout", methods=["POST"])
def map_layout():
    """
    Compute gravity layout using gravity_map.py.
    Body: { center_id, matches: [{ id, matchScore, standing }] }
    Returns: { positions: { id: [x, y] }, edges: [[id1, id2, weight], ...] }
    Positions are in layout units; frontend scales to canvas.
    """
    data = request.get_json()
    if not data or "center_id" not in data or "matches" not in data:
        return jsonify({"error": "center_id and matches required"}), 400
    center_id = data["center_id"]
    matches = data["matches"]

    nodes = [center_id] + [m["id"] for m in matches]
    edges = [(center_id, m["id"], max(0.1, float(m.get("matchScore", 50)))) for m in matches]

    if not edges:
        positions = {center_id: (0.0, 0.0)}
        for i, m in enumerate(matches):
            import math
            theta = 2 * math.pi * i / max(len(matches), 1)
            positions[m["id"]] = (math.cos(theta), math.sin(theta))
    else:
        config = GravityLayoutConfig(iterations=300, k_attract=1.0, k_repulse=0.08, max_radius=1.5)
        positions = compute_gravity_layout(nodes, edges, center_id, config=config)

    pos_dict = {str(k): [float(v[0]), float(v[1])] for k, v in positions.items()}
    edge_list = [[center_id, m["id"], float(m.get("matchScore", 50))] for m in matches]
    return jsonify({"positions": pos_dict, "edges": edge_list})


@app.route("/api/health")
def health():
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    conn.close()
    return jsonify({"ok": True, "db_size": count})


@app.route("/api/questions", methods=["GET"])
def get_questions():
    """Returns 5 global + 5 random niche questions for the quiz."""
    rng = random.Random()
    if len(_niche_pool) < 5:
        niche_sample = _niche_pool
    else:
        niche_sample = rng.sample(_niche_pool, 5)
    niche_questions = [qa["question"] for qa in niche_sample]
    questions = _global_questions + niche_questions
    return jsonify({"questions": questions})


@app.route("/api/embed", methods=["POST"])
def embed():
    """
    Compute 64-dim personality embedding from questions + answers.
    Optionally saves responses when save=true and user data (city, interests, standing) provided.
    Returns {vector} or {vector, user_id} if saved.
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
        result = {"vector": vec}

        # Optionally save user + responses
        if data.get("save") and data.get("city"):
            user_id = _generate_user_id()
            city = data.get("city", "")
            interests = data.get("interests", [])
            if isinstance(interests, str):
                interests = json.loads(interests) if interests else []
            standing = int(data.get("standing", 87))

            conn = get_db()
            conn.execute(
                "INSERT INTO users (id, vector, city, interests, standing) VALUES (?, ?, ?, ?, ?)",
                (user_id, json.dumps(vec), city, json.dumps(interests), standing),
            )
            conn.execute(
                "INSERT INTO responses (user_id, questions, answers) VALUES (?, ?, ?)",
                (user_id, json.dumps(questions), json.dumps(answers)),
            )
            conn.commit()
            conn.close()
            result["user_id"] = user_id

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/matches", methods=["GET"])
def get_matches():
    """Returns matches for existing user. Query: user_id=USR-XXXXXX"""
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id required"}), 400
    conn = get_db()
    row = conn.execute(
        "SELECT vector, city FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "user not found"}), 404
    user_vec = json.loads(row["vector"])
    db_users = [u for u in _load_users_from_db() if u["id"] != user_id]
    results = []
    for u in db_users:
        raw_sim = _cosine_sim(user_vec, u["vector"])
        score_pct = ((raw_sim + 1) / 2) * 100
        dist_penalty = u["distance"] * 1.5
        match_score = max(0, min(100, score_pct - dist_penalty))
        traits_str = u["traits"]
        if isinstance(traits_str, list):
            traits_str = " • ".join(traits_str)
        results.append({
            "id": u["id"],
            "emoji": u["emoji"],
            "matchScore": round(match_score, 1),
            "distance": u["distance"],
            "standing": u["standing"],
            "traits": traits_str,
        })
    results.sort(key=lambda x: -x["matchScore"])
    return jsonify({"matches": results})


@app.route("/api/matches", methods=["POST"])
def matches():
    """
    Registers user to DB (if not already) and returns matches.
    Body: {vector, city, interests?, standing?, user_id?, questions?, answers?}
    If user_id provided, updates existing user. Otherwise creates new user.
    If questions/answers provided, saves to responses table.
    """
    data = request.get_json()
    if not data or "vector" not in data:
        return jsonify({"error": "vector required"}), 400
    user_vec = data["vector"]
    city = data.get("city", "")
    interests = data.get("interests", [])
    if isinstance(interests, str):
        interests = json.loads(interests) if interests else []
    standing = int(data.get("standing", 87))
    user_id = data.get("user_id")
    questions = data.get("questions")
    answers = data.get("answers")

    conn = get_db()

    if user_id:
        # Update existing user
        conn.execute(
            "UPDATE users SET vector=?, city=?, interests=?, standing=? WHERE id=?",
            (json.dumps(user_vec), city, json.dumps(interests), standing, user_id),
        )
    else:
        # Register new user
        user_id = _generate_user_id()
        conn.execute(
            "INSERT INTO users (id, vector, city, interests, standing) VALUES (?, ?, ?, ?, ?)",
            (user_id, json.dumps(user_vec), city, json.dumps(interests), standing),
        )

    if questions and answers:
        conn.execute(
            "INSERT INTO responses (user_id, questions, answers) VALUES (?, ?, ?)",
            (user_id, json.dumps(questions), json.dumps(answers)),
        )

    conn.commit()
    conn.close()

    # Load other users (exclude self)
    db_users = [u for u in _load_users_from_db() if u["id"] != user_id]

    results = []
    for u in db_users:
        raw_sim = _cosine_sim(user_vec, u["vector"])
        score_pct = ((raw_sim + 1) / 2) * 100
        dist_penalty = u["distance"] * 1.5
        match_score = max(0, min(100, score_pct - dist_penalty))
        traits_str = u["traits"]
        if isinstance(traits_str, list):
            traits_str = " • ".join(traits_str)
        results.append({
            "id": u["id"],
            "emoji": u["emoji"],
            "matchScore": round(match_score, 1),
            "distance": u["distance"],
            "standing": u["standing"],
            "traits": traits_str,
        })

    results.sort(key=lambda x: -x["matchScore"])
    return jsonify({"user_id": user_id, "matches": results})


if __name__ == "__main__":
    print("Loading compression model...")
    _load_models()
    print("Loading niche questions...")
    _load_niche_pool()
    print("Initializing database...")
    init_db()
    port = int(os.environ.get("PORT", 5001))
    print(f"Ready. Open http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
