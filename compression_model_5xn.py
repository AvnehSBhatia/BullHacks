"""PyTorch compression model: 5×n Q/A → 64-dim vector."""

from typing import Optional

import torch
import torch.nn as nn
import torch.nn.functional as F


class CompressionModel5xn(nn.Module):
    def __init__(self, n: int = 384):
        super().__init__()
        self.n = n

        # Learned scale and bias for each 5×5 interaction element
        self.dot_scale = nn.Parameter(torch.ones(5, 5))
        self.dot_bias = nn.Parameter(torch.zeros(5, 5))

        # w: 1×5 aggregation over questions
        self.w = nn.Parameter(torch.ones(1, 5) / 5)

        # W: 5×64 projection
        self.proj = nn.Linear(5, 64)

    def forward(self, Q: torch.Tensor, A: torch.Tensor) -> torch.Tensor:
        """
        Q: (batch, 5, n), A: (batch, 5, n)
        Returns: (batch, 64)
        """
        # M[i,j] = dot(Q[i], A[j]) per batch
        M_raw = torch.bmm(Q, A.transpose(1, 2))  # (B, 5, 5)

        # Learned scale and bias on dot products
        M = self.dot_scale * M_raw + self.dot_bias
        M = F.relu(M)

        # z = w @ M  →  (B, 1, 5)
        z = torch.matmul(self.w, M)
        z = z.squeeze(1)  # (B, 5)
        z = F.relu(z)

        v = self.proj(z)  # (B, 64)
        return v


# --- Loss functions ---


def contrastive_loss(
    v1: torch.Tensor, v2: torch.Tensor, labels: torch.Tensor, margin: float = 0.5
) -> torch.Tensor:
    """
    Contrastive loss: pull similar pairs together, push dissimilar apart.
    v1, v2: (batch, 64) embeddings for pairs
    labels: (batch,) 1 = similar/compatible, 0 = dissimilar
    """
    dist = F.pairwise_distance(v1, v2)
    loss_sim = labels * dist.pow(2)
    loss_dissim = (1 - labels) * F.relu(margin - dist).pow(2)
    return (loss_sim + loss_dissim).mean()


def triplet_loss(
    anchor: torch.Tensor, positive: torch.Tensor, negative: torch.Tensor, margin: float = 0.2
) -> torch.Tensor:
    """
    Triplet loss: d(anchor, positive) < d(anchor, negative) - margin
    anchor, positive, negative: (batch, 64)
    """
    d_pos = F.pairwise_distance(anchor, positive)
    d_neg = F.pairwise_distance(anchor, negative)
    return F.relu(d_pos - d_neg + margin).mean()


def cosine_embedding_loss(
    v1: torch.Tensor, v2: torch.Tensor, labels: torch.Tensor, margin: float = 0.0
) -> torch.Tensor:
    """
    Cosine embedding: labels 1 = same direction, -1 = opposite.
    labels: 1 = compatible, -1 = incompatible
    """
    return F.cosine_embedding_loss(v1, v2, labels, margin=margin)


def similarity_consistency_loss(
    A1: torch.Tensor, A2: torch.Tensor, v1: torch.Tensor, v2: torch.Tensor
) -> torch.Tensor:
    """
    MAE between:
    - cos_sim on input answers A1, A2 per question → mean
    - cos_sim on model outputs v1, v2

    A1, A2: (batch, 5, 384) answer matrices from two users
    v1, v2: (batch, 64) model outputs for those users
    """
    cos_input = F.cosine_similarity(A1, A2, dim=-1)  # (batch, 5)
    target = cos_input.mean(dim=1)  # (batch,)

    v1 = F.normalize(v1, dim=-1)
    v2 = F.normalize(v2, dim=-1)
    pred = F.cosine_similarity(v1, v2, dim=-1)

    return F.l1_loss(pred, target)  # MAE


class SimilarityConsistencyLoss(nn.Module):
    """
    All 5 questions: same questions (global) → cos_sim(A1[i], A2[i]) per i, mean.
    Add loss_module.parameters() to your optimizer.
    Optional target_override: (batch,) tensor to override targets (e.g. 0 for polar opposite pairs).
    """

    def __init__(self):
        super().__init__()

    def forward(
        self,
        A1: torch.Tensor,
        A2: torch.Tensor,
        v1: torch.Tensor,
        v2: torch.Tensor,
        target_override: Optional[torch.Tensor] = None,
    ) -> torch.Tensor:
        # All 5: same question → direct cos_sim per row
        cos_global = F.cosine_similarity(A1, A2, dim=-1).mean(dim=1)
        target = target_override if target_override is not None else cos_global

        v1 = F.normalize(v1, dim=-1)
        v2 = F.normalize(v2, dim=-1)
        pred = F.cosine_similarity(v1, v2, dim=-1)

        return F.l1_loss(pred, target)  # MAE


# --- Example usage ---
if __name__ == "__main__":
    n = 384
    batch = 16
    model = CompressionModel5xn(n=n)
    loss_fn = SimilarityConsistencyLoss()
    opt = torch.optim.Adam(list(model.parameters()) + list(loss_fn.parameters()), lr=1e-3)

    Q1, A1 = torch.randn(batch, 5, n), torch.randn(batch, 5, n)
    Q2, A2 = torch.randn(batch, 5, n), torch.randn(batch, 5, n)

    v1, v2 = model(Q1, A1), model(Q2, A2)
    loss = loss_fn(A1, A2, v1, v2)
    loss.backward()
    opt.step()
    print(loss.item())
