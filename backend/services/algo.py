"""
Algorithm service for text similarity and confidence scoring.

This module implements TF-IDF based cosine similarity calculation to determine
how relevant a description is to a given search term. It includes:

- Text tokenization (simple whitespace-based)
- Term Frequency (TF) calculation
- Inverse Document Frequency (IDF) calculation
- TF-IDF vector computation
- Cosine similarity calculation
- Confidence scoring with term overlap weighting

Example usage:
    from services.algo import confidence_score
    
    score = confidence_score("mars trench", "Snow White Trench on Mars")
    # Returns a score between 0.0 and 1.0
"""

from typing import Dict, List, Set
import math


def tokenize(text: str) -> List[str]:
    """Simple tokenizer: lowercase and split by whitespace."""
    return text.lower().split()


def calculate_tf(tokens: List[str]) -> Dict[str, float]:
    """Calculate term frequency for a list of tokens."""
    tf = {}
    total_tokens = len(tokens)
    
    if total_tokens == 0:
        return tf
    
    for token in tokens:
        tf[token] = tf.get(token, 0) + 1
    
    # Normalize by total number of tokens
    for token in tf:
        tf[token] = tf[token] / total_tokens
    
    return tf


def calculate_idf(documents_tokens: List[List[str]]) -> Dict[str, float]:
    """Calculate inverse document frequency for all unique tokens across documents."""
    idf = {}
    total_documents = len(documents_tokens)
    
    if total_documents == 0:
        return idf
    
    # Get all unique tokens across all documents
    all_tokens: Set[str] = set()
    for doc_tokens in documents_tokens:
        all_tokens.update(doc_tokens)
    
    # Calculate IDF for each token
    for token in all_tokens:
        # Count how many documents contain this token
        docs_with_token = sum(1 for doc_tokens in documents_tokens if token in doc_tokens)
        
        # IDF = log(total_documents / docs_with_token)
        # Add 1 to avoid division by zero
        idf[token] = math.log(total_documents / (docs_with_token + 1))
    
    return idf


def calculate_tf_idf(tokens: List[str], idf: Dict[str, float]) -> Dict[str, float]:
    """Calculate TF-IDF vector for a document."""
    tf = calculate_tf(tokens)
    tf_idf = {}
    
    for token, tf_value in tf.items():
        idf_value = idf.get(token, 0)
        tf_idf[token] = tf_value * idf_value
    
    return tf_idf


def cosine_similarity(vector1: Dict[str, float], vector2: Dict[str, float]) -> float:
    """Calculate cosine similarity between two TF-IDF vectors."""
    # Get all unique terms from both vectors
    all_terms = set(vector1.keys()) | set(vector2.keys())
    
    if not all_terms:
        return 0.0
    
    # Calculate dot product
    dot_product = 0.0
    for term in all_terms:
        v1_val = vector1.get(term, 0.0)
        v2_val = vector2.get(term, 0.0)
        dot_product += v1_val * v2_val
    
    # Calculate magnitudes
    magnitude1 = math.sqrt(sum(val ** 2 for val in vector1.values()))
    magnitude2 = math.sqrt(sum(val ** 2 for val in vector2.values()))
    
    # Avoid division by zero
    if magnitude1 == 0.0 or magnitude2 == 0.0:
        return 0.0
    
    # Cosine similarity = dot_product / (magnitude1 * magnitude2)
    similarity = dot_product / (magnitude1 * magnitude2)
    
    # Ensure result is between 0 and 1
    return max(0.0, min(1.0, similarity))


def confidence_score_tfidf(search_term: str, description: str) -> float:
    """
    Alternative implementation using true TF-IDF cosine similarity.
    This can be used when you have a larger corpus for better IDF calculation.
    """
    # Handle empty inputs
    if not search_term.strip() or not description.strip():
        return 0.0
    
    # Tokenize both texts
    search_tokens = tokenize(search_term)
    description_tokens = tokenize(description)
    
    if not search_tokens or not description_tokens:
        return 0.0
    
    # Create a corpus with both documents for IDF calculation
    corpus = [search_tokens, description_tokens]
    
    # Calculate IDF for the corpus
    idf = calculate_idf(corpus)
    
    # Calculate TF-IDF vectors for both texts
    search_tf_idf = calculate_tf_idf(search_tokens, idf)
    description_tf_idf = calculate_tf_idf(description_tokens, idf)
    
    # Calculate cosine similarity
    similarity = cosine_similarity(search_tf_idf, description_tf_idf)
    
    return similarity


def confidence_score(search_term: str, description: str) -> float:
    """
    Calculate confidence score between search term and description using TF-IDF cosine similarity.
    
    Args:
        search_term: A short search query string
        description: A longer text or metadata string
    
    Returns:
        A confidence score between 0.0 and 1.0
    """
    # Handle empty inputs
    if not search_term.strip() or not description.strip():
        return 0.0
    
    # Tokenize both texts
    search_tokens = tokenize(search_term)
    description_tokens = tokenize(description)
    
    if not search_tokens or not description_tokens:
        return 0.0
    
    # For better discrimination, let's use a simpler approach:
    # Calculate overlap ratio with term frequency weighting
    
    # Get term frequencies
    search_tf = calculate_tf(search_tokens)
    description_tf = calculate_tf(description_tokens)
    
    # Calculate weighted overlap
    common_terms = set(search_tf.keys()) & set(description_tf.keys())
    
    if not common_terms:
        return 0.0
    
    # Calculate weighted similarity based on term importance
    search_weight = 0.0
    overlap_weight = 0.0
    
    for term in search_tf:
        search_weight += search_tf[term]
        if term in description_tf:
            # Weight by geometric mean of frequencies
            overlap_weight += math.sqrt(search_tf[term] * description_tf[term])
    
    if search_weight == 0.0:
        return 0.0
    
    # Base similarity on overlap ratio
    base_similarity = overlap_weight / search_weight
    
    # Apply length penalty for very short descriptions
    description_length = len(description_tokens)
    search_length = len(search_tokens)
    
    # Bonus for having good coverage of search terms
    coverage_ratio = len(common_terms) / len(search_tokens)
    
    # Final score combines base similarity with coverage
    final_score = base_similarity * (0.7 + 0.3 * coverage_ratio)
    
    return max(0.0, min(1.0, final_score))
