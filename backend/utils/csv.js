const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');

/**
 * Read CSV file and return parsed data
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array>} - Array of parsed CSV rows
 */
function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        
        if (!fs.existsSync(filePath)) {
            reject(new Error(`CSV file not found: ${filePath}`));
            return;
        }
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

/**
 * Write data to CSV file
 * @param {string} filePath - Path to output CSV file
 * @param {Array} data - Array of objects to write
 * @param {Array} headers - Array of header objects {id, title}
 * @returns {Promise} - Promise that resolves when writing is complete
 */
function writeCSV(filePath, data, headers) {
    return new Promise((resolve, reject) => {
        try {
            // Ensure directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            const csvWriter = createCsvWriter({
                path: filePath,
                header: headers
            });
            
            csvWriter.writeRecords(data)
                .then(() => resolve())
                .catch((error) => reject(error));
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Read problem data from CSV with standard columns
 * @param {string} filePath - Path to problem CSV file
 * @returns {Promise<Object>} - Object with names, urls, and texts arrays
 */
async function readProblemData(filePath) {
    try {
        const data = await readCSV(filePath);
        
        const names = [];
        const urls = [];
        const texts = [];
        const tags = [];
        const difficulties = [];
        
        data.forEach(row => {
            // Handle different column name variations
            const name = row.Name || row.name || '';
            const url = row.URL || row.url || row.Url || '';
            const text = row.Text || row.text || row.description || '';
            const tag = row.Tag || row.tag || row.tags || '';
            const difficulty = row.Difficulty || row.difficulty || '';
            
            names.push(name);
            urls.push(url);
            texts.push(text);
            tags.push(tag);
            difficulties.push(difficulty);
        });
        
        return {
            names,
            urls,
            texts,
            tags,
            difficulties,
            length: data.length
        };
    } catch (error) {
        console.error(`Error reading problem data from ${filePath}:`, error.message);
        throw error;
    }
}

/**
 * Validate CSV structure for problem data
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<boolean>} - True if valid structure
 */
async function validateProblemCSV(filePath) {
    try {
        const data = await readCSV(filePath);
        
        if (data.length === 0) {
            return false;
        }
        
        const firstRow = data[0];
        const requiredFields = ['Name', 'URL'];
        
        // Check if required fields exist (case insensitive)
        const availableFields = Object.keys(firstRow).map(key => key.toLowerCase());
        const hasRequiredFields = requiredFields.every(field => 
            availableFields.includes(field.toLowerCase())
        );
        
        return hasRequiredFields;
    } catch (error) {
        console.error(`Error validating CSV ${filePath}:`, error.message);
        return false;
    }
}

/**
 * Get CSV file statistics
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Object>} - Statistics object
 */
async function getCSVStats(filePath) {
    try {
        const data = await readCSV(filePath);
        
        const stats = {
            totalRows: data.length,
            columns: data.length > 0 ? Object.keys(data[0]) : [],
            columnCount: data.length > 0 ? Object.keys(data[0]).length : 0,
            emptyRows: 0,
            fileSizeBytes: fs.statSync(filePath).size
        };
        
        // Count empty rows
        data.forEach(row => {
            const values = Object.values(row);
            const isEmpty = values.every(value => !value || value.trim() === '');
            if (isEmpty) stats.emptyRows++;
        });
        
        return stats;
    } catch (error) {
        console.error(`Error getting CSV stats for ${filePath}:`, error.message);
        throw error;
    }
}

module.exports = {
    readCSV,
    writeCSV,
    readProblemData,
    validateProblemCSV,
    getCSVStats
};
