"""Train CompressionModel5xn on emotional_answers.json."""

import json
import os
import random
import sys

import numpy as np
import torch

_here = os.path.dirname(os.path.abspath(__file__))
_parent = os.path.dirname(_here)
if _parent not in sys.path:
    sys.path.insert(0, _parent)
sys.path.insert(0, _here)

from response_modify import vectorize_5qa
from compression_model_5xn import CompressionModel5xn, SimilarityConsistencyLoss5xn

DATA_PATH = os.path.join(_here, "emotional_answers.json")
SAVE_PATH = os.path.join(_here, "compression_model_emo.pt")


def get_device() -> torch.device:
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def load_data():
    with open(DATA_PATH) as f:
        data = json.load(f)
    return data


def build_pairs(data: dict, n_pairs: int, seed: int = 42) -> list:
    """Build (q1, a1, q2, a2) for two users. Each uses same question set, different answers."""
    rng = random.Random(seed)
    sets = data["question_sets"]
    responses = data["responses"]

    pairs = []
    for _ in range(n_pairs):
        q_set = rng.choice(sets)
        u1, u2 = rng.sample(responses, 2)
        a1 = u1["answers"]
        a2 = u2["answers"]
        if len(a1) < 5 or len(a2) < 5:
            a1 = (a1 + ["I'm not sure."] * 5)[:5]
            a2 = (a2 + ["I'm not sure."] * 5)[:5]
        pairs.append((q_set[:5], a1[:5], q_set[:5], a2[:5]))
    return pairs


def collate_batch(pairs: list, device: torch.device) -> tuple:
    Q1_list, A1_list, Q2_list, A2_list = [], [], [], []
    for q1, a1, q2, a2 in pairs:
        Q1, A1 = vectorize_5qa(q1, a1)
        Q2, A2 = vectorize_5qa(q2, a2)
        Q1_list.append(Q1)
        A1_list.append(A1)
        Q2_list.append(Q2)
        A2_list.append(A2)
    Q1 = torch.tensor(np.stack(Q1_list), dtype=torch.float32, device=device)
    A1 = torch.tensor(np.stack(A1_list), dtype=torch.float32, device=device)
    Q2 = torch.tensor(np.stack(Q2_list), dtype=torch.float32, device=device)
    A2 = torch.tensor(np.stack(A2_list), dtype=torch.float32, device=device)
    return Q1, A1, Q2, A2


def save_checkpoint(model, loss_fn, epoch, loss):
    torch.save({
        "epoch": epoch,
        "loss": loss,
        "model_state_dict": model.state_dict(),
        "loss_fn_state_dict": loss_fn.state_dict(),
    }, SAVE_PATH)


def load_checkpoint(path=None, device=None):
    path = path or SAVE_PATH
    device = device or get_device()
    model = CompressionModel5xn(n=384).to(device)
    loss_fn = SimilarityConsistencyLoss5xn().to(device)
    if os.path.exists(path):
        ckpt = torch.load(path, map_location=device, weights_only=True)
        model.load_state_dict(ckpt["model_state_dict"])
        loss_fn.load_state_dict(ckpt["loss_fn_state_dict"], strict=False)
        print(f"Loaded checkpoint from epoch {ckpt['epoch']} (loss={ckpt['loss']:.4f})")
    return model, loss_fn


def train(n_epochs=200, batch_size=8, n_pairs=64):
    device = get_device()
    data = load_data()
    model = CompressionModel5xn(n=384).to(device)
    loss_fn = SimilarityConsistencyLoss5xn().to(device)
    opt = torch.optim.Adam(list(model.parameters()) + list(loss_fn.parameters()), lr=1e-3)
    pairs = build_pairs(data, n_pairs=n_pairs)
    n_batches = max(1, (len(pairs) + batch_size - 1) // batch_size)
    best_loss = float("inf")

    for epoch in range(n_epochs):
        random.shuffle(pairs)
        total = 0.0
        for i in range(0, len(pairs), batch_size):
            batch = pairs[i : i + batch_size]
            Q1, A1, Q2, A2 = collate_batch(batch, device)
            opt.zero_grad()
            v1, v2 = model(Q1, A1), model(Q2, A2)
            loss = loss_fn(A1, A2, v1, v2)
            loss.backward()
            opt.step()
            total += loss.item()
        avg = total / n_batches
        if avg < best_loss:
            best_loss = avg
            save_checkpoint(model, loss_fn, epoch + 1, avg)
        if (epoch + 1) % 50 == 0:
            print(f"Epoch {epoch + 1}/{n_epochs}  loss={avg:.4f}")

    print(f"Best loss: {best_loss:.4f} — saved to {SAVE_PATH}")
    return model, loss_fn


if __name__ == "__main__":
    train(n_epochs=200, batch_size=16, n_pairs=48)
