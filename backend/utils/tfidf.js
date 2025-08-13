const natural = require('natural');
const { Matrix } = require('ml-matrix');
const stopword = require('stopword');

class TFIDFVectorizer {
    constructor() {
        this.vocabulary = new Map();
        this.idf = new Map();
        this.documents = [];
        this.fitted = false;
    }

    // Preprocess text: lowercase, tokenize, remove stopwords
    preprocessText(text) {
        if (!text || typeof text !== 'string') return [];
        
        // Convert to lowercase and tokenize
        const tokenizer = new natural.WordTokenizer();
        const tokens = tokenizer.tokenize(text.toLowerCase());
        if (!tokens) return [];
        
        // Remove stopwords and non-alphabetic tokens
        const filtered = tokens.filter(token => 
            /^[a-zA-Z]+$/.test(token) && 
            token.length > 1 &&
            !(stopword.eng && stopword.eng.includes(token))
        );
        
        return filtered;
    }

    // Build vocabulary from documents
    buildVocabulary(documents) {
        const vocabSet = new Set();
        
        documents.forEach(doc => {
            const tokens = this.preprocessText(doc);
            tokens.forEach(token => vocabSet.add(token));
        });
        
        // Convert set to map with indices
        let index = 0;
        vocabSet.forEach(token => {
            this.vocabulary.set(token, index++);
        });
        
        return this.vocabulary;
    }

    // Calculate term frequency for a document
    calculateTF(tokens) {
        const tf = new Map();
        const totalTokens = tokens.length;
        
        tokens.forEach(token => {
            tf.set(token, (tf.get(token) || 0) + 1);
        });
        
        // Normalize by document length
        tf.forEach((count, token) => {
            tf.set(token, count / totalTokens);
        });
        
        return tf;
    }

    // Calculate inverse document frequency
    calculateIDF(documents) {
        const docCount = documents.length;
        const termDocCount = new Map();
        
        // Count documents containing each term
        documents.forEach(doc => {
            const tokens = this.preprocessText(doc);
            const uniqueTokens = new Set(tokens);
            
            uniqueTokens.forEach(token => {
                termDocCount.set(token, (termDocCount.get(token) || 0) + 1);
            });
        });
        
        // Calculate IDF for each term
        this.vocabulary.forEach((index, token) => {
            const docFreq = termDocCount.get(token) || 0;
            if (docFreq > 0) {
                this.idf.set(token, Math.log(docCount / docFreq));
            } else {
                this.idf.set(token, 0);
            }
        });
        
        return this.idf;
    }

    // Convert document to TF-IDF vector
    documentToVector(doc) {
        const tokens = this.preprocessText(doc);
        const tf = this.calculateTF(tokens);
        const vector = new Array(this.vocabulary.size).fill(0);
        
        tf.forEach((tfValue, token) => {
            const vocabIndex = this.vocabulary.get(token);
            const idfValue = this.idf.get(token) || 0;
            
            if (vocabIndex !== undefined) {
                vector[vocabIndex] = tfValue * idfValue;
            }
        });
        
        return vector;
    }

    // Fit the vectorizer to documents
    fit(documents) {
        this.documents = documents;
        this.buildVocabulary(documents);
        this.calculateIDF(documents);
        this.fitted = true;
        return this;
    }

    // Transform documents to TF-IDF matrix
    transform(documents) {
        if (!this.fitted) {
            throw new Error('Vectorizer must be fitted before transform');
        }
        
        const vectors = documents.map(doc => this.documentToVector(doc));
        return new Matrix(vectors);
    }

    // Fit and transform in one step
    fitTransform(documents) {
        this.fit(documents);
        return this.transform(documents);
    }

    // Get feature names (vocabulary)
    getFeatureNames() {
        return Array.from(this.vocabulary.keys());
    }

    // Serialize vectorizer for saving
    serialize() {
        return {
            vocabulary: Array.from(this.vocabulary.entries()),
            idf: Array.from(this.idf.entries()),
            fitted: this.fitted
        };
    }

    // Deserialize vectorizer from saved data
    static deserialize(data) {
        const vectorizer = new TFIDFVectorizer();
        vectorizer.vocabulary = new Map(data.vocabulary);
        vectorizer.idf = new Map(data.idf);
        vectorizer.fitted = data.fitted;
        return vectorizer;
    }
}

module.exports = TFIDFVectorizer;
