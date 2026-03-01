"""PyTorch compression model: 5×n Q/A → 64-dim vector (emotional compatibility)."""

import torch
import torch.nn as nn
import torch.nn.functional as F


class CompressionModel5xn(nn.Module):
    """5 questions × 5 answers → 64-dim embedding for emotional compatibility."""

    def __init__(self, n: int = 384):
        super().__init__()
        self.n = n

        self.dot_scale = nn.Parameter(torch.ones(5, 5))
        self.dot_bias = nn.Parameter(torch.zeros(5, 5))
        self.w = nn.Parameter(torch.ones(1, 5) / 5)
        self.proj = nn.Linear(5, 64)

    def forward(self, Q: torch.Tensor, A: torch.Tensor) -> torch.Tensor:
        """
        Q: (batch, 5, n), A: (batch, 5, n)
        Returns: (batch, 64)
        """
        M_raw = torch.bmm(Q, A.transpose(1, 2))  # (B, 5, 5)
        M = self.dot_scale * M_raw + self.dot_bias
        M = F.relu(M)
        z = torch.matmul(self.w, M)
        z = z.squeeze(1)  # (B, 5)
        z = F.relu(z)
        return self.proj(z)


class SimilarityConsistencyLoss5xn(nn.Module):
    """Consistency loss for 5 Q/A pairs: cos_sim(A1, A2) per row → target for cos_sim(v1, v2)."""

    def __init__(self):
        super().__init__()

    def forward(
        self, A1: torch.Tensor, A2: torch.Tensor, v1: torch.Tensor, v2: torch.Tensor
    ) -> torch.Tensor:
        cos_input = F.cosine_similarity(A1, A2, dim=-1).mean(dim=1)
        v1 = F.normalize(v1, dim=-1)
        v2 = F.normalize(v2, dim=-1)
        pred = F.cosine_similarity(v1, v2, dim=-1)
        return F.l1_loss(pred, cos_input)
