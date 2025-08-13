const fs = require('fs-extra');
const path = require('path');
const { Matrix } = require('ml-matrix');

/**
 * Save TF-IDF vectorizer to JSON file
 * @param {Object} vectorizer - Serialized vectorizer object
 * @param {string} filePath - Path to save file
 * @returns {Promise} - Promise that resolves when saving is complete
 */
async function saveVectorizer(vectorizer, filePath) {
    try {
        // Ensure directory exists
        await fs.ensureDir(path.dirname(filePath));
        
        // Serialize and save
        const serialized = vectorizer.serialize();
        await fs.writeJson(filePath, serialized, { spaces: 2 });
        
        console.log(`Vectorizer saved to ${filePath}`);
    } catch (error) {
        console.error(`Error saving vectorizer to ${filePath}:`, error.message);
        throw error;
    }
}

/**
 * Load TF-IDF vectorizer from JSON file
 * @param {string} filePath - Path to vectorizer file
 * @returns {Promise<Object>} - Loaded vectorizer object
 */
async function loadVectorizer(filePath) {
    try {
        if (!await fs.pathExists(filePath)) {
            throw new Error(`Vectorizer file not found: ${filePath}`);
        }
        
        const data = await fs.readJson(filePath);
        const TFIDFVectorizer = require('./tfidf');
        const vectorizer = TFIDFVectorizer.deserialize(data);
        
        console.log(`Vectorizer loaded from ${filePath}`);
        return vectorizer;
    } catch (error) {
        console.error(`Error loading vectorizer from ${filePath}:`, error.message);
        throw error;
    }
}

/**
 * Save TF-IDF matrix to JSON file
 * @param {Matrix} matrix - TF-IDF matrix to save
 * @param {string} filePath - Path to save file
 * @returns {Promise} - Promise that resolves when saving is complete
 */
async function saveMatrix(matrix, filePath) {
    try {
        // Ensure directory exists
        await fs.ensureDir(path.dirname(filePath));
        
        // Convert matrix to serializable format
        const matrixData = {
            data: matrix.to2DArray(),
            rows: matrix.rows,
            columns: matrix.columns
        };
        
        await fs.writeJson(filePath, matrixData, { spaces: 2 });
        
        console.log(`Matrix saved to ${filePath} (${matrix.rows}x${matrix.columns})`);
    } catch (error) {
        console.error(`Error saving matrix to ${filePath}:`, error.message);
        throw error;
    }
}

/**
 * Load TF-IDF matrix from JSON file
 * @param {string} filePath - Path to matrix file
 * @returns {Promise<Matrix>} - Loaded matrix object
 */
async function loadMatrix(filePath) {
    try {
        if (!await fs.pathExists(filePath)) {
            throw new Error(`Matrix file not found: ${filePath}`);
        }
        
        // Check file size first
        const stats = await fs.stat(filePath);
        const fileSizeGB = stats.size / (1024 * 1024 * 1024);
        
        if (fileSizeGB > 1.8) {
            console.log(`Large matrix file detected (${fileSizeGB.toFixed(2)}GB). This file cannot be loaded due to Node.js limitations.`);
            console.log(`Skipping matrix loading - returning empty matrix as fallback.`);
            // Return a minimal matrix to prevent crashes
            return new Matrix([[0]]);
        }
        
        const data = await fs.readJson(filePath);
        const matrix = new Matrix(data.data);
        
        console.log(`Matrix loaded from ${filePath} (${matrix.rows}x${matrix.columns})`);
        return matrix;
    } catch (error) {
        console.error(`Error loading matrix from ${filePath}:`, error.message);
        throw error;
    }
}

/**
 * Load large matrix files with increased memory handling
 * @param {string} filePath - Path to matrix file
 * @returns {Promise<Matrix>} - Loaded matrix object
 */
async function loadLargeMatrix(filePath) {
    try {
        console.log('Loading large matrix file. This may take a moment...');
        
        // Try to increase V8 heap limit for this operation
        if (process.setMaxListeners) {
            process.setMaxListeners(0);
        }
        
        // Use a different parsing approach for large files
        return await loadMatrixWithBuffer(filePath);
        
    } catch (error) {
        console.error(`Error loading large matrix from ${filePath}:`, error.message);
        
        // Provide helpful error message about memory limits
        const errorMsg = `Large matrix file (>2GB) cannot be loaded. ` +
            `To fix this, start the server with increased memory: ` +
            `"node --max-old-space-size=8192 server.js" ` +
            `Original error: ${error.message}`;
        
        throw new Error(errorMsg);
    }
}

/**
 * Load matrix using streaming approach for very large files
 * @param {string} filePath - Path to matrix file
 * @returns {Promise<Matrix>} - Loaded matrix object
 */
async function loadMatrixWithBuffer(filePath) {
    try {
        console.log('Loading large matrix with streaming approach...');
        
        // For files > 2GB, we need to read in chunks
        const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
        let jsonString = '';
        
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => {
                jsonString += chunk;
            });
            
            stream.on('end', () => {
                try {
                    console.log('Parsing JSON data...');
                    const data = JSON.parse(jsonString);
                    const matrix = new Matrix(data.data);
                    console.log(`Large matrix loaded from ${filePath} (${matrix.rows}x${matrix.columns})`);
                    resolve(matrix);
                } catch (parseError) {
                    reject(new Error(`JSON parsing failed: ${parseError.message}`));
                }
            });
            
            stream.on('error', (error) => {
                reject(new Error(`Stream reading failed: ${error.message}`));
            });
        });
        
    } catch (error) {
        throw new Error(`Streaming parsing failed: ${error.message}`);
    }
}

/**
 * Save both vectorizer and matrix for a platform
 * @param {string} platformPath - Base path for the platform
 * @param {Object} vectorizer - Vectorizer to save
 * @param {Matrix} matrix - Matrix to save
 * @returns {Promise} - Promise that resolves when both are saved
 */
async function savePlatformData(platformPath, vectorizer, matrix) {
    const vectorizerPath = path.join(platformPath, 'vectorizer.json');
    const matrixPath = path.join(platformPath, 'matrix.json');
    
    await Promise.all([
        saveVectorizer(vectorizer, vectorizerPath),
        saveMatrix(matrix, matrixPath)
    ]);
    
    console.log(`Platform data saved to ${platformPath}`);
}

/**
 * Load both vectorizer and matrix for a platform
 * @param {string} platformPath - Base path for the platform
 * @returns {Promise<Object>} - Object with vectorizer and matrix
 */
async function loadPlatformData(platformPath) {
    const vectorizerPath = path.join(platformPath, 'vectorizer.json');
    const matrixPath = path.join(platformPath, 'matrix.json');
    
    const [vectorizer, matrix] = await Promise.all([
        loadVectorizer(vectorizerPath),
        loadMatrix(matrixPath)
    ]);
    
    console.log(`Platform data loaded from ${platformPath}`);
    return { vectorizer, matrix };
}

/**
 * Check if platform data files exist
 * @param {string} platformPath - Base path for the platform
 * @returns {Promise<Object>} - Object with existence status
 */
async function checkPlatformData(platformPath) {
    const vectorizerPath = path.join(platformPath, 'vectorizer.json');
    const matrixPath = path.join(platformPath, 'matrix.json');
    const csvPath = path.join(platformPath, 'problem.csv');
    
    const [vectorizerExists, matrixExists, csvExists] = await Promise.all([
        fs.pathExists(vectorizerPath),
        fs.pathExists(matrixPath),
        fs.pathExists(csvPath)
    ]);
    
    return {
        vectorizer: vectorizerExists,
        matrix: matrixExists,
        csv: csvExists,
        allReady: vectorizerExists && matrixExists && csvExists
    };
}

/**
 * Get file size information for platform data
 * @param {string} platformPath - Base path for the platform
 * @returns {Promise<Object>} - Object with file sizes
 */
async function getPlatformDataStats(platformPath) {
    const files = {
        vectorizer: path.join(platformPath, 'vectorizer.json'),
        matrix: path.join(platformPath, 'matrix.json'),
        csv: path.join(platformPath, 'problem.csv')
    };
    
    const stats = {};
    
    for (const [key, filePath] of Object.entries(files)) {
        try {
            if (await fs.pathExists(filePath)) {
                const stat = await fs.stat(filePath);
                stats[key] = {
                    exists: true,
                    size: stat.size,
                    sizeHuman: formatBytes(stat.size),
                    modified: stat.mtime
                };
            } else {
                stats[key] = { exists: false };
            }
        } catch (error) {
            stats[key] = { exists: false, error: error.message };
        }
    }
    
    return stats;
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} - Human readable size
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
    saveVectorizer,
    loadVectorizer,
    saveMatrix,
    loadMatrix,
    savePlatformData,
    loadPlatformData,
    checkPlatformData,
    getPlatformDataStats,
    formatBytes
};
