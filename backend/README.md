# Problem Finder API - Node.js

A Node.js implementation of the Problem Finder API that provides intelligent problem recommendation across multiple competitive programming platforms using semantic search with TF-IDF vectorization and cosine similarity.

## Features

- **Multi-Platform Support**: Search across Codeforces, LeetCode, AtCoder, and DMOJ
- **Semantic Search**: TF-IDF vectorization with cosine similarity for intelligent matching
- **RESTful API**: Express.js-based API with CORS support
- **Preprocessing Pipeline**: Web scraping, data cleaning, and ML model training
- **Real-time Search**: Fast similarity calculations with pre-computed models

## Architecture

```
nodejs-problem-finder/
├── server.js                 # Main Express.js server
├── package.json              # Dependencies and scripts
├── utils/                    # Utility modules
│   ├── tfidf.js             # TF-IDF vectorization
│   ├── similarity.js        # Cosine similarity calculations
│   ├── csv.js               # CSV file operations
│   └── storage.js           # Model serialization
├── platforms/               # Platform-specific modules
│   ├── codeforce/
│   ├── leetcode/
│   ├── atcoder/
│   └── dmoj/
└── scripts/                 # Preprocessing scripts
    └── preprocess-all.js    # Main preprocessing script
```

## Installation

1. **Clone or create the project directory**:
   ```bash
   cd nodejs-problem-finder
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Copy problem data** (if available from Python version):
   ```bash
   # Copy CSV files from the original Python project
   cp ../codeforce/preprocess/problem.csv platforms/codeforce/preprocess/
   cp ../leetcode/preprocess/problem.csv platforms/leetcode/preprocess/
   cp ../atcoder/preprocess/problem.csv platforms/atcoder/preprocess/
   cp ../dmoj/preprocess/problem.csv platforms/dmoj/preprocess/
   ```

4. **Run preprocessing** (if you have CSV data):
   ```bash
   npm run preprocess
   ```

   Or preprocess with custom options:
   ```bash
   node scripts/preprocess-all.js --max-pages 5 --platforms codeforce
   ```

## Usage

### Starting the Server

```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

The server will start on port 3000 (or PORT environment variable).

### API Endpoints

#### Search All Platforms
```http
GET /?q=binary%20search&n=10
```

#### Platform-Specific Search
```http
GET /codeforce/?q=dynamic%20programming&n=5
GET /leetcode/?q=tree%20traversal
GET /atcoder/?q=graph%20algorithms
GET /dmoj/?q=shortest%20path
```

#### Health Check
```http
GET /health
```

### Query Parameters

- `q` (required): Search query string
- `n` (optional): Maximum number of results to return (-1 for all results)

### Response Format

```json
[
  {
    "name": "Binary Search Tree",
    "url": "https://codeforces.com/problemset/problem/123/A",
    "score": 0.856
  },
  {
    "name": "Tree DP",
    "url": "https://leetcode.com/problems/tree-dp/",
    "score": 0.742
  }
]
```

## Preprocessing

The preprocessing pipeline consists of three main steps:

### 1. Data Scraping
```bash
# Scrape problems from platforms (currently only Codeforces implemented)
node platforms/codeforce/preprocess/scraping.js
```

### 2. Data Cleaning
```bash
# Clean and normalize problem data
node platforms/codeforce/preprocess/cleaning.js
```

### 3. TF-IDF Training
```bash
# Train TF-IDF vectorizer and create similarity matrix
node platforms/codeforce/preprocess/tfidf.js
```

### 4. Complete Preprocessing
```bash
# Run all preprocessing steps for all platforms
npm run preprocess

# With custom options
node scripts/preprocess-all.js --max-pages 10 --platforms codeforce,leetcode
```

## Testing Queries

You can test queries directly using the query script:

```bash
# Test a single query
node platforms/codeforce/preprocess/query.js binary search tree

# Interactive query testing
node platforms/codeforce/preprocess/query.js interactive

# Test predefined queries
node platforms/codeforce/preprocess/query.js
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

### Preprocessing Options

- `--max-pages N`: Limit scraping to N pages
- `--platforms list`: Comma-separated list of platforms
- `--no-scrape`: Skip scraping step
- `--require-scraping`: Fail if scraping fails
- `--require-cleaning`: Fail if cleaning fails

## Development

### Project Structure

- **`utils/`**: Core utility modules for TF-IDF, similarity, file operations
- **`platforms/`**: Platform-specific modules with consistent interface
- **`scripts/`**: Preprocessing and utility scripts
- **`server.js`**: Main Express.js application

### Adding a New Platform

1. Create platform directory: `platforms/newplatform/`
2. Implement main module: `platforms/newplatform/newplatform.js`
3. Create preprocessing scripts:
   - `preprocess/scraping.js`
   - `preprocess/cleaning.js`
   - `preprocess/tfidf.js`
   - `preprocess/query.js`
4. Update `server.js` to include the new platform
5. Update `scripts/preprocess-all.js` with platform configuration

### Platform Module Interface

Each platform module should export:
```javascript
module.exports = {
    query: (queryText, threshold) => Promise<Array>,
    getStatus: () => Promise<Object>,
    initialize: () => Promise<void>
};
```

## Dependencies

### Core Dependencies
- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **natural**: Natural language processing
- **ml-matrix**: Matrix operations
- **csv-parser/csv-writer**: CSV file operations
- **cheerio**: HTML parsing for scraping
- **axios**: HTTP client
- **fs-extra**: Enhanced file system operations

### Development Dependencies
- **nodemon**: Development server with auto-restart
- **jest**: Testing framework

## Performance

- **Pre-computed TF-IDF matrices** for fast similarity calculations
- **JSON serialization** for quick model loading
- **Similarity threshold filtering** to reduce result set
- **Parallel platform querying** for combined searches

## Limitations

1. **Platform Implementation**: Currently only Codeforces is fully implemented
2. **Scraping Dependencies**: Web scraping may break if platforms change their structure
3. **Memory Usage**: Large vocabularies and matrices require significant memory
4. **Update Frequency**: Preprocessed data needs periodic updates

## Migration from Python

This Node.js version maintains API compatibility with the original Python implementation:

- Same endpoint structure and response format
- Equivalent TF-IDF algorithm implementation
- Compatible preprocessing pipeline
- Similar performance characteristics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details
