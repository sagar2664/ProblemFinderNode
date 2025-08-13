import { Mic, Search } from "lucide-react";
import { useState } from "react";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [platform, setPlatform] = useState("both");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const resultsPerPage = 10;

  const handleSearch = async (e, newPlatform = platform) => {
    if (e) e.preventDefault();
    if (!searchQuery) {
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3000";
      let url = `${baseUrl}/`;

      if (newPlatform === "leetcode") {
        url = `${baseUrl}/leetcode`;
      } else if (newPlatform === "codeforces") {
        url = `${baseUrl}/codeforce`;
      } else if (newPlatform === "atcoder") {
        url = `${baseUrl}/atcoder`;
      } else if (newPlatform === "dmoj") {
        url = `${baseUrl}/dmoj`;
      }

      if (searchQuery) {
        url += `?q=${encodeURIComponent(searchQuery)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Check if data is an array before sorting
      const sortedResults = Array.isArray(data)
        ? data.sort((a, b) => b.score - a.score)
        : [];
      setResults(sortedResults);
    } catch (error) {
      setError(
        error.message || "Failed to fetch results. Please try again later."
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window)) {
      setError("Voice recognition is not supported in your browser");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setTimeout(() => handleSearch(null), 0);
    };

    recognition.onerror = (event) => {
      setError("Error occurred in voice recognition: " + event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  // Get current result for pagination
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = results.slice(indexOfFirstResult, indexOfLastResult);
  const totalPages = Math.ceil(results.length / resultsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle platform change
  const handlePlatformChange = (e) => {
    const newPlatform = e.target.value;
    setPlatform(newPlatform);
    if (searchQuery) {
      // Only trigger search if there's a query
      handleSearch(null, newPlatform);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    document.querySelector("input").focus();
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-8 sm:pt-14 bg-gray-50 px-4">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-normal mb-4">
          <span className="text-blue-500">P</span>
          <span className="text-red-500">r</span>
          <span className="text-yellow-500">o</span>
          <span className="text-blue-500">b</span>
          <span className="text-green-500">l</span>
          <span className="text-red-500">e</span>
          <span className="text-yellow-500">m</span>
          <span className="text-blue-500 ml-1 sm:ml-2">Finder</span>
        </h1>
      </div>

      <div className="w-full max-w-2xl px-2 sm:px-4">
        <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:gap-6">
          <div className="flex items-center w-full border border-gray-200 rounded-full px-3 sm:px-5 py-2 sm:py-3 hover:shadow-md focus-within:shadow-md bg-white">
            <Search className="text-gray-400 mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coding problems"
              className="flex-1 outline-none text-gray-700 text-sm sm:text-base"
            />

            {searchQuery && (
              <button
                type="button"
                className="focus:outline-none"
                onClick={clearSearch}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
                </svg>
              </button>
            )}

            <button
              type="button"
              onClick={handleVoiceSearch}
              className="focus:outline-none"
            >
              <Mic
                className={`${
                  isListening ? "text-red-500 animate-pulse" : "text-blue-500"
                } ml-2 sm:ml-3 w-4 h-4 sm:w-5 sm:h-5 cursor-pointer`}
              />
            </button>
            <button
              type="submit"
              className="focus:outline-none"
              onClick={handleSearch}
            >
              <Search
                className={`${
                  searchQuery ? "text-blue-500" : "text-gray-500"
                } ml-2 sm:ml-3 w-4 h-4 sm:w-5 sm:h-5 cursor-pointer`}
              />
            </button>
          </div>
        </form>
      </div>

      <div className="mt-4 flex justify-center items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-700">
        <span>Search by platform:</span>
        <select
          value={platform}
          onChange={handlePlatformChange}
          className="bg-white border border-gray-200 rounded-md px-2 py-1 outline-none cursor-pointer hover:border-blue-500 transition-colors text-xs sm:text-sm"
        >
          <option value="both">All</option>
          <option value="leetcode">LeetCode</option>
          <option value="codeforces">CodeForces</option>
          <option value="atcoder">AtCoder</option>
          <option value="dmoj">DMOJ</option>
        </select>
      </div>

      {loading && (
        <div className="mt-6 sm:mt-8 text-gray-600 text-sm sm:text-base">
          Loading...
        </div>
      )}

      {error && (
        <div className="mt-6 sm:mt-8 text-red-500 text-sm sm:text-base">
          {error}
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="mt-4 w-full max-w-6xl px-2 sm:px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <div className="space-y-3 sm:space-y-4">
              {currentResults.slice(0, 5).map((result, index) => (
                <div
                  key={index}
                  className="bg-white p-2 sm:p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500"
                >
                  <div className="flex justify-between items-start">
                    <a
                      className="font-semibold text-base sm:text-lg text-gray-800 hover:text-blue-600 transition-colors truncate"
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {result.name}
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3 sm:space-y-4">
              {currentResults.slice(5, 10).map((result, index) => (
                <div
                  key={index + 5}
                  className="bg-white p-2 sm:p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500"
                >
                  <div className="flex justify-between items-start">
                    <a
                      className="font-semibold text-base sm:text-lg text-gray-800 hover:text-blue-600 transition-colors truncate"
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {result.name}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center mt-6 space-x-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md transition-colors text-sm sm:text-base ${
                currentPage === 1
                  ? "bg-gray-200 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Previous
            </button>
            <span className="text-gray-600 bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md border text-sm sm:text-base">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md transition-colors text-sm sm:text-base ${
                currentPage === totalPages
                  ? "bg-gray-200 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
