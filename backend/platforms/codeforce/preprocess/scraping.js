const axios = require('axios');
const cheerio = require('cheerio');
const { writeCSV } = require('../../../utils/csv');
const path = require('path');

class CodeforcesScraper {
    constructor() {
        this.baseUrl = 'https://codeforces.com';
        this.problemsetUrl = 'https://codeforces.com/problemset';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };
    }

    async fetchPage(url) {
        try {
            const response = await axios.get(url, { 
                headers: this.headers,
                timeout: 10000 
            });
            return cheerio.load(response.data);
        } catch (error) {
            console.error(`Error fetching page ${url}:`, error.message);
            throw error;
        }
    }

    async fetchProblemText(url) {
        try {
            const $ = await this.fetchPage(url);
            
            // Try to extract problem text from the main content area
            const textElement = $('#pageContent .problemindexholder .ttypography > div > div').eq(1);
            let text = textElement.text() || '';
            
            // Clean up the text
            text = text.replace(/\$/g, '').trim();
            
            return text;
        } catch (error) {
            console.error(`Error fetching problem text from ${url}:`, error.message);
            return '';
        }
    }

    async fetchProblemsFromPage(pageUrl) {
        try {
            console.log(`Fetching problems from: ${pageUrl}`);
            const $ = await this.fetchPage(pageUrl);
            const problems = [];

            // Find all problem rows in the table
            const problemRows = $('tr').filter((i, el) => {
                return $(el).find('[style="float: left;"]').length > 0;
            });

            for (let i = 0; i < problemRows.length; i++) {
                const row = $(problemRows[i]);
                
                try {
                    // Extract problem name
                    const nameElement = row.find('[style="float: left;"]');
                    if (nameElement.length === 0) continue;
                    
                    let name = nameElement.text().replace(/\n/g, '').trim();
                    if (name.startsWith('A') || name.startsWith('B') || name.startsWith('C') || 
                        name.startsWith('D') || name.startsWith('E') || name.startsWith('F')) {
                        name = name.substring(1).trim(); // Remove letter prefix
                    }

                    // Extract problem URL
                    const linkElement = row.find('a').first();
                    if (linkElement.length === 0) continue;
                    
                    const relativeUrl = linkElement.attr('href');
                    const url = this.baseUrl + relativeUrl;

                    // Extract tags
                    const tagElement = row.find('.notice');
                    const tag = tagElement.length > 0 ? tagElement.text().trim() : '';

                    // Extract difficulty
                    const difficultyElement = row.find('.ProblemRating');
                    let difficulty = '';
                    if (difficultyElement.length > 0) {
                        difficulty = difficultyElement.text().trim();
                    }

                    // Fetch problem text
                    console.log(`  Fetching text for: ${name}`);
                    const text = await this.fetchProblemText(url);

                    problems.push({
                        Name: name,
                        URL: url,
                        Tag: tag,
                        Difficulty: difficulty,
                        Text: text
                    });

                    // Add delay to avoid overwhelming the server
                    await new Promise(resolve => setTimeout(resolve, 500));

                } catch (error) {
                    console.error(`Error processing problem row:`, error.message);
                    continue;
                }
            }

            return problems;
        } catch (error) {
            console.error(`Error fetching problems from page ${pageUrl}:`, error.message);
            return [];
        }
    }

    async getTotalPages(order = 'BY_RATING_ASC') {
        try {
            const url = `${this.problemsetUrl}?order=${order}`;
            const $ = await this.fetchPage(url);
            
            const paginationElement = $('.pagination li').eq(-2);
            if (paginationElement.length === 0) {
                throw new Error('Could not find pagination information');
            }
            
            const totalPages = parseInt(paginationElement.text().trim());
            if (isNaN(totalPages)) {
                throw new Error('Could not parse total pages number');
            }
            
            return totalPages;
        } catch (error) {
            console.error('Error getting total pages:', error.message);
            throw error;
        }
    }

    async scrapeAllProblems(order = 'BY_RATING_ASC', maxPages = null) {
        try {
            console.log('Starting Codeforces scraping...');
            
            const totalPages = await this.getTotalPages(order);
            console.log(`Total pages found: ${totalPages}`);
            
            const pagesToScrape = maxPages ? Math.min(maxPages, totalPages) : totalPages;
            console.log(`Will scrape ${pagesToScrape} pages`);

            let allProblems = [];

            for (let pageNum = 1; pageNum <= pagesToScrape; pageNum++) {
                console.log(`\n******** Fetching Page ${pageNum}/${pagesToScrape} ********`);
                
                const pageUrl = `${this.problemsetUrl}/page/${pageNum}?order=${order}`;
                const problems = await this.fetchProblemsFromPage(pageUrl);
                
                allProblems = allProblems.concat(problems);
                console.log(`******** Page ${pageNum} completed (${problems.length} problems) ********`);
                
                // Add delay between pages
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`\n***** Scraping completed! Total problems: ${allProblems.length} *****`);
            return allProblems;

        } catch (error) {
            console.error('Error in scrapeAllProblems:', error.message);
            throw error;
        }
    }

    async saveToCSV(problems, outputPath = null) {
        try {
            const csvPath = outputPath || path.join(__dirname, 'problems.csv');
            
            const headers = [
                { id: 'Name', title: 'Name' },
                { id: 'URL', title: 'URL' },
                { id: 'Tag', title: 'Tag' },
                { id: 'Difficulty', title: 'Difficulty' },
                { id: 'Text', title: 'Text' }
            ];

            await writeCSV(csvPath, problems, headers);
            console.log(`Problems saved to ${csvPath}`);
            return csvPath;
        } catch (error) {
            console.error('Error saving to CSV:', error.message);
            throw error;
        }
    }
}

// Function to run scraping
async function scrapeCodeforces(options = {}) {
    const {
        order = 'BY_RATING_ASC',
        maxPages = null,
        outputPath = null
    } = options;

    const scraper = new CodeforcesScraper();
    
    try {
        const problems = await scraper.scrapeAllProblems(order, maxPages);
        const csvPath = await scraper.saveToCSV(problems, outputPath);
        
        return {
            success: true,
            problemCount: problems.length,
            csvPath: csvPath
        };
    } catch (error) {
        console.error('Scraping failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Export for use as module or run directly
module.exports = {
    CodeforcesScraper,
    scrapeCodeforces
};

// Run if called directly
if (require.main === module) {
    const options = {
        order: 'BY_RATING_ASC',
        maxPages: 2, // Limit to 2 pages for testing
        outputPath: path.join(__dirname, 'problems.csv')
    };
    
    scrapeCodeforces(options)
        .then(result => {
            if (result.success) {
                console.log(`\nScraping completed successfully!`);
                console.log(`Problems scraped: ${result.problemCount}`);
                console.log(`Saved to: ${result.csvPath}`);
            } else {
                console.error(`\nScraping failed: ${result.error}`);
            }
        })
        .catch(error => {
            console.error('Unexpected error:', error);
        });
}
