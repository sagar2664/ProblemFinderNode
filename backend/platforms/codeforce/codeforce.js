const path = require('path');
const { loadPlatformData, checkPlatformData } = require('../../utils/storage');
const { readProblemData } = require('../../utils/csv');
const { cosineSimilarityMatrix, getTopSimilar } = require('../../utils/similarity');

class CodeforceModule {
    constructor() {
        this.platformPath = path.join(__dirname, 'preprocess');
        this.vectorizer = null;
        this.tfidfMatrix = null;
        this.problemNames = null;
        this.problemUrls = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            console.log('Initializing Codeforces module...');
            
            // Check if required files exist
            const dataStatus = await checkPlatformData(this.platformPath);
            if (!dataStatus.allReady) {
                console.warn('Codeforces data not ready. Missing files:', {
                    vectorizer: !dataStatus.vectorizer,
                    matrix: !dataStatus.matrix,
                    csv: !dataStatus.csv
                });
                throw new Error('Codeforces preprocessed data not found. Please run preprocessing first.');
            }

            // Load vectorizer and matrix
            const { vectorizer, matrix } = await loadPlatformData(this.platformPath);
            this.vectorizer = vectorizer;
            this.tfidfMatrix = matrix;

            // Load problem data
            const csvPath = path.join(this.platformPath, 'problem.csv');
            const problemData = await readProblemData(csvPath);
            this.problemNames = problemData.names;
            this.problemUrls = problemData.urls;

            this.initialized = true;
            console.log(`Codeforces module initialized with ${this.problemNames.length} problems`);
        } catch (error) {
            console.error('Error initializing Codeforces module:', error.message);
            throw error;
        }
    }

    async query(queryText, threshold = 0.01) {
        try {
            // Initialize if not already done
            if (!this.initialized) {
                await this.initialize();
            }

            if (!queryText || typeof queryText !== 'string') {
                return [];
            }

            console.log(`Codeforces query: "${queryText}"`);

            // Check if matrix is properly loaded (not the fallback empty matrix)
            if (this.tfidfMatrix.rows <= 1 && this.tfidfMatrix.columns <= 1) {
                console.warn('Codeforces: TF-IDF matrix not available (file too large). Using simple text matching as fallback.');
                return this.fallbackSearch(queryText, threshold);
            }

            // Transform query using the trained vectorizer
            const queryVector = this.vectorizer.transform([queryText.toLowerCase()]);
            
            // Calculate similarities with all problems
            const similarities = cosineSimilarityMatrix(this.tfidfMatrix, queryVector);
            
            // Get top similar problems
            const topResults = getTopSimilar(similarities, -1, threshold);
            
            // Format results
            const results = topResults.map(result => ({
                name: this.problemNames[result.index],
                url: this.problemUrls[result.index],
                score: Math.round(result.score * 1000) / 1000 // Round to 3 decimal places
            }));

            console.log(`Codeforces found ${results.length} matching problems`);
            return results;

        } catch (error) {
            console.error('Error in Codeforces query:', error.message);
            return [];
        }
    }

    // Fallback search using simple text matching when TF-IDF is not available
    fallbackSearch(queryText, threshold = 0.01) {
        try {
            console.log('Using fallback text search for Codeforces...');
            
            if (!this.problemNames || this.problemNames.length === 0) {
                return [];
            }

            const query = queryText.toLowerCase();
            const queryTerms = query.split(/\s+/).filter(term => term.length > 2);
            
            const results = [];
            
            for (let i = 0; i < this.problemNames.length; i++) {
                const problemName = this.problemNames[i].toLowerCase();
                let score = 0;
                
                // Simple scoring based on term matches
                queryTerms.forEach(term => {
                    if (problemName.includes(term)) {
                        score += 0.5;
                    }
                    // Check for partial matches
                    if (problemName.includes(term.substring(0, Math.max(3, term.length - 2)))) {
                        score += 0.2;
                    }
                });
                
                // Normalize score
                score = score / queryTerms.length;
                
                if (score >= threshold) {
                    results.push({
                        name: this.problemNames[i],
                        url: this.problemUrls[i],
                        score: Math.round(score * 1000) / 1000,
                        index: i
                    });
                }
            }
            
            // Sort by score descending
            results.sort((a, b) => b.score - a.score);
            
            // Limit results to top 50 for performance
            const limitedResults = results.slice(0, 50);
            
            console.log(`Fallback search found ${limitedResults.length} matches for "${queryText}"`);
            return limitedResults;
            
        } catch (error) {
            console.error('Error in fallback search:', error.message);
            return [];
        }
    }

    // Get module status and statistics
    async getStatus() {
        try {
            const dataStatus = await checkPlatformData(this.platformPath);
            return {
                platform: 'Codeforces',
                initialized: this.initialized,
                dataReady: dataStatus.allReady,
                problemCount: this.problemNames ? this.problemNames.length : 0,
                vocabularySize: this.vectorizer ? this.vectorizer.vocabulary.size : 0
            };
        } catch (error) {
            return {
                platform: 'Codeforces',
                initialized: false,
                error: error.message
            };
        }
    }
}

// Create singleton instance
const codeforceModule = new CodeforceModule();

module.exports = {
    query: (queryText, threshold) => codeforceModule.query(queryText, threshold),
    getStatus: () => codeforceModule.getStatus(),
    initialize: () => codeforceModule.initialize()
};
