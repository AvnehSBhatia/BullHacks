"""Batch test: run the compression model over a wide range of synthetic personality pairs."""

import json
import random

import numpy as np
import torch
import torch.nn.functional as F

from response_modify import to_matrix
from train import load_checkpoint, get_device

GLOBAL_QUESTIONS = [
    "What are your biggest motivations?",
    "What are your biggest weaknesses? Strengths?",
    "What activities do you do to handle stress or recharge?",
    "Do you think or act first?",
    "Do you work better alone or with a group?",
]

with open("niche_questions.json") as f:
    _NICHE_POOL = json.load(f)["qa_pairs"]

# Archetypes: only 5 global answers per archetype.
# Niche Q6-10 are sampled randomly from niche_questions.json at test time.
ARCHETYPES = {
    "driven_introvert": [
        "Financial independence and proving myself.",
        "I overthink everything, but I'm great at planning ahead.",
        "I go for long runs and journal to clear my head.",
        "I think first, always. I plan before I act.",
        "Alone, I focus better without distractions.",
    ],
    "creative_extrovert": [
        "Creative expression and connecting with people through art.",
        "I procrastinate under pressure, though my creativity saves me.",
        "I paint, play guitar, and call friends to vent.",
        "I act first, I trust my gut and figure it out.",
        "With a group, I feed off other people's energy.",
    ],
    "analytical_scientist": [
        "Understanding the universe at the deepest level.",
        "I'm too analytical, though that makes me a great problem solver.",
        "I read physics papers and take long walks in nature.",
        "I think first, I need to understand the why before the how.",
        "Alone for deep work, group for brainstorming.",
    ],
    "social_helper": [
        "Helping others succeed gives me the most energy.",
        "I take on too much, though my work ethic is unmatched.",
        "I volunteer and cook for friends to recharge.",
        "I act first in social situations but think first for big decisions.",
        "With a group, collaboration makes everything better.",
    ],
    "adventurous_explorer": [
        "Adventure and new experiences are what I live for.",
        "I'm impulsive, but it makes life exciting and I adapt fast.",
        "I go rock climbing, surf, or take spontaneous road trips.",
        "I act first because life is too short to overanalyze.",
        "With a group for adventures, alone for reflection.",
    ],
    "disciplined_minimalist": [
        "Personal growth and becoming a better person daily.",
        "I'm too rigid, but my discipline produces consistent results.",
        "I meditate, do cold exposure, and practice breathwork.",
        "I think first and create a mental framework before acting.",
        "Alone, I protect my focus time aggressively.",
    ],
    "empathetic_writer": [
        "I want to write something that changes how people think.",
        "I'm too sensitive to criticism, but I use it as fuel.",
        "I journal, read poetry, and take long baths to decompress.",
        "I think deeply first then execute rapidly.",
        "Alone for writing, group for feedback and editing.",
    ],
    "tech_builder": [
        "I want to code something that millions of people use.",
        "I'm bad at delegating, but I deliver high-quality work.",
        "I write code for fun projects and play video games.",
        "I act first, build a prototype, then iterate.",
        "Alone for coding, group for design reviews.",
    ],
    "nature_caretaker": [
        "Leaving the world better than I found it matters most.",
        "I avoid conflict, but I'm a great mediator when I step up.",
        "I garden, hike, and spend time with animals.",
        "I think first because my actions affect other people.",
        "With a small group of two or three people max.",
    ],
    "competitive_athlete": [
        "Competition drives me more than anything else.",
        "My impatience is a weakness, but it makes me efficient.",
        "I go to the gym and play competitive sports daily.",
        "I act first because hesitation kills momentum.",
        "With a group when the energy is competitive.",
    ],
}


def build_profile(global_answers: list[str], rng: random.Random) -> tuple[list[str], list[str]]:
    """Build a 10-Q/10-A profile: 5 global + 5 random niche from niche_questions.json."""
    niche_sample = rng.sample(_NICHE_POOL, 5)
    niche_questions = [qa["question"] for qa in niche_sample]
    niche_answers = [qa["answer"] for qa in niche_sample]
    questions = GLOBAL_QUESTIONS + niche_questions
    answers = global_answers + niche_answers
    return questions, answers


def compute_similarity(q1, a1, q2, a2, model, device):
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


def test_all_pairs(model, device, n_trials: int = 5):
    """Test every archetype pair with random niche questions, averaged over n_trials."""
    names = list(ARCHETYPES.keys())
    n = len(names)
    matrix = np.zeros((n, n))

    print(f"\nComputing {n * (n + 1) // 2} pairwise similarities (avg over {n_trials} trials)...\n")

    for i in range(n):
        for j in range(i, n):
            total = 0.0
            for t in range(n_trials):
                rng = random.Random(t * 1000 + i * 100 + j)
                q1, a1 = build_profile(ARCHETYPES[names[i]], rng)
                q2, a2 = build_profile(ARCHETYPES[names[j]], rng)
                pct, _ = compute_similarity(q1, a1, q2, a2, model, device)
                total += pct
            avg = total / n_trials
            matrix[i][j] = avg
            matrix[j][i] = avg

    # Print matrix
    short_names = [n[:12].ljust(12) for n in names]
    header = "              " + "  ".join(f"{n[:7]:>7}" for n in names)
    print(header)
    print("              " + "  ".join(["-------"] * n))
    for i in range(n):
        row = f"{short_names[i]}  "
        for j in range(n):
            row += f"{matrix[i][j]:7.1f}  "
        print(row)

    # Top and bottom pairs
    pairs = []
    for i in range(n):
        for j in range(i + 1, n):
            pairs.append((names[i], names[j], matrix[i][j]))

    pairs.sort(key=lambda x: x[2], reverse=True)

    print(f"\n{'='*60}")
    print("  TOP 5 MOST COMPATIBLE PAIRS")
    print(f"{'='*60}")
    for a, b, pct in pairs[:5]:
        print(f"  {pct:5.1f}%  {a} <-> {b}")

    print(f"\n{'='*60}")
    print("  TOP 5 LEAST COMPATIBLE PAIRS")
    print(f"{'='*60}")
    for a, b, pct in pairs[-5:]:
        print(f"  {pct:5.1f}%  {a} <-> {b}")

    # Self-similarity (should be 100%)
    print(f"\n{'='*60}")
    print("  SELF-SIMILARITY (should be ~100%)")
    print(f"{'='*60}")
    for i, name in enumerate(names):
        print(f"  {matrix[i][i]:5.1f}%  {name}")

    # Stats
    off_diag = [matrix[i][j] for i in range(n) for j in range(i+1, n)]
    print(f"\n{'='*60}")
    print("  STATS (off-diagonal)")
    print(f"{'='*60}")
    print(f"  Mean:   {np.mean(off_diag):.1f}%")
    print(f"  Std:    {np.std(off_diag):.1f}%")
    print(f"  Min:    {np.min(off_diag):.1f}%")
    print(f"  Max:    {np.max(off_diag):.1f}%")
    print(f"  Range:  {np.max(off_diag) - np.min(off_diag):.1f}%")


def test_perturbations(model, device, n_trials: int = 5):
    """Test how changing one global answer affects similarity, averaged over random niche draws."""
    base_global = ARCHETYPES["driven_introvert"]
    print(f"\n{'='*60}")
    print(f"  PERTURBATION TEST (driven_introvert, avg over {n_trials} niche draws)")
    print(f"{'='*60}")

    # Baseline: self-similarity with same niche questions
    total_self = 0.0
    for t in range(n_trials):
        rng = random.Random(t)
        q, a = build_profile(base_global, rng)
        pct, _ = compute_similarity(q, a, q, a, model, device)
        total_self += pct
    pct_self = total_self / n_trials
    print(f"  Self:              {pct_self:.1f}%")

    modifications = {
        "Q1 (motivation)": (0, "Creative expression and making art that moves people."),
        "Q2 (weakness)":   (1, "I'm too impulsive, but I adapt quickly."),
        "Q3 (recharge)":   (2, "I party with friends and go to concerts."),
        "Q4 (think/act)":  (3, "I act first, always. Thinking comes later."),
        "Q5 (alone/group)": (4, "With a big group, the more people the better."),
        "All 5 global flipped": None,
    }

    for label, mod in modifications.items():
        if mod is None:
            modified_global = [
                "Creative expression and making art that moves people.",
                "I'm too impulsive, but I adapt quickly.",
                "I party with friends and go to concerts.",
                "I act first, always. Thinking comes later.",
                "With a big group, the more people the better.",
            ]
        else:
            idx, new_answer = mod
            modified_global = list(base_global)
            modified_global[idx] = new_answer

        total = 0.0
        for t in range(n_trials):
            rng1 = random.Random(t)
            rng2 = random.Random(t + 500)
            q1, a1 = build_profile(base_global, rng1)
            q2, a2 = build_profile(modified_global, rng2)
            pct, _ = compute_similarity(q1, a1, q2, a2, model, device)
            total += pct
        avg = total / n_trials
        delta = avg - pct_self
        print(f"  {label:30s}  {avg:5.1f}%  (Δ {delta:+.1f}%)")


if __name__ == "__main__":
    device = get_device()
    print(f"Using device: {device}")

    model, _ = load_checkpoint("compression_model.pt", device=device)
    model.eval()

    test_all_pairs(model, device)
    test_perturbations(model, device)
