"""Interactive emotional compatibility test: two users answer 5 questions, compute similarity."""

import json
import random
import sys
from pathlib import Path

import torch
import torch.nn.functional as F

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from friend.response_modify import to_matrix
from emo.train import load_checkpoint, get_device

EMOTIONAL_QUESTIONS = [
    "How are you feeling right now?",
    "What is stressing you out?",
    "What are you doing right now?",
    "How do you like to destress?",
    "Why do you feel the way you do?",
]


def answers_from_response(response: dict) -> list[str]:
    """Convert a response dict to ordered answer list."""
    a = response["answers"]
    return [a["q1_feeling"], a["q2_stress"], a["q3_doing"], a["q4_destress"], a["q5_why"]]


def sample_pair(data: dict, rng: random.Random) -> tuple[list[str], list[str], list[str], list[str]]:
    """Sample two different users and return (q1, a1, q2, a2)."""
    responses = data["responses"]
    questions = data["questions"]
    u1, u2 = rng.sample(responses, 2)
    return questions, answers_from_response(u1), questions, answers_from_response(u2)


# Hand-picked polar opposite answer sets (positive vs negative archetypes)
# Each tuple is (positive_answers, negative_answers) for the 5 questions
POLAR_VARIANTS = [
    (
        [
            "I'm actually doing pretty good today.",
            "Nothing really, I'm in a good place.",
            "Relaxing and taking it easy.",
            "I go for long runs to clear my head.",
            "Something good happened that I'm grateful for.",
        ],
        [
            "Miserable and wanting to hide.",
            "Everything, I'm completely overwhelmed.",
            "Avoiding something I should be doing.",
            "I do absolutely nothing and let myself be bored.",
            "Because I've been pushing too hard lately.",
        ],
    ),
    (
        [
            "Surprisingly calm for once.",
            "Not much, life is good right now.",
            "Sitting in nature enjoying the moment.",
            "I meditate or do breathing exercises.",
            "I'm surrounded by good people.",
        ],
        [
            "Exhausted mentally and physically.",
            "Work deadlines that keep piling up.",
            "Staring at a screen avoiding reality.",
            "I binge a show and disconnect.",
            "I haven't slept well in days.",
        ],
    ),
    (
        [
            "Peaceful after a good morning.",
            "Minor things, nothing serious.",
            "Drinking coffee and gathering myself.",
            "I take a walk in nature.",
            "I made progress on something meaningful.",
        ],
        [
            "Hopeless about a situation.",
            "A conflict with someone I care about.",
            "In a meeting I'm zoning out of.",
            "I scroll to avoid feelings.",
            "I'm carrying worry about the future.",
        ],
    ),
    (
        [
            "Light and carefree for once.",
            "Small stuff, nothing major.",
            "Listening to music and enjoying it.",
            "I watch stand-up comedy.",
            "I got validation I needed.",
        ],
        [
            "Defeated by setbacks.",
            "Health concerns for me or a loved one.",
            "Procrastinating on something important.",
            "I take a nap and hope it helps.",
            "I'm afraid of what's coming.",
        ],
    ),
    (
        [
            "Grounded and steady.",
            "Routine stress, manageable.",
            "Doing something creative.",
            "I cook a complicated meal and lose myself in it.",
            "I'm grateful for what I have.",
        ],
        [
            "Hollow and going through the motions.",
            "Uncertainty about the future.",
            "Multitasking badly.",
            "I hit a punching bag.",
            "I'm stuck in overthinking.",
        ],
    ),
]


def sample_polar_pair(data: dict, rng: random.Random) -> tuple[list[str], list[str], list[str], list[str]]:
    """Sample a polar opposite pair: one positive archetype, one negative."""
    questions = data["questions"]
    pos, neg = rng.choice(POLAR_VARIANTS)
    if rng.random() < 0.5:
        return questions, pos, questions, neg
    return questions, neg, questions, pos


def ask_questions(user_name: str) -> tuple[list[str], list[str]]:
    """Ask one user all 5 emotional questions."""
    print(f"\n{'='*60}")
    print(f"  {user_name}'s turn")
    print(f"{'='*60}\n")

    questions = []
    answers = []
    for i, q in enumerate(EMOTIONAL_QUESTIONS, 1):
        answer = input(f"  Q{i}: {q}\n  > ").strip()
        if not answer:
            answer = "I'm not sure."
        questions.append(q)
        answers.append(answer)

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


def main():
    device = get_device()
    print(f"Using device: {device}")

    model_path = Path(__file__).parent / "compression_model_emo.pt"
    print(f"Loading trained compression model from {model_path}...")
    model, _ = load_checkpoint(str(model_path), device=device)
    model.eval()

    # Person 1
    q1, a1 = ask_questions("Person 1")

    print("\n" + "=" * 60)
    input("  Hand the laptop to Person 2. Press Enter to continue...")

    # Person 2
    q2, a2 = ask_questions("Person 2")

    # Compute
    print("\n" + "=" * 60)
    print("  Computing compatibility...")
    print("=" * 60)

    pct, cos_sim = compute_similarity(q1, a1, q2, a2, model, device)

    print(f"\n  Cosine similarity:  {cos_sim:.4f}")
    print(f"  Compatibility:      {pct:.1f}%\n")

    if pct >= 80:
        print("  You two are highly compatible emotionally!")
    elif pct >= 60:
        print("  You two have solid emotional overlap.")
    elif pct >= 40:
        print("  You two have some differences but potential connection.")
    else:
        print("  You two are quite different — different wavelengths?")


def batch_run(n: int = 100, seed: int = 42, polar: bool = False):
    """Run n compatibility tests. If polar, use polar opposite answer pairs."""
    device = get_device()
    model_path = Path(__file__).parent / "compression_model_emo.pt"
    data_path = Path(__file__).parent / "emotional_answers.json"

    with open(data_path) as f:
        data = json.load(f)

    model, _ = load_checkpoint(str(model_path), device=device)
    model.eval()

    rng = random.Random(seed)
    pcts = []
    sample_fn = sample_polar_pair if polar else sample_pair

    for i in range(n):
        q1, a1, q2, a2 = sample_fn(data, rng)
        pct, cos_sim = compute_similarity(q1, a1, q2, a2, model, device)
        pcts.append(pct)

    pcts_t = torch.tensor(pcts)
    label = "Polar opposite" if polar else "Random"
    print(f"Batch run ({label}): {n} pairs")
    print(f"  Mean compatibility: {pcts_t.mean():.1f}%")
    print(f"  Std:                {pcts_t.std():.1f}%")
    print(f"  Min:                {pcts_t.min():.1f}%")
    print(f"  Max:                {pcts_t.max():.1f}%")
    print(f"  Median:             {pcts_t.median():.1f}%")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--batch":
        polar = "--polar" in sys.argv
        n = 100
        for i, arg in enumerate(sys.argv[2:], 2):
            if arg.isdigit():
                n = int(arg)
                break
        batch_run(n=n, polar=polar)
    else:
        main()
