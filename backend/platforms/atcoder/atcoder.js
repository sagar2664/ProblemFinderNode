const path = require('path');
const { loadPlatformData, checkPlatformData } = require('../../utils/storage');
const { readProblemData } = require('../../utils/csv');
const { cosineSimilarityMatrix, getTopSimilar } = require('../../utils/similarity');

class AtCoderModule {
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
            console.log('Initializing AtCoder module...');
            
            // Check if required files exist
            const dataStatus = await checkPlatformData(this.platformPath);
            if (!dataStatus.allReady) {
                console.warn('AtCoder data not ready. Missing files:', {
                    vectorizer: !dataStatus.vectorizer,
                    matrix: !dataStatus.matrix,
                    csv: !dataStatus.csv
                });
                throw new Error('AtCoder preprocessed data not found. Please run preprocessing first.');
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
            console.log(`AtCoder module initialized with ${this.problemNames.length} problems`);
        } catch (error) {
            console.error('Error initializing AtCoder module:', error.message);
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

            console.log(`AtCoder query: "${queryText}"`);

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

            console.log(`AtCoder found ${results.length} matching problems`);
            return results;

        } catch (error) {
            console.error('Error in AtCoder query:', error.message);
            return [];
        }
    }

    // Get module status and statistics
    async getStatus() {
        try {
            const dataStatus = await checkPlatformData(this.platformPath);
            return {
                platform: 'AtCoder',
                initialized: this.initialized,
                dataReady: dataStatus.allReady,
                problemCount: this.problemNames ? this.problemNames.length : 0,
                vocabularySize: this.vectorizer ? this.vectorizer.vocabulary.size : 0
            };
        } catch (error) {
            return {
                platform: 'AtCoder',
                initialized: false,
                error: error.message
            };
        }
    }
}

// Create singleton instance
const atCoderModule = new AtCoderModule();

module.exports = {
    query: (queryText, threshold) => atCoderModule.query(queryText, threshold),
    getStatus: () => atCoderModule.getStatus(),
    initialize: () => atCoderModule.initialize()
};
