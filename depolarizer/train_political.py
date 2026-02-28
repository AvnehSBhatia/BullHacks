"""Train CompressionModel using political_answers.json and niche_political_questions.json."""

import json
import os
import random
import sys

# Allow imports from project root (compression_model)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import numpy as np
import torch

from response_modify import vectorize_pair
from compression_model import CompressionModel, SimilarityConsistencyLoss

POLITICAL_ANSWERS_PATH = os.path.join(PROJECT_ROOT, "political_answers.json")
NICHE_POLITICAL_PATH = os.path.join(PROJECT_ROOT, "niche_political_questions.json")
SAVE_PATH = os.path.join(PROJECT_ROOT, "political_compression_model.pt")


def get_device() -> torch.device:
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def load_data():
    with open(POLITICAL_ANSWERS_PATH) as f:
        political = json.load(f)
    with open(NICHE_POLITICAL_PATH) as f:
        niche = json.load(f)
    return political, niche


def build_user_profile(
    political_entry: dict, niche_pool: list, rng: random.Random
) -> tuple[list[str], list[str]]:
    """
    Build a 10-question / 10-answer profile for one user.
    Q1-5: global political questions with the user's answers.
    Q6-10: randomly sampled niche political questions with their answers.
    """
    global_questions = [
        "Do you believe the government should take an active role in solving social problems, or should individuals and private organizations handle them?",
        "Which is more important to you: economic growth even if it increases inequality, or reducing inequality even if it slows growth?",
        "Should society prioritize preserving traditional values or adapting to changing social norms?",
        "How urgent is it for governments to take strong action against climate change?",
        "Do you think a country should focus more on global cooperation or prioritize national interests?",
    ]
    ans = political_entry["answers"]
    global_answers = [
        ans["q1_role_of_government"],
        ans["q2_economic_priorities"],
        ans["q3_social_change_tradition"],
        ans["q4_climate_environment"],
        ans["q5_global_vs_local"],
    ]

    niche_sample = rng.sample(niche_pool, 5)
    niche_questions = [qa["question"] for qa in niche_sample]
    niche_answers = [qa["answer"] for qa in niche_sample]

    questions = global_questions + niche_questions
    answers = global_answers + niche_answers
    return questions, answers


def build_pairs(political: dict, niche: dict, n_pairs: int, seed: int = 42) -> list:
    """
    Build (questions_1, answers_1, questions_2, answers_2) pairs from the JSON data.
    Each pair is two different users; Q1-5 are shared, Q6-10 differ per user.
    """
    rng = random.Random(seed)
    responses = political["responses"]
    niche_pool = niche["qa_pairs"]
    pairs = []

    for _ in range(n_pairs):
        u1, u2 = rng.sample(responses, 2)
        q1, a1 = build_user_profile(u1, niche_pool, rng)
        q2, a2 = build_user_profile(u2, niche_pool, rng)
        pairs.append((q1, a1, q2, a2))

    return pairs


def collate_batch(pairs: list, device: torch.device) -> tuple:
    """Vectorize a batch of pairs and return (Q1, A1, Q2, A2) tensors."""
    Q1_list, A1_list, Q2_list, A2_list = [], [], [], []

    for q1, a1, q2, a2 in pairs:
        Q1, A1, Q2, A2 = vectorize_pair(q1, a1, q2, a2)
        Q1_list.append(Q1)
        A1_list.append(A1)
        Q2_list.append(Q2)
        A2_list.append(A2)

    Q1 = torch.tensor(np.stack(Q1_list), dtype=torch.float32, device=device)
    A1 = torch.tensor(np.stack(A1_list), dtype=torch.float32, device=device)
    Q2 = torch.tensor(np.stack(Q2_list), dtype=torch.float32, device=device)
    A2 = torch.tensor(np.stack(A2_list), dtype=torch.float32, device=device)

    return Q1, A1, Q2, A2


def save_checkpoint(model, loss_fn, epoch, loss, path=SAVE_PATH):
    torch.save(
        {
            "epoch": epoch,
            "loss": loss,
            "model_state_dict": model.state_dict(),
            "loss_fn_state_dict": loss_fn.state_dict(),
        },
        path,
    )


def load_checkpoint(path=SAVE_PATH, device=None):
    device = device or get_device()
    model = CompressionModel(n=384).to(device)
    loss_fn = SimilarityConsistencyLoss().to(device)
    ckpt = torch.load(path, map_location=device, weights_only=True)
    model.load_state_dict(ckpt["model_state_dict"])
    loss_fn.load_state_dict(ckpt["loss_fn_state_dict"])
    print(f"Loaded checkpoint from epoch {ckpt['epoch']} (loss={ckpt['loss']:.4f})")
    return model, loss_fn


def train(
    n_epochs: int = 100,
    batch_size: int = 8,
    lr: float = 1e-3,
    n_pairs: int = 64,
    device: str = None,
):
    device = device or get_device()
    if isinstance(device, str):
        device = torch.device(device)
    print(f"Using device: {device}")

    political, niche = load_data()
    print(
        f"Loaded {len(political['responses'])} political profiles, "
        f"{niche['total']} niche political Q/A pairs"
    )

    model = CompressionModel(n=384).to(device)
    loss_fn = SimilarityConsistencyLoss().to(device)
    opt = torch.optim.Adam(
        list(model.parameters()) + list(loss_fn.parameters()), lr=lr
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=n_epochs)

    pairs = build_pairs(political, niche, n_pairs=n_pairs)
    n_batches = (len(pairs) + batch_size - 1) // batch_size

    best_loss = float("inf")

    for epoch in range(n_epochs):
        total_loss = 0.0
        for i in range(0, len(pairs), batch_size):
            batch = pairs[i : i + batch_size]
            Q1, A1, Q2, A2 = collate_batch(batch, device)

            opt.zero_grad()
            v1 = model(Q1, A1)
            v2 = model(Q2, A2)
            loss = loss_fn(A1, A2, v1, v2)
            loss.backward()
            opt.step()

            total_loss += loss.item()

        scheduler.step()
        avg_loss = total_loss / n_batches
        w = torch.softmax(loss_fn.logits, dim=0)
        print(
            f"Epoch {epoch + 1}/{n_epochs}  loss={avg_loss:.4f}  "
            f"lr={scheduler.get_last_lr()[0]:.6f}  weights=[{w[0]:.3f}, {w[1]:.3f}]"
        )

        if avg_loss < best_loss:
            best_loss = avg_loss
            save_checkpoint(model, loss_fn, epoch + 1, avg_loss)

    print(f"\nBest loss: {best_loss:.4f} — saved to {SAVE_PATH}")
    return model, loss_fn


if __name__ == "__main__":
    train(n_epochs=1000, batch_size=64, n_pairs=32)
