const { readProblemData } = require('../../../utils/csv');
const { savePlatformData } = require('../../../utils/storage');
const TFIDFVectorizer = require('../../../utils/tfidf');
const path = require('path');

/**
 * Create document corpus from problem names and texts
 * @param {Array} names - Array of problem names
 * @param {Array} texts - Array of problem texts
 * @returns {Array} - Array of combined documents
 */
function createDocumentCorpus(names, texts) {
    console.log('Creating document corpus...');
    
    const documents = [];
    
    for (let i = 0; i < names.length; i++) {
        // Weight problem names 4x by repeating them 4 times
        const name = names[i] || '';
        const text = texts[i] || '';
        
        const weightedName = Array(4).fill(name + ' ').join('');
        const document = weightedName + text.toLowerCase();
        
        documents.push(document);
        
        // Log progress every 100 documents
        if ((i + 1) % 100 === 0) {
            console.log(`Processed ${i + 1}/${names.length} documents`);
        }
    }
    
    console.log(`Document corpus created with ${documents.length} documents`);
    return documents;
}

/**
 * Train TF-IDF vectorizer and create similarity matrix
 * @param {string} csvPath - Path to problem CSV file
 * @param {string} outputDir - Directory to save vectorizer and matrix
 * @returns {Promise<Object>} - Training result with statistics
 */
async function trainTFIDF(csvPath, outputDir) {
    try {
        console.log(`Training TF-IDF for Codeforces from: ${csvPath}`);
        
        // Read problem data
        const problemData = await readProblemData(csvPath);
        const { names, texts, length } = problemData;
        
        console.log(`Loaded ${length} problems`);
        
        if (length === 0) {
            throw new Error('No problems found in the CSV file');
        }
        
        // Create document corpus
        const documents = createDocumentCorpus(names, texts);
        
        // Initialize and train TF-IDF vectorizer
        console.log('Training TF-IDF vectorizer...');
        const vectorizer = new TFIDFVectorizer();
        
        // Fit and transform documents
        const tfidfMatrix = vectorizer.fitTransform(documents);
        
        console.log(`TF-IDF matrix created: ${tfidfMatrix.rows} x ${tfidfMatrix.columns}`);
        console.log(`Vocabulary size: ${vectorizer.vocabulary.size}`);
        
        // Save vectorizer and matrix
        console.log('Saving vectorizer and matrix...');
        await savePlatformData(outputDir, vectorizer, tfidfMatrix);
        
        const stats = {
            problemCount: length,
            vocabularySize: vectorizer.vocabulary.size,
            matrixRows: tfidfMatrix.rows,
            matrixColumns: tfidfMatrix.columns,
            documentsProcessed: documents.length
        };
        
        console.log('TF-IDF training completed successfully');
        console.log('Training statistics:', stats);
        
        return {
            success: true,
            stats: stats,
            outputDir: outputDir
        };
        
    } catch (error) {
        console.error('Error training TF-IDF:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get vocabulary statistics from trained vectorizer
 * @param {TFIDFVectorizer} vectorizer - Trained vectorizer
 * @returns {Object} - Vocabulary statistics
 */
function getVocabularyStats(vectorizer) {
    if (!vectorizer || !vectorizer.vocabulary) {
        return { error: 'Vectorizer not available' };
    }
    
    const vocab = Array.from(vectorizer.vocabulary.keys());
    const idfValues = Array.from(vectorizer.idf.values());
    
    return {
        totalTerms: vocab.length,
        averageIDF: idfValues.reduce((sum, val) => sum + val, 0) / idfValues.length,
        maxIDF: Math.max(...idfValues),
        minIDF: Math.min(...idfValues),
        sampleTerms: vocab.slice(0, 10) // First 10 terms as sample
    };
}

/**
 * Test query with trained TF-IDF
 * @param {string} query - Test query string
 * @param {TFIDFVectorizer} vectorizer - Trained vectorizer
 * @param {Matrix} tfidfMatrix - TF-IDF matrix
 * @param {Array} problemNames - Array of problem names
 * @returns {Array} - Top matching problems
 */
function testQuery(query, vectorizer, tfidfMatrix, problemNames) {
    try {
        const { cosineSimilarityMatrix, getTopSimilar } = require('../../../utils/similarity');
        
        console.log(`Testing query: "${query}"`);
        
        // Transform query
        const queryVector = vectorizer.transform([query.toLowerCase()]);
        
        // Calculate similarities
        const similarities = cosineSimilarityMatrix(tfidfMatrix, queryVector);
        
        // Get top results
        const topResults = getTopSimilar(similarities, 5, 0.01);
        
        const results = topResults.map(result => ({
            name: problemNames[result.index],
            score: Math.round(result.score * 1000) / 1000
        }));
        
        console.log('Top results:', results);
        return results;
        
    } catch (error) {
        console.error('Error testing query:', error.message);
        return [];
    }
}

// Export functions
module.exports = {
    createDocumentCorpus,
    trainTFIDF,
    getVocabularyStats,
    testQuery
};

// Run if called directly
if (require.main === module) {
    const csvPath = path.join(__dirname, 'problem.csv');
    const outputDir = __dirname;
    
    trainTFIDF(csvPath, outputDir)
        .then(result => {
            if (result.success) {
                console.log('\nTF-IDF training completed successfully!');
                console.log('Statistics:', result.stats);
                console.log(`Output saved to: ${result.outputDir}`);
                
                // Test with a sample query
                // Note: This would require loading the saved data in a real scenario
                console.log('\nTesting completed. Use query.js to test queries.');
            } else {
                console.error('\nTF-IDF training failed:', result.error);
            }
        })
        .catch(error => {
            console.error('Unexpected error:', error);
        });
}
