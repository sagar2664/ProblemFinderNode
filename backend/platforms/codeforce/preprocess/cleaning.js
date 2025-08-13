const { readCSV, writeCSV } = require('../../../utils/csv');
const path = require('path');

/**
 * Clean text by removing unwanted characters and normalizing whitespace
 * @param {string} text - Text to clean
 * @returns {string} - Cleaned text
 */
function cleanText(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    return text
        .trim()                           // Remove leading/trailing whitespace
        .replace(/\n/g, ' ')             // Replace newlines with spaces
        .replace(/-/g, ' ')              // Replace hyphens with spaces
        .replace(/\$/g, ' ')             // Replace $ symbols with spaces
        .replace(/\s+/g, ' ')            // Replace multiple spaces with single space
        .trim();                         // Final trim
}

/**
 * Clean URL by trimming whitespace
 * @param {string} url - URL to clean
 * @returns {string} - Cleaned URL
 */
function cleanURL(url) {
    if (!url || typeof url !== 'string') {
        return '';
    }
    return url.trim();
}

/**
 * Process and clean problem data
 * @param {Array} problems - Array of problem objects
 * @returns {Array} - Array of cleaned problem objects
 */
function cleanProblemsData(problems) {
    console.log(`Cleaning ${problems.length} problems...`);
    
    const cleanedProblems = problems.map((problem, index) => {
        try {
            const cleaned = {
                Name: cleanText(problem.Name || ''),
                URL: cleanURL(problem.URL || ''),
                Tag: cleanText(problem.Tag || ''),
                Difficulty: cleanText(problem.Difficulty || ''),
                Text: cleanText(problem.Text || '')
            };

            // Log progress every 100 problems
            if ((index + 1) % 100 === 0) {
                console.log(`Cleaned ${index + 1}/${problems.length} problems`);
            }

            return cleaned;
        } catch (error) {
            console.error(`Error cleaning problem at index ${index}:`, error.message);
            return problem; // Return original if cleaning fails
        }
    });

    console.log('Cleaning completed successfully');
    return cleanedProblems;
}

/**
 * Validate cleaned data
 * @param {Array} problems - Array of problem objects
 * @returns {Object} - Validation statistics
 */
function validateCleanedData(problems) {
    const stats = {
        total: problems.length,
        emptyNames: 0,
        emptyUrls: 0,
        emptyTexts: 0,
        validProblems: 0
    };

    problems.forEach(problem => {
        if (!problem.Name || problem.Name.trim() === '') {
            stats.emptyNames++;
        }
        if (!problem.URL || problem.URL.trim() === '') {
            stats.emptyUrls++;
        }
        if (!problem.Text || problem.Text.trim() === '') {
            stats.emptyTexts++;
        }
        if (problem.Name && problem.URL && problem.Text) {
            stats.validProblems++;
        }
    });

    return stats;
}

/**
 * Clean Codeforces problem data from CSV file
 * @param {string} inputPath - Path to input CSV file
 * @param {string} outputPath - Path to output CSV file (optional, defaults to input path)
 * @returns {Promise<Object>} - Cleaning result statistics
 */
async function cleanCodeforceData(inputPath, outputPath = null) {
    try {
        console.log(`Reading problems from: ${inputPath}`);
        
        // Read the CSV file
        const problems = await readCSV(inputPath);
        console.log(`Loaded ${problems.length} problems`);

        if (problems.length === 0) {
            throw new Error('No problems found in the input file');
        }

        // Clean the data
        const cleanedProblems = cleanProblemsData(problems);

        // Validate cleaned data
        const stats = validateCleanedData(cleanedProblems);
        console.log('Validation statistics:', stats);

        // Save cleaned data
        const outputFile = outputPath || inputPath;
        const headers = [
            { id: 'Name', title: 'Name' },
            { id: 'URL', title: 'URL' },
            { id: 'Tag', title: 'Tag' },
            { id: 'Difficulty', title: 'Difficulty' },
            { id: 'Text', title: 'Text' }
        ];

        await writeCSV(outputFile, cleanedProblems, headers);
        console.log(`Cleaned data saved to: ${outputFile}`);

        return {
            success: true,
            stats: stats,
            outputPath: outputFile
        };

    } catch (error) {
        console.error('Error cleaning Codeforces data:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Clean individual problem fields for real-time processing
 * @param {Object} problem - Problem object to clean
 * @returns {Object} - Cleaned problem object
 */
function cleanSingleProblem(problem) {
    return {
        Name: cleanText(problem.Name),
        URL: cleanURL(problem.URL),
        Tag: cleanText(problem.Tag),
        Difficulty: cleanText(problem.Difficulty),
        Text: cleanText(problem.Text)
    };
}

// Export functions
module.exports = {
    cleanText,
    cleanURL,
    cleanProblemsData,
    validateCleanedData,
    cleanCodeforceData,
    cleanSingleProblem
};

// Run if called directly
if (require.main === module) {
    const inputPath = path.join(__dirname, 'problems.csv');
    const outputPath = path.join(__dirname, 'problem.csv');
    
    cleanCodeforceData(inputPath, outputPath)
        .then(result => {
            if (result.success) {
                console.log('\nCleaning completed successfully!');
                console.log('Statistics:', result.stats);
                console.log(`Output saved to: ${result.outputPath}`);
            } else {
                console.error('\nCleaning failed:', result.error);
            }
        })
        .catch(error => {
            console.error('Unexpected error:', error);
        });
}
