const path = require('path');
const fs = require('fs-extra');

// Import preprocessing modules for each platform
const { scrapeCodeforces } = require('../platforms/codeforce/preprocess/scraping');
const { cleanCodeforceData } = require('../platforms/codeforce/preprocess/cleaning');
const { trainTFIDF: trainCodeforcesTFIDF } = require('../platforms/codeforce/preprocess/tfidf');

/**
 * Preprocess a single platform
 * @param {string} platformName - Name of the platform
 * @param {Object} config - Configuration for preprocessing
 * @returns {Promise<Object>} - Processing result
 */
async function preprocessPlatform(platformName, config) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`PREPROCESSING ${platformName.toUpperCase()}`);
    console.log(`${'='.repeat(60)}`);
    
    const startTime = Date.now();
    const result = {
        platform: platformName,
        success: false,
        steps: {},
        totalTime: 0,
        error: null
    };
    
    try {
        const platformDir = path.join(__dirname, '..', 'platforms', platformName, 'preprocess');
        await fs.ensureDir(platformDir);
        
        // Step 1: Scraping (if enabled)
        if (config.scrape) {
            console.log('\n--- Step 1: Scraping Problems ---');
            const scrapeStart = Date.now();
            
            let scrapeResult;
            if (platformName === 'codeforce') {
                scrapeResult = await scrapeCodeforces({
                    order: config.scrapeOptions?.order || 'BY_RATING_ASC',
                    maxPages: config.scrapeOptions?.maxPages || 2,
                    outputPath: path.join(platformDir, 'problems.csv')
                });
            } else {
                console.log(`Scraping not implemented for ${platformName} yet`);
                scrapeResult = { success: false, error: 'Not implemented' };
            }
            
            result.steps.scraping = {
                success: scrapeResult.success,
                time: Date.now() - scrapeStart,
                problemCount: scrapeResult.problemCount || 0,
                error: scrapeResult.error
            };
            
            if (!scrapeResult.success && config.requireScraping) {
                throw new Error(`Scraping failed: ${scrapeResult.error}`);
            }
        }
        
        // Step 2: Data Cleaning
        console.log('\n--- Step 2: Cleaning Data ---');
        const cleanStart = Date.now();
        
        const inputFile = path.join(platformDir, 'problems.csv');
        const outputFile = path.join(platformDir, 'problem.csv');
        
        let cleanResult;
        if (platformName === 'codeforce') {
            if (await fs.pathExists(inputFile)) {
                cleanResult = await cleanCodeforceData(inputFile, outputFile);
            } else {
                console.log('No problems.csv found, skipping cleaning step');
                cleanResult = { success: false, error: 'Input file not found' };
            }
        } else {
            console.log(`Cleaning not implemented for ${platformName} yet`);
            cleanResult = { success: false, error: 'Not implemented' };
        }
        
        result.steps.cleaning = {
            success: cleanResult.success,
            time: Date.now() - cleanStart,
            stats: cleanResult.stats,
            error: cleanResult.error
        };
        
        if (!cleanResult.success && config.requireCleaning) {
            throw new Error(`Cleaning failed: ${cleanResult.error}`);
        }
        
        // Step 3: TF-IDF Training
        console.log('\n--- Step 3: Training TF-IDF ---');
        const tfidfStart = Date.now();
        
        const csvPath = path.join(platformDir, 'problem.csv');
        
        let tfidfResult;
        if (platformName === 'codeforce') {
            if (await fs.pathExists(csvPath)) {
                tfidfResult = await trainCodeforcesTFIDF(csvPath, platformDir);
            } else {
                console.log('No problem.csv found, skipping TF-IDF training');
                tfidfResult = { success: false, error: 'CSV file not found' };
            }
        } else {
            console.log(`TF-IDF training not implemented for ${platformName} yet`);
            tfidfResult = { success: false, error: 'Not implemented' };
        }
        
        result.steps.tfidf = {
            success: tfidfResult.success,
            time: Date.now() - tfidfStart,
            stats: tfidfResult.stats,
            error: tfidfResult.error
        };
        
        if (!tfidfResult.success) {
            throw new Error(`TF-IDF training failed: ${tfidfResult.error}`);
        }
        
        // Overall success
        result.success = true;
        result.totalTime = Date.now() - startTime;
        
        console.log(`\n✅ ${platformName} preprocessing completed successfully!`);
        console.log(`Total time: ${(result.totalTime / 1000).toFixed(2)}s`);
        
    } catch (error) {
        result.error = error.message;
        result.totalTime = Date.now() - startTime;
        console.error(`\n❌ ${platformName} preprocessing failed: ${error.message}`);
    }
    
    return result;
}

/**
 * Preprocess all platforms
 * @param {Object} options - Global options
 * @returns {Promise<Object>} - Overall results
 */
async function preprocessAll(options = {}) {
    const {
        platforms = ['codeforce'], // Only codeforce is fully implemented
        scrape = true,
        requireScraping = false,
        requireCleaning = false,
        scrapeOptions = {}
    } = options;
    
    console.log('Problem Finder API - Data Preprocessing');
    console.log(`Starting preprocessing for platforms: ${platforms.join(', ')}`);
    console.log(`Scraping enabled: ${scrape}`);
    
    const overallStart = Date.now();
    const results = {
        success: false,
        platforms: {},
        totalTime: 0,
        successCount: 0,
        failureCount: 0
    };
    
    // Platform-specific configurations
    const platformConfigs = {
        codeforce: {
            scrape,
            requireScraping,
            requireCleaning,
            scrapeOptions: {
                order: 'BY_RATING_ASC',
                maxPages: scrapeOptions.maxPages || 2,
                ...scrapeOptions
            }
        },
        leetcode: {
            scrape: false, // Not implemented yet
            requireScraping: false,
            requireCleaning: false
        },
        atcoder: {
            scrape: false, // Not implemented yet
            requireScraping: false,
            requireCleaning: false
        },
        dmoj: {
            scrape: false, // Not implemented yet
            requireScraping: false,
            requireCleaning: false
        }
    };
    
    // Process each platform
    for (const platform of platforms) {
        const config = platformConfigs[platform] || {};
        const result = await preprocessPlatform(platform, config);
        results.platforms[platform] = result;
        
        if (result.success) {
            results.successCount++;
        } else {
            results.failureCount++;
        }
    }
    
    results.totalTime = Date.now() - overallStart;
    results.success = results.successCount > 0;
    
    // Print summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('PREPROCESSING SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total platforms: ${platforms.length}`);
    console.log(`Successful: ${results.successCount}`);
    console.log(`Failed: ${results.failureCount}`);
    console.log(`Total time: ${(results.totalTime / 1000).toFixed(2)}s`);
    
    // Detailed results for each platform
    Object.entries(results.platforms).forEach(([platform, result]) => {
        console.log(`\n${platform.toUpperCase()}:`);
        console.log(`  Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
        console.log(`  Time: ${(result.totalTime / 1000).toFixed(2)}s`);
        
        if (result.steps.scraping) {
            console.log(`  Scraping: ${result.steps.scraping.success ? '✅' : '❌'} (${result.steps.scraping.problemCount || 0} problems)`);
        }
        if (result.steps.cleaning) {
            console.log(`  Cleaning: ${result.steps.cleaning.success ? '✅' : '❌'}`);
        }
        if (result.steps.tfidf) {
            console.log(`  TF-IDF: ${result.steps.tfidf.success ? '✅' : '❌'}`);
            if (result.steps.tfidf.stats) {
                console.log(`    Vocabulary: ${result.steps.tfidf.stats.vocabularySize} terms`);
                console.log(`    Matrix: ${result.steps.tfidf.stats.matrixRows}x${result.steps.tfidf.stats.matrixColumns}`);
            }
        }
        
        if (result.error) {
            console.log(`  Error: ${result.error}`);
        }
    });
    
    return results;
}

// Export for use as module
module.exports = {
    preprocessPlatform,
    preprocessAll
};

// Run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    
    // Parse command line arguments
    const options = {
        platforms: ['codeforce'],
        scrape: !args.includes('--no-scrape'),
        requireScraping: args.includes('--require-scraping'),
        requireCleaning: args.includes('--require-cleaning'),
        scrapeOptions: {}
    };
    
    // Parse max pages option
    const maxPagesIndex = args.indexOf('--max-pages');
    if (maxPagesIndex !== -1 && args[maxPagesIndex + 1]) {
        options.scrapeOptions.maxPages = parseInt(args[maxPagesIndex + 1]);
    }
    
    // Parse platforms option
    const platformsIndex = args.indexOf('--platforms');
    if (platformsIndex !== -1 && args[platformsIndex + 1]) {
        options.platforms = args[platformsIndex + 1].split(',');
    }
    
    console.log('Starting preprocessing with options:', options);
    
    preprocessAll(options)
        .then(results => {
            console.log('\nPreprocessing completed!');
            process.exit(results.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}
