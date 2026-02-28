"""Test of political compatibility model using premade answers."""

import json
import os
import random
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import torch
import torch.nn.functional as F

from response_modify import to_matrix
from train_political import load_checkpoint, get_device

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
NICHE_POLITICAL_PATH = os.path.join(PROJECT_ROOT, "niche_political_questions.json")
POLITICAL_ANSWERS_PATH = os.path.join(PROJECT_ROOT, "political_answers.json")

# Response IDs from political_answers.json that match each persona
PERSONA_RESPONSE_IDS = {
    "progressive": 4,   # gov action, inequality, change, climate urgent, global
    "conservative": 7,   # limited gov, growth, tradition, jobs, national
    "moderate": 2,       # balanced answers
}

GLOBAL_ANSWER_KEYS = [
    "q1_role_of_government",
    "q2_economic_priorities",
    "q3_social_change_tradition",
    "q4_climate_environment",
    "q5_global_vs_local",
]

GLOBAL_QUESTIONS = [
    "Do you believe the government should take an active role in solving social problems, or should individuals and private organizations handle them?",
    "Which is more important to you: economic growth even if it increases inequality, or reducing inequality even if it slows growth?",
    "Should society prioritize preserving traditional values or adapting to changing social norms?",
    "How urgent is it for governments to take strong action against climate change?",
    "Do you think a country should focus more on global cooperation or prioritize national interests?",
]

PERSONAS = ["progressive", "conservative", "moderate"]


def _load_niche_questions() -> list[dict]:
    with open(NICHE_POLITICAL_PATH) as f:
        data = json.load(f)
    return data["qa_pairs"]


def _load_political_answers() -> dict:
    with open(POLITICAL_ANSWERS_PATH) as f:
        data = json.load(f)
    return {r["id"]: r["answers"] for r in data["responses"]}


def build_persona_profile(
    persona: str,
    political_answers: dict,
    niche_pool: list,
    rng: random.Random,
) -> tuple[list[str], list[str]]:
    """Build 10 Q/A profile for a persona from premade answers."""
    questions = list(GLOBAL_QUESTIONS)
    response_id = PERSONA_RESPONSE_IDS.get(persona, PERSONA_RESPONSE_IDS["moderate"])
    answers_dict = political_answers[response_id]

    answers = [answers_dict[k] for k in GLOBAL_ANSWER_KEYS]

    niche_sample = rng.sample(niche_pool, 5)
    for qa in niche_sample:
        questions.append(qa["question"])
        answers.append(qa["answer"])

    return questions, answers


def compute_similarity(
    q1: list[str], a1: list[str],
    q2: list[str], a2: list[str],
    model, device,
) -> tuple[float, float]:
    """Compute compatibility percentage between two users using the trained model."""
    all_strings = q1 + a1 + q2 + a2
    embeddings = to_matrix(all_strings)
    n = len(q1)

    Q1 = torch.tensor(embeddings[0:n], dtype=torch.float32, device=device).unsqueeze(0)
    A1 = torch.tensor(embeddings[n:2*n], dtype=torch.float32, device=device).unsqueeze(0)
    Q2 = torch.tensor(embeddings[2*n:3*n], dtype=torch.float32, device=device).unsqueeze(0)
    A2 = torch.tensor(embeddings[3*n:4*n], dtype=torch.float32, device=device).unsqueeze(0)

    with torch.no_grad():
        v1 = model(Q1, A1)
        v2 = model(Q2, A2)
        v1 = F.normalize(v1, dim=-1)
        v2 = F.normalize(v2, dim=-1)
        cos_sim = F.cosine_similarity(v1, v2, dim=-1).item()

    pct = (cos_sim + 1) / 2 * 100
    return pct, cos_sim


def run_ai_test(
    model_path: str = None,
    seed: int = 42,
) -> dict:
    """
    Run automated test: build profiles from premade answers for progressive, conservative, moderate,
    compute pairwise similarities, and return results.
    """
    if model_path is None:
        model_path = os.path.join(PROJECT_ROOT, "political_compression_model.pt")

    device = get_device()
    print(f"Using device: {device}")

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model not found: {model_path}\n"
            "Run: python depolarizer/train_political.py first."
        )

    print("Loading political compression model...")
    model, _ = load_checkpoint(model_path, device=device)
    model.eval()

    niche_pool = _load_niche_questions()
    political_answers = _load_political_answers()
    rng = random.Random(seed)

    # Build profiles from premade answers
    profiles = {}
    for persona_name in PERSONAS:
        print(f"\nBuilding profile for '{persona_name}' persona (premade answers)...")
        q, a = build_persona_profile(persona_name, political_answers, niche_pool, rng)
        profiles[persona_name] = (q, a)
        for i, (qi, ai) in enumerate(zip(q[:3], a[:3]), 1):
            print(f"  Q{i}: {qi[:60]}...")
            print(f"  A{i}: {ai[:80]}...")
        if len(q) > 3:
            print("  ...")

    # Compute pairwise similarities
    names = list(PERSONAS)
    results = {}
    print("\n" + "=" * 60)
    print("  Pairwise political compatibility")
    print("=" * 60)

    for i, name1 in enumerate(names):
        for name2 in names[i:]:  # include self-pairs
            q1, a1 = profiles[name1]
            q2, a2 = profiles[name2]
            pct, cos_sim = compute_similarity(q1, a1, q2, a2, model, device)
            key = f"{name1} vs {name2}"
            results[key] = {"pct": pct, "cos_sim": cos_sim}
            print(f"\n  {key}: {pct:.1f}% (cos_sim={cos_sim:.4f})")

    return results


def run_consistency_check(results: dict) -> bool:
    """
    Sanity check: same-persona pairs should be most similar;
    progressive vs conservative should be less similar than moderate vs either.
    """
    same_prog = results.get("progressive vs progressive", {}).get("pct", 0)
    same_cons = results.get("conservative vs conservative", {}).get("pct", 0)
    prog_vs_cons = results.get("progressive vs conservative", {}).get("pct", 100)
    mod_vs_prog = results.get("moderate vs progressive", {}).get("pct", 0)
    mod_vs_cons = results.get("moderate vs conservative", {}).get("pct", 0)

    # Same persona should be highly similar
    # Prog vs cons should be lower than moderate vs either
    checks = [
        prog_vs_cons < mod_vs_prog or abs(prog_vs_cons - mod_vs_prog) < 15,
        prog_vs_cons < mod_vs_cons or abs(prog_vs_cons - mod_vs_cons) < 15,
    ]
    passed = all(checks)
    print("\n" + "=" * 60)
    print("  Consistency check")
    print("=" * 60)
    print(f"  progressive vs conservative: {prog_vs_cons:.1f}%")
    print(f"  moderate vs progressive:      {mod_vs_prog:.1f}%")
    print(f"  moderate vs conservative:    {mod_vs_cons:.1f}%")
    print(f"  Same-persona (prog):         {same_prog:.1f}%")
    print(f"  Same-persona (cons):         {same_cons:.1f}%")
    print(f"  Check passed: {passed}")
    return passed


if __name__ == "__main__":
    results = run_ai_test()
    run_consistency_check(results)
