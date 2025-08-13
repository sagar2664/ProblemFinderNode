const express = require('express');
const cors = require('cors');
const path = require('path');

// Import platform modules
const codeforceModule = require('./platforms/codeforce/codeforce');
const leetcodeModule = require('./platforms/leetcode/leetcode');
const atcoderModule = require('./platforms/atcoder/atcoder');
const dmojModule = require('./platforms/dmoj/dmoj');

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["*"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint - search across all platforms
app.get('/', async (req, res) => {
    try {
        const { q = '', n = -1 } = req.query;
        
        if (!q) {
            return res.json({ message: "Please provide a query." });
        }

        // Query all platforms in parallel
        const [cfQuestions, lcQuestions, atQuestions, dmojQuestions] = await Promise.all([
            codeforceModule.query(q),
            leetcodeModule.query(q),
            atcoderModule.query(q),
            dmojModule.query(q)
        ]);

        // Combine and sort results by score
        const totalQuestions = [...cfQuestions, ...lcQuestions, ...atQuestions, ...dmojQuestions];
        totalQuestions.sort((a, b) => b.score - a.score);

        // Apply limit if specified
        const limit = parseInt(n);
        if (limit > 0 && limit < totalQuestions.length) {
            return res.json(totalQuestions.slice(0, limit));
        }

        res.json(totalQuestions);
    } catch (error) {
        console.error('Error in root endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Codeforces endpoint
app.get('/codeforce/', async (req, res) => {
    try {
        const { q = '', n = -1 } = req.query;
        
        if (!q) {
            return res.json({ message: "Please provide a query." });
        }

        const results = await codeforceModule.query(q);
        const limit = parseInt(n);
        
        if (limit > 0 && limit < results.length) {
            return res.json(results.slice(0, limit));
        }

        res.json(results);
    } catch (error) {
        console.error('Error in codeforce endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// LeetCode endpoint
app.get('/leetcode/', async (req, res) => {
    try {
        const { q = '', n = -1 } = req.query;
        
        if (!q) {
            return res.json({ message: "Please provide a query." });
        }

        const results = await leetcodeModule.query(q);
        const limit = parseInt(n);
        
        if (limit > 0 && limit < results.length) {
            return res.json(results.slice(0, limit));
        }

        res.json(results);
    } catch (error) {
        console.error('Error in leetcode endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// AtCoder endpoint
app.get('/atcoder/', async (req, res) => {
    try {
        const { q = '', n = -1 } = req.query;
        
        if (!q) {
            return res.json({ message: "Please provide a query." });
        }

        const results = await atcoderModule.query(q);
        const limit = parseInt(n);
        
        if (limit > 0 && limit < results.length) {
            return res.json(results.slice(0, limit));
        }

        res.json(results);
    } catch (error) {
        console.error('Error in atcoder endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DMOJ endpoint
app.get('/dmoj/', async (req, res) => {
    try {
        const { q = '', n = -1 } = req.query;
        
        if (!q) {
            return res.json({ message: "Please provide a query." });
        }

        const results = await dmojModule.query(q);
        const limit = parseInt(n);
        
        if (limit > 0 && limit < results.length) {
            return res.json(results.slice(0, limit));
        }

        res.json(results);
    } catch (error) {
        console.error('Error in dmoj endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`Problem Finder API (Node.js) running on port ${PORT}`);
    console.log(`Available endpoints:`);
    console.log(`  GET /              - Search all platforms`);
    console.log(`  GET /codeforce/    - Search Codeforces only`);
    console.log(`  GET /leetcode/     - Search LeetCode only`);
    console.log(`  GET /atcoder/      - Search AtCoder only`);
    console.log(`  GET /dmoj/         - Search DMOJ only`);
    console.log(`  GET /health        - Health check`);
});

module.exports = app;
