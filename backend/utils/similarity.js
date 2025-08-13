const { Matrix } = require('ml-matrix');

/**
 * Calculate cosine similarity between two vectors
 * @param {Array|Matrix} vectorA - First vector
 * @param {Array|Matrix} vectorB - Second vector
 * @returns {number} - Cosine similarity score between -1 and 1
 */
function cosineSimilarity(vectorA, vectorB) {
    // Convert to arrays if they're Matrix objects
    const a = Array.isArray(vectorA) ? vectorA : vectorA.to1DArray();
    const b = Array.isArray(vectorB) ? vectorB : vectorB.to1DArray();
    
    if (a.length !== b.length) {
        throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) {
        return 0;
    }
    
    return dotProduct / (normA * normB);
}

/**
 * Calculate cosine similarity between a query vector and a matrix of document vectors
 * @param {Matrix} tfidfMatrix - Matrix where each row is a document vector
 * @param {Array|Matrix} queryVector - Query vector to compare against
 * @returns {Array} - Array of similarity scores
 */
function cosineSimilarityMatrix(tfidfMatrix, queryVector) {
    const query = Array.isArray(queryVector) ? queryVector : queryVector.getRow(0);
    const similarities = [];
    
    for (let i = 0; i < tfidfMatrix.rows; i++) {
        const docVector = tfidfMatrix.getRow(i);
        const similarity = cosineSimilarity(docVector, query);
        similarities.push(similarity);
    }
    
    return similarities;
}

/**
 * Calculate pairwise cosine similarities between all documents in a matrix
 * @param {Matrix} tfidfMatrix - Matrix where each row is a document vector
 * @returns {Matrix} - Similarity matrix
 */
function pairwiseCosineSimilarity(tfidfMatrix) {
    const numDocs = tfidfMatrix.rows;
    const similarityMatrix = new Matrix(numDocs, numDocs);
    
    for (let i = 0; i < numDocs; i++) {
        for (let j = 0; j < numDocs; j++) {
            if (i === j) {
                similarityMatrix.set(i, j, 1.0);
            } else {
                const vectorA = tfidfMatrix.getRow(i);
                const vectorB = tfidfMatrix.getRow(j);
                const similarity = cosineSimilarity(vectorA, vectorB);
                similarityMatrix.set(i, j, similarity);
            }
        }
    }
    
    return similarityMatrix;
}

/**
 * Get top K most similar documents for a query
 * @param {Array} similarities - Array of similarity scores
 * @param {number} k - Number of top results to return (default: -1 for all)
 * @param {number} threshold - Minimum similarity threshold (default: 0.01)
 * @returns {Array} - Array of {index, score} objects sorted by score
 */
function getTopSimilar(similarities, k = -1, threshold = 0.01) {
    const results = similarities
        .map((score, index) => ({ index, score }))
        .filter(item => item.score >= threshold)
        .sort((a, b) => b.score - a.score);
    
    if (k > 0 && k < results.length) {
        return results.slice(0, k);
    }
    
    return results;
}

/**
 * Normalize a vector to unit length
 * @param {Array} vector - Input vector
 * @returns {Array} - Normalized vector
 */
function normalizeVector(vector) {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    
    if (norm === 0) {
        return vector.slice(); // Return copy of zero vector
    }
    
    return vector.map(val => val / norm);
}

/**
 * Calculate Euclidean distance between two vectors
 * @param {Array} vectorA - First vector
 * @param {Array} vectorB - Second vector
 * @returns {number} - Euclidean distance
 */
function euclideanDistance(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
        throw new Error('Vectors must have the same length');
    }
    
    let sum = 0;
    for (let i = 0; i < vectorA.length; i++) {
        const diff = vectorA[i] - vectorB[i];
        sum += diff * diff;
    }
    
    return Math.sqrt(sum);
}

/**
 * Calculate Manhattan distance between two vectors
 * @param {Array} vectorA - First vector
 * @param {Array} vectorB - Second vector
 * @returns {number} - Manhattan distance
 */
function manhattanDistance(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
        throw new Error('Vectors must have the same length');
    }
    
    let sum = 0;
    for (let i = 0; i < vectorA.length; i++) {
        sum += Math.abs(vectorA[i] - vectorB[i]);
    }
    
    return sum;
}

module.exports = {
    cosineSimilarity,
    cosineSimilarityMatrix,
    pairwiseCosineSimilarity,
    getTopSimilar,
    normalizeVector,
    euclideanDistance,
    manhattanDistance
};
