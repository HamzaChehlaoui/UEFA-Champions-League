import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

// Constants
const MATCHES_PER_PAGE = 5;
const API_BASE_URL = 'https://api.sofascore.com/api/v1';
const MATCH_DATES = ['2025-04-15', '2025-04-16'];

// Status types and their display values
const MATCH_STATUS = {
  notstarted: { label: 'Upcoming', colorClass: 'bg-blue-100 text-blue-800' },
  inprogress: { label: 'Live', colorClass: 'bg-green-100 text-green-800' },
  finished: { label: 'Completed', colorClass: 'bg-gray-100 text-gray-800' },
  default: { label: 'Unknown', colorClass: 'bg-gray-100 text-gray-800' }
};

function FootballMatchesApp() {
  // State
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Format date from timestamp
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format time from timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Get status information for UI display
  const getStatusInfo = (statusType) => {
    return MATCH_STATUS[statusType] || MATCH_STATUS.default;
  };

  // Fetch match details with best player info
  const fetchMatchDetails = useCallback(async (match) => {
    if (match.status?.type === 'finished') {
      try {
        const response = await axios.get(`${API_BASE_URL}/event/${match.id}`);
        if (response.data?.event?.bestPlayer) {
          return {
            ...match,
            manOfTheMatch: response.data.event.bestPlayer
          };
        }
      } catch (error) {
        console.error(`Error fetching details for match ${match.id}:`, error);
      }
    }
    return match;
  }, []);

  // Filter matches by target dates
  const filterMatchesByDates = useCallback((allMatches) => {
    return allMatches.filter((match) => {
      const dateUTC = new Date(match.startTimestamp * 1000).toISOString().split('T')[0];
      return MATCH_DATES.includes(dateUTC);
    });
  }, []);

  // Fetch all matches data
  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      try {
        // Create array of promises for all fetch requests
        const datePromises = MATCH_DATES.map(date => 
          axios.get(`${API_BASE_URL}/sport/football/scheduled-events/${date}`)
        );
        
        // Wait for all requests to complete
        const responses = await Promise.all(datePromises);
        
        // Combine and process all match data
        const allMatches = responses.flatMap(response => response.data.events || []);
        const filteredMatches = filterMatchesByDates(allMatches);
        
        // Enhance matches with detailed information
        const enhancedMatches = await Promise.all(
          filteredMatches.map(fetchMatchDetails)
        );
        
        setMatches(enhancedMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
        setError('Unable to load matches. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMatches();
  }, [fetchMatchDetails, filterMatchesByDates]);

  // Pagination logic
  const totalPages = Math.ceil(matches.length / MATCHES_PER_PAGE);
  const indexOfLastMatch = currentPage * MATCHES_PER_PAGE;
  const indexOfFirstMatch = indexOfLastMatch - MATCHES_PER_PAGE;
  const currentMatches = matches.slice(indexOfFirstMatch, indexOfLastMatch);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // Generate pagination numbers with ellipsis for large page counts
  const getPaginationNumbers = () => {
    const pageNumbers = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      // Calculate range around current page
      let rangeStart = Math.max(2, currentPage - 1);
      let rangeEnd = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust range to show 3 pages
      if (currentPage <= 3) {
        rangeEnd = 4;
      } else if (currentPage >= totalPages - 2) {
        rangeStart = totalPages - 3;
      }
      
      // Add ellipsis before range if needed
      if (rangeStart > 2) {
        pageNumbers.push('...');
      }
      
      // Add range pages
      for (let i = rangeStart; i <= rangeEnd; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis after range if needed
      if (rangeEnd < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Always show last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  // Component to display match information
  const MatchCard = ({ match }) => {
    const statusInfo = getStatusInfo(match.status?.type);
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 flex justify-between items-center">
          <div className="font-semibold text-white flex items-center">
            {match.tournament?.name && (
              <span className="mr-2">{match.tournament.name}</span>
            )}
            {match.category?.name && (
              <span className="text-blue-100 text-sm">• {match.category.name}</span>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.colorClass}`}>
            {statusInfo.label}
          </span>
        </div>
        
        <div className="p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center justify-center w-2/5">
              {match.homeTeam?.pictureUrl ? (
                <img 
                  src={match.homeTeam.pictureUrl} 
                  alt={match.homeTeam.name} 
                  className="w-8 h-8 mr-2"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : null}
              <div className="font-bold text-lg text-gray-800">{match.homeTeam?.name || 'Home Team'}</div>
            </div>
            
            <div className="flex flex-col items-center justify-center w-1/5">
              {['inprogress', 'finished'].includes(match.status?.type) && 
               match.homeScore?.current !== undefined && 
               match.awayScore?.current !== undefined ? (
                <div className="text-xl font-bold bg-gray-100 px-4 py-2 rounded-md">
                  {match.homeScore.current} - {match.awayScore.current}
                </div>
              ) : (
                <div className="text-lg font-medium text-gray-500">vs</div>
              )}
              
              {match.status?.type === 'inprogress' && match.status?.description && (
                <span className="mt-1 text-xs text-red-600 font-medium animate-pulse">
                  {match.status.description}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-center w-2/5">
              {match.awayTeam?.pictureUrl ? (
                <img 
                  src={match.awayTeam.pictureUrl} 
                  alt={match.awayTeam.name} 
                  className="w-8 h-8 mr-2"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : null}
              <div className="font-bold text-lg text-gray-800">{match.awayTeam?.name || 'Away Team'}</div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 mt-3 flex flex-wrap text-sm text-gray-600 gap-4">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              {formatDate(match.startTimestamp)}
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {formatTime(match.startTimestamp)}
            </div>
            {match.venue?.name && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                {match.venue.name}
              </div>
            )}
          </div>
          
          {/* Display Man of the Match for finished matches */}
          {match.status?.type === 'finished' && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l.828.828A1 1 0 0113.828 5H15a1 1 0 110 2h-1.172a1 1 0 01-.707-.293L12.293 5.88a1 1 0 01.29-1.587l.06-.033zM15 10a1 1 0 01.707.293l.828.828A1 1 0 0116.828 13H18a1 1 0 110 2h-1.172a1 1 0 01-.707-.293L15.293 13.88a1 1 0 01.29-1.587l.06-.033z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-gray-700">Man of the Match:</span>
                {match.manOfTheMatch ? (
                  <span className="ml-2 text-blue-700 font-medium">{match.manOfTheMatch.name}</span>
                ) : (
                  <span className="ml-2 italic text-gray-500">Not yet announced</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Pagination controls component with improved pagination display
  const PaginationControls = () => (
    <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200">
      <button 
        onClick={() => paginate(currentPage - 1)} 
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded-md font-medium flex items-center ${
          currentPage === 1 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700 transition-colors'
        }`}
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        Previous
      </button>
      
      <div className="hidden md:flex space-x-1">
        {getPaginationNumbers().map((number, index) => (
          number === '...' ? (
            <span 
              key={`ellipsis-${index}`}
              className="w-8 h-8 flex items-center justify-center text-gray-600"
            >
              ...
            </span>
          ) : (
            <button
              key={number}
              onClick={() => paginate(number)}
              className={`w-8 h-8 flex items-center justify-center rounded-md ${
                currentPage === number
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {number}
            </button>
          )
        ))}
      </div>
      
      {/* Mobile pagination info */}
      <div className="md:hidden text-gray-600 font-medium">
        Page {currentPage} of {totalPages}
      </div>
      
      <button 
        onClick={() => paginate(currentPage + 1)} 
        disabled={currentPage === totalPages}
        className={`px-4 py-2 rounded-md font-medium flex items-center ${
          currentPage === totalPages 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700 transition-colors'
        }`}
      >
        Next
        <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-xl rounded-xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Football Fixtures
        </h1>
        <div className="flex items-center mt-2">
          <div className="h-1 w-12 bg-indigo-600 rounded mr-2"></div>
          <span className="text-indigo-600 font-medium">April 15-16, 2025</span>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading matches...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-md text-red-700">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {currentMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-gray-50 py-16 rounded-lg border border-gray-200">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="mt-4 text-gray-600 text-lg">No matches available for these dates.</p>
              </div>
            ) : (
              currentMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))
            )}
          </div>

          {matches.length > MATCHES_PER_PAGE && <PaginationControls />}
        </>
      )}
    </div>
  );
}

export default FootballMatchesApp;