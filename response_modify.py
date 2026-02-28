from sentence_transformers import SentenceTransformer
import numpy as np

# Load a pretrained model once (do this at startup)
model = SentenceTransformer("all-MiniLM-L6-v2")

def sentence_to_vector(sentence: str) -> np.ndarray:
    """
    Convert a sentence into a dense vector embedding.
    """
    embedding = model.encode(sentence)
    return embedding  # shape: (384,)

# Example usage
# if __name__ == "__main__":
#     s = "I like integrals."
#     vec = sentence_to_vector(s)
#     print("Vector shape:", vec.shape)
#     print("First 5 values:", vec[:5])

def to_matrix(strings: list[str]) -> np.ndarray:
    """
    Convert a list of strings into a matrix of vectors.
    Each row corresponds to one string.
    """
    vectors = [sentence_to_vector(s) for s in strings]
    return np.vstack(vectors)

if __name__ == "__main__":
    responses = [
        "Response 1",
        "Response 2",
        "Response 3",
        "Response 4",
        "Response 5",
        "Response 6",
        "Response 7",
        "Response 8",
        "Response 9",
        "Response 10",
    ]
    
    questions = [
        "Question 1",
        "Question 2",
        "Question 3",
        "Question 4",
        "Question 5",
        "Question 6",
        "Question 7",
        "Question 8",
        "Question 9",
        "Question 10",
    ]
    responses_matrix = to_matrix(responses)
    questions_matrix = to_matrix(questions)
    print("Responses: Number of vectors (rows):", len(responses_matrix))        # 10
    print("Responses: Vector length (columns):", len(responses_matrix[0]))      # 256 by default
    print("Questions: Number of vectors (rows):", len(questions_matrix))        # 10
    print("Questions: Vector length (columns):", len(questions_matrix[0]))      # 256 by default