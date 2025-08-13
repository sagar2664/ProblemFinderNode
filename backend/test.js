/**
 * Simple test script to verify the Node.js Problem Finder API setup
 */

const TFIDFVectorizer = require('./utils/tfidf');
const { cosineSimilarity } = require('./utils/similarity');
const { readCSV, writeCSV } = require('./utils/csv');
const path = require('path');

async function testTFIDF() {
    console.log('Testing TF-IDF Vectorizer...');
    
    // Sample documents
    const documents = [
        'binary search tree algorithm',
        'dynamic programming optimization',
        'graph shortest path dijkstra',
        'sorting algorithm quicksort',
        'tree traversal depth first search'
    ];
    
    // Initialize vectorizer
    const vectorizer = new TFIDFVectorizer();
    
    // Fit and transform
    const tfidfMatrix = vectorizer.fitTransform(documents);
    
    console.log(`Vocabulary size: ${vectorizer.vocabulary.size}`);
    console.log(`Matrix dimensions: ${tfidfMatrix.rows} x ${tfidfMatrix.columns}`);
    
    // Test query
    const query = 'binary tree search';
    const queryVector = vectorizer.transform([query]);
    
    console.log(`Query: "${query}"`);
    console.log('Query vector (first 5 features):', queryVector.getRow(0).slice(0, 5));
    
    // Calculate similarities
    const similarities = [];
    for (let i = 0; i < documents.length; i++) {
        const docVector = tfidfMatrix.getRow(i);
        const similarity = cosineSimilarity(docVector, queryVector.getRow(0));
        similarities.push({ doc: documents[i], similarity });
    }
    
    // Sort by similarity
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    console.log('\nTop matching documents:');
    similarities.forEach((item, index) => {
        console.log(`${index + 1}. ${item.doc} (${item.similarity.toFixed(4)})`);
    });
    
    return true;
}

async function testCSV() {
    console.log('\nTesting CSV operations...');
    
    const testData = [
        { Name: 'Test Problem 1', URL: 'http://example.com/1', Text: 'Sample problem description' },
        { Name: 'Test Problem 2', URL: 'http://example.com/2', Text: 'Another problem description' }
    ];
    
    const headers = [
        { id: 'Name', title: 'Name' },
        { id: 'URL', title: 'URL' },
        { id: 'Text', title: 'Text' }
    ];
    
    const testFile = path.join(__dirname, 'test-data.csv');
    
    try {
        // Write CSV
        await writeCSV(testFile, testData, headers);
        console.log('CSV write successful');
        
        // Read CSV
        const readData = await readCSV(testFile);
        console.log(`CSV read successful: ${readData.length} rows`);
        
        // Clean up
        const fs = require('fs');
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }
        
        return true;
    } catch (error) {
        console.error('CSV test failed:', error.message);
        return false;
    }
}

async function testSimilarity() {
    console.log('\nTesting similarity functions...');
    
    const vectorA = [1, 2, 3, 4, 5];
    const vectorB = [2, 4, 6, 8, 10]; // Similar direction
    const vectorC = [5, 4, 3, 2, 1]; // Different direction
    
    const simAB = cosineSimilarity(vectorA, vectorB);
    const simAC = cosineSimilarity(vectorA, vectorC);
    
    console.log(`Similarity A-B: ${simAB.toFixed(4)} (should be high)`);
    console.log(`Similarity A-C: ${simAC.toFixed(4)} (should be lower)`);
    
    return simAB > simAC; // Should be true
}

async function runAllTests() {
    console.log('Problem Finder API - Node.js Setup Test');
    console.log('=' .repeat(50));
    
    const tests = [
        { name: 'TF-IDF Vectorizer', test: testTFIDF },
        { name: 'CSV Operations', test: testCSV },
        { name: 'Similarity Functions', test: testSimilarity }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const { name, test } of tests) {
        try {
            console.log(`\n📋 Running test: ${name}`);
            const result = await test();
            if (result) {
                console.log(`✅ ${name}: PASSED`);
                passed++;
            } else {
                console.log(`❌ ${name}: FAILED`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ ${name}: ERROR - ${error.message}`);
            failed++;
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total tests: ${tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 All tests passed! The setup is working correctly.');
        console.log('\nNext steps:');
        console.log('1. Copy problem CSV files from the Python project (if available)');
        console.log('2. Run preprocessing: npm run preprocess');
        console.log('3. Start the server: npm start');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the installation and dependencies.');
    }
    
    return failed === 0;
}

// Run tests if called directly
if (require.main === module) {
    runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = {
    testTFIDF,
    testCSV,
    testSimilarity,
    runAllTests
};
