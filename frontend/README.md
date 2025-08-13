# Problem Finder Frontend (React)

This is the React.js frontend for the Problem Finder application, converted from Next.js. It provides a user-friendly interface to search for coding problems across multiple platforms.

## Features

- Search coding problems across multiple platforms (LeetCode, CodeForces, AtCoder, DMOJ)
- Voice search functionality
- Real-time search results with pagination
- Responsive design with Tailwind CSS
- Platform-specific filtering

## Technologies Used

- React.js
- Tailwind CSS
- Lucide React (for icons)
- Speech Recognition API (for voice search)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Backend server running on port 3000

### Installation

1. Navigate to the frontend-react directory:
   ```bash
   cd frontend-react
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The application will open at `http://localhost:3001` and proxy API requests to the backend server at `http://localhost:3000`.

### Backend Connection

The frontend is configured to connect to the backend server running on port 3000. Make sure your backend server is running before starting the frontend.

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## API Endpoints

The frontend connects to the following backend endpoints:

- `GET /` - Search all platforms
- `GET /leetcode` - Search LeetCode only
- `GET /codeforce` - Search CodeForces only
- `GET /atcoder` - Search AtCoder only
- `GET /dmoj` - Search DMOJ only

## Features

### Search Functionality
- Text-based search with real-time results
- Voice search using Web Speech API
- Platform-specific filtering
- Pagination for large result sets

### Responsive Design
- Mobile-first responsive design
- Optimized for various screen sizes
- Touch-friendly interface

### User Experience
- Clear search interface
- Loading states and error handling
- Accessible design with proper focus management