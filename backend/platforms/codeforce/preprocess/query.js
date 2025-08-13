const { loadPlatformData } = require('../../../utils/storage');
const { readProblemData } = require('../../../utils/csv');
const { cosineSimilarityMatrix, getTopSimilar } = require('../../../utils/similarity');
const path = require('path');

/**
 * Test queries against trained TF-IDF model
 * @param {string} query - Query string to test
 * @param {number} topK - Number of top results to return
 * @param {number} threshold - Minimum similarity threshold
 * @returns {Promise<Array>} - Array of matching problems
 */
async function testQuery(query, topK = 10, threshold = 0.01) {
    try {
        console.log(`Testing query: "${query}"`);
        
        const platformPath = __dirname;
        
        // Load vectorizer and matrix
        console.log('Loading trained model...');
        const { vectorizer, matrix } = await loadPlatformData(platformPath);
        
        // Load problem data
        const csvPath = path.join(platformPath, 'problem.csv');
        const problemData = await readProblemData(csvPath);
        
        console.log(`Model loaded. Vocabulary size: ${vectorizer.vocabulary.size}`);
        console.log(`Matrix dimensions: ${matrix.rows} x ${matrix.columns}`);
        console.log(`Problem count: ${problemData.names.length}`);
        
        // Transform query
        const queryVector = vectorizer.transform([query.toLowerCase()]);
        
        // Calculate similarities
        const similarities = cosineSimilarityMatrix(matrix, queryVector);
        
        // Get top results
        const topResults = getTopSimilar(similarities, topK, threshold);
        
        // Format results
        const results = topResults.map(result => ({
            name: problemData.names[result.index],
            url: problemData.urls[result.index],
            score: Math.round(result.score * 1000) / 1000
        }));
        
        console.log(`Found ${results.length} matching problems:`);
        results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.name} (Score: ${result.score})`);
            console.log(`   URL: ${result.url}`);
        });
        
        return results;
        
    } catch (error) {
        console.error('Error testing query:', error.message);
        return [];
    }
}

/**
 * Test multiple queries and compare results
 * @param {Array} queries - Array of query strings
 * @param {number} topK - Number of top results per query
 * @returns {Promise<Object>} - Results for all queries
 */
async function testMultipleQueries(queries, topK = 5) {
    console.log(`Testing ${queries.length} queries...\n`);
    
    const allResults = {};
    
    for (const query of queries) {
        console.log(`\n${'='.repeat(50)}`);
        const results = await testQuery(query, topK);
        allResults[query] = results;
        
        // Add delay between queries
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return allResults;
}

/**
 * Analyze query performance and statistics
 * @param {string} query - Query to analyze
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeQuery(query) {
    try {
        console.log(`Analyzing query: "${query}"`);
        
        const platformPath = __dirname;
        
        // Load model
        const { vectorizer, matrix } = await loadPlatformData(platformPath);
        
        // Transform query
        const queryVector = vectorizer.transform([query.toLowerCase()]);
        const queryArray = queryVector.getRow(0);
        
        // Calculate similarities
        const similarities = cosineSimilarityMatrix(matrix, queryVector);
        
        // Analyze results
        const analysis = {
            query: query,
            queryTerms: vectorizer.preprocessText(query),
            nonZeroFeatures: queryArray.filter(val => val > 0).length,
            totalFeatures: queryArray.length,
            maxSimilarity: Math.max(...similarities),
            minSimilarity: Math.min(...similarities),
            avgSimilarity: similarities.reduce((sum, val) => sum + val, 0) / similarities.length,
            aboveThreshold: similarities.filter(sim => sim >= 0.01).length,
            significantMatches: similarities.filter(sim => sim >= 0.1).length
        };
        
        console.log('Query Analysis:');
        console.log(`  Query terms: ${analysis.queryTerms.join(', ')}`);
        console.log(`  Non-zero features: ${analysis.nonZeroFeatures}/${analysis.totalFeatures}`);
        console.log(`  Max similarity: ${analysis.maxSimilarity.toFixed(4)}`);
        console.log(`  Avg similarity: ${analysis.avgSimilarity.toFixed(4)}`);
        console.log(`  Above threshold (0.01): ${analysis.aboveThreshold}`);
        console.log(`  Significant matches (0.1+): ${analysis.significantMatches}`);
        
        return analysis;
        
    } catch (error) {
        console.error('Error analyzing query:', error.message);
        return null;
    }
}

/**
 * Interactive query testing
 */
async function interactiveQuery() {
    const readline = require('readline');
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    console.log('Interactive Query Testing for Codeforces');
    console.log('Type your queries (or "exit" to quit):');
    
    const askQuery = () => {
        rl.question('\nEnter query: ', async (query) => {
            if (query.toLowerCase() === 'exit') {
                rl.close();
                return;
            }
            
            if (query.trim()) {
                await testQuery(query.trim(), 5);
            }
            
            askQuery();
        });
    };
    
    askQuery();
}

// Export functions
module.exports = {
    testQuery,
    testMultipleQueries,
    analyzeQuery,
    interactiveQuery
};

// Run if called directly
if (require.main === module) {
    // Test with predefined queries
    const testQueries = [
        'tree and graph',
        'dynamic programming',
        'binary search',
        'shortest path',
        'sorting algorithm'
    ];
    
    // Check if arguments are provided
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        if (args[0] === 'interactive') {
            interactiveQuery();
        } else {
            // Test single query from command line
            const query = args.join(' ');
            testQuery(query, 10)
                .then(results => {
                    console.log(`\nQuery completed. Found ${results.length} results.`);
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        }
    } else {
        // Test multiple predefined queries
        testMultipleQueries(testQueries)
            .then(allResults => {
                console.log('\n' + '='.repeat(50));
                console.log('All queries completed successfully!');
                
                Object.keys(allResults).forEach(query => {
                    console.log(`"${query}": ${allResults[query].length} results`);
                });
            })
            .catch(error => {
                console.error('Error in batch testing:', error);
            });
    }
}
