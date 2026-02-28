"""Interactive compatibility test: two users answer questions, compute similarity."""

import os

import torch
import torch.nn.functional as F
from huggingface_hub import InferenceClient

from response_modify import to_matrix
from train import load_checkpoint, get_device

_HF_TOKEN = os.environ.get("HF_API_TOKEN")
_hf_client = InferenceClient(token=_HF_TOKEN)
_LLM_MODEL = "meta-llama/Llama-3.2-1B-Instruct"

GLOBAL_QUESTIONS = [
    "What are your biggest motivations?",
    "What are your biggest weaknesses? Strengths?",
    "What activities do you do to handle stress or recharge?",
    "Do you think or act first?",
    "Do you work better alone or with a group?",
]

FALLBACK_NICHE = [
    "What's a niche hobby or interest you're passionate about?",
    "What's a topic you could talk about for hours?",
    "What's a skill you're secretly proud of?",
    "What's something most people don't know about you?",
    "What's the most obscure thing you find fascinating?",
]


def _parse_question(text: str) -> str:
    """Extract just the question from LLM output, stripping all preamble."""
    # Take only the first line that ends with '?'
    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue
        # Strip numbering
        for prefix in ["1.", "2.", "3.", "4.", "5.", "1)", "2)", "3)", "4)", "5)"]:
            if line.startswith(prefix):
                line = line[len(prefix):].strip()
                break
        # Strip quotes
        if line.startswith('"') and line.endswith('"'):
            line = line[1:-1]
        if line.startswith('"'):
            line = line[1:]
        if line.endswith('"'):
            line = line[:-1]
        # If it contains a '?', extract from last sentence start to the '?'
        if "?" in line:
            # Find the actual question part
            q_end = line.index("?") + 1
            line = line[:q_end]
            # If there's preamble like "Based on..., ", find where the question starts
            for marker in ["what ", "how ", "do ", "are ", "is ", "which ", "why ",
                           "when ", "where ", "would ", "could ", "have ", "can ",
                           "did ", "will ", "if "]:
                idx = line.lower().rfind(marker)
                if idx > 0:
                    line = line[idx:]
                    break
            return line.strip()
        # If no '?', append one
        if len(line) > 10:
            return line.rstrip(".") + "?"
    return text.strip()


def predict_personality(qa_history: list[tuple[str, str]]) -> str:
    """Ask the LLM to predict personality traits from all Q/A so far."""
    context = "\n".join(f"Q: {q}\nA: {a}" for q, a in qa_history)
    try:
        resp = _hf_client.chat_completion(
            model=_LLM_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Give a 2-3 sentence personality read. Be specific. "
                        "No filler, no preamble like 'Based on...'. "
                        "Never use pronouns (he/she/they/him/her/them). "
                        "Use 'this person' or rephrase with traits directly."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Person's answers:\n{context}",
                },
            ],
            max_tokens=150,
            temperature=0.7,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"(Could not predict: {e})"


def generate_next_question(qa_history: list[tuple[str, str]], question_number: int) -> str:
    """
    Generate a single next question that drills deeper based on ALL prior Q/A.
    Each successive question should be more specific and niche than the last.
    """
    context = "\n".join(f"Q: {q}\nA: {a}" for q, a in qa_history)

    depth_labels = {
        6: "casual",
        7: "personal",
        8: "specific",
        9: "very specific",
        10: "deeply personal",
    }
    depth = depth_labels.get(question_number, "specific")

    try:
        resp = _hf_client.chat_completion(
            model=_LLM_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Write one short, simple question (under 15 words). "
                        "Ask about a feeling, opinion, or preference. "
                        "No trivia. No preamble. Just the question."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Their answers:\n{context}\n\n"
                        f"One {depth} follow-up question:"
                    ),
                },
            ],
            max_tokens=50,
            temperature=0.8,
        )
        q = _parse_question(resp.choices[0].message.content.strip())
        if q and len(q) > 5:
            return q
    except Exception as e:
        print(f"  LLM error ({e})")

    idx = question_number - 6
    if idx < len(FALLBACK_NICHE):
        return FALLBACK_NICHE[idx]
    return FALLBACK_NICHE[-1]


def ask_questions(user_name: str) -> tuple[list[str], list[str]]:
    """Ask one user all 10 questions with adaptive niche drilling."""
    print(f"\n{'='*60}")
    print(f"  {user_name}'s turn")
    print(f"{'='*60}\n")

    qa_history: list[tuple[str, str]] = []

    # Phase 1: 5 global questions
    for i, q in enumerate(GLOBAL_QUESTIONS, 1):
        answer = input(f"  Q{i}: {q}\n  > ").strip()
        if not answer:
            answer = "I'm not sure."
        qa_history.append((q, answer))

    # Personality prediction after global questions
    print(f"\n  Analyzing {user_name}'s personality so far...")
    prediction = predict_personality(qa_history)
    print(f"\n  Personality read: {prediction}\n")

    # Phase 2: 5 adaptive niche questions, each one deeper
    niche_questions = []
    niche_answers = []
    for i in range(6, 11):
        q = generate_next_question(qa_history, i)
        niche_questions.append(q)

        answer = input(f"  Q{i}: {q}\n  > ").strip()
        if not answer:
            answer = "I'm not sure."
        niche_answers.append(answer)
        qa_history.append((q, answer))

    # Final personality prediction with all 10 answers
    print(f"\n  Final personality analysis for {user_name}...")
    final_prediction = predict_personality(qa_history)
    print(f"\n  Final read: {final_prediction}\n")

    all_questions = GLOBAL_QUESTIONS + niche_questions
    all_answers = [a for _, a in qa_history[:5]] + niche_answers
    return all_questions, all_answers


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

    print("Loading trained compression model...")
    model, _ = load_checkpoint("compression_model.pt", device=device)
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
        print("  You two are highly compatible!")
    elif pct >= 60:
        print("  You two have solid common ground.")
    elif pct >= 40:
        print("  You two have some differences but potential overlap.")
    else:
        print("  You two are quite different — opposites attract?")


if __name__ == "__main__":
    main()
