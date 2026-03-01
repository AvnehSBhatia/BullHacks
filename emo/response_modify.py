"""Vectorize 5 Q/A pairs for emotional compatibility model."""

import sys
import os

_here = os.path.dirname(os.path.abspath(__file__))
_parent = os.path.dirname(_here)
if _parent not in sys.path:
    sys.path.insert(0, _parent)

from friend.response_modify import to_matrix
import numpy as np


def vectorize_5qa(questions: list[str], answers: list[str]) -> tuple[np.ndarray, np.ndarray]:
    """
    Vectorize 5 questions and 5 answers.
    Returns (Q, A) as (5, 384) numpy arrays.
    """
    if len(questions) != 5 or len(answers) != 5:
        raise ValueError("Need exactly 5 questions and 5 answers")
    all_strings = questions + answers
    embeddings = to_matrix(all_strings)
    Q = np.array(embeddings[:5])
    A = np.array(embeddings[5:10])
    return Q, A
