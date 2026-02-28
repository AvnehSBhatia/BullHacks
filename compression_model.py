"""PyTorch compression model: 10×n Q/A → 64-dim vector."""

import torch
import torch.nn as nn
import torch.nn.functional as F


class CompressionModel(nn.Module):
    def __init__(self, n: int = 384):
        super().__init__()
        self.n = n

        # Learned scale and bias for each 10×10 interaction element
        self.dot_scale = nn.Parameter(torch.ones(10, 10))
        self.dot_bias = nn.Parameter(torch.zeros(10, 10))

        # w: 1×10 aggregation over questions
        self.w = nn.Parameter(torch.ones(1, 10) / 10)

        # W: 10×64 projection
        self.proj = nn.Linear(10, 64)

    def forward(self, Q: torch.Tensor, A: torch.Tensor) -> torch.Tensor:
        """
        Q: (batch, 10, n), A: (batch, 10, n)
        Returns: (batch, 64)
        """
        # M[i,j] = dot(Q[i], A[j]) per batch
        M_raw = torch.bmm(Q, A.transpose(1, 2))  # (B, 10, 10)

        # Learned scale and bias on dot products
        M = self.dot_scale * M_raw + self.dot_bias
        M = F.relu(M)

        # z = w @ M  →  (B, 1, 10)
        z = torch.matmul(self.w, M)
        z = z.squeeze(1)  # (B, 10)
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

    A1, A2: (batch, 10, 384) answer matrices from two users
    v1, v2: (batch, 64) model outputs for those users
    """
    cos_input = F.cosine_similarity(A1, A2, dim=-1)  # (batch, 10)
    target = cos_input.mean(dim=1)  # (batch,)

    v1 = F.normalize(v1, dim=-1)
    v2 = F.normalize(v2, dim=-1)
    pred = F.cosine_similarity(v1, v2, dim=-1)

    return F.l1_loss(pred, target)  # MAE


class SimilarityConsistencyLoss(nn.Module):
    """
    Q1-5: same questions (global) → cos_sim(A1[i], A2[i]) per i, mean
    Q6-10: different questions (niche) → cos_sim of flattened niche blocks

    Learned weights w_global, w_niche combine the two (softmax normalized).
    Add loss_module.parameters() to your optimizer.
    """

    def __init__(self):
        super().__init__()
        self.logits = nn.Parameter(torch.zeros(2))  # [global, niche]

    def forward(
        self, A1: torch.Tensor, A2: torch.Tensor, v1: torch.Tensor, v2: torch.Tensor
    ) -> torch.Tensor:
        # Global (Q1-5): same question → direct cos_sim per row
        cos_global = F.cosine_similarity(A1[:, :5], A2[:, :5], dim=-1).mean(dim=1)

        # Niche (Q6-10): different questions → compare flattened blocks
        niche1 = A1[:, 5:10].flatten(1)  # (batch, 5*384)
        niche2 = A2[:, 5:10].flatten(1)
        cos_niche = F.cosine_similarity(niche1, niche2, dim=-1)

        # Learned weights (softmax → sum to 1)
        w = F.softmax(self.logits, dim=0)
        target = w[0] * cos_global + w[1] * cos_niche

        v1 = F.normalize(v1, dim=-1)
        v2 = F.normalize(v2, dim=-1)
        pred = F.cosine_similarity(v1, v2, dim=-1)

        return F.l1_loss(pred, target)  # MAE


# --- Example usage ---
if __name__ == "__main__":
    n = 384
    batch = 4
    model = CompressionModel(n=n)
    loss_fn = SimilarityConsistencyLoss()
    opt = torch.optim.Adam(list(model.parameters()) + list(loss_fn.parameters()), lr=1e-3)

    Q1, A1 = torch.randn(batch, 10, n), torch.randn(batch, 10, n)
    Q2, A2 = torch.randn(batch, 10, n), torch.randn(batch, 10, n)

    v1, v2 = model(Q1, A1), model(Q2, A2)
    loss = loss_fn(A1, A2, v1, v2)
    loss.backward()
    opt.step()
    print(loss.item(), "weights:", F.softmax(loss_fn.logits, dim=0))
