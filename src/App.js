import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const matchesPerPage = 3;

  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      try {
        const [res15, res16] = await Promise.all([
          axios.get('https://api.sofascore.com/api/v1/sport/football/scheduled-events/2025-04-15'),
          axios.get('https://api.sofascore.com/api/v1/sport/football/scheduled-events/2025-04-16'),
        ]);
                
        const allMatches = [...res15.data.events, ...res16.data.events];
        
        const filteredMatches = allMatches.filter((match) => {
          const dateUTC = new Date(match.startTimestamp * 1000).toISOString().split('T')[0];
          return dateUTC === '2025-04-15' || dateUTC === '2025-04-16';
        });
        
        // Pour chaque match terminé, récupérer les détails qui pourraient inclure le Man of the Match
        const enhancedMatches = await Promise.all(
          filteredMatches.map(async (match) => {
            if (match.status?.type === 'finished') {
              try {
                // Récupérer les détails du match qui pourraient contenir le Man of the Match
                const detailsResponse = await axios.get(`https://api.sofascore.com/api/v1/event/${match.id}`);
                
                // Si l'API renvoie des informations sur le Man of the Match
                if (detailsResponse.data?.event?.bestPlayer) {
                  return {
                    ...match,
                    manOfTheMatch: detailsResponse.data.event.bestPlayer
                  };
                }
              } catch (error) {
                console.error(`Error fetching details for match ${match.id}:`, error);
              }
            }
            return match;
          })
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
  }, []);

  const indexOfLastMatch = currentPage * matchesPerPage;
  const indexOfFirstMatch = indexOfLastMatch - matchesPerPage;
  const currentMatches = matches.slice(indexOfFirstMatch, indexOfLastMatch);
  const totalPages = Math.ceil(matches.length / matchesPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'notstarted':
        return 'text-blue-600';
      case 'inprogress':
        return 'text-green-600';
      case 'finished':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 border-b pb-2">
          Upcoming Football Matches
          <span className="text-blue-600 ml-2">April 15-16, 2025</span>
        </h1>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 p-4 rounded text-red-700">{error}</div>
      ) : (
        <>
          <div className="space-y-4">
            {currentMatches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No matches available for these dates.</div>
            ) : (
              currentMatches.map((match, index) => (
                <div 
                  key={match.id || index} 
                  className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                    <div className="font-medium text-gray-700">
                      {match.tournament?.name || 'Football Match'}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status?.type)}`}>
                      {match.status?.type === 'notstarted' ? 'Upcoming' : 
                       match.status?.type === 'inprogress' ? 'Live' : 'Completed'}
                    </span>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-3">
                        {match.homeTeam?.name && (
                          <div className="font-bold text-lg">{match.homeTeam.name}</div>
                        )}
                        <div className="text-lg font-bold text-gray-500">vs</div>
                        {match.awayTeam?.name && (
                          <div className="font-bold text-lg">{match.awayTeam.name}</div>
                        )}
                      </div>
                      
                      {/* Afficher le score si le match est en cours ou terminé */}
                      {(match.status?.type === 'inprogress' || match.status?.type === 'finished') && match.homeScore?.current !== undefined && match.awayScore?.current !== undefined && (
                        <div className="text-xl font-bold">
                          {match.homeScore.current} - {match.awayScore.current}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap text-sm text-gray-600 gap-4">
                      <div className="flex items-center">
                        <span className="mr-1">📅</span>
                        {formatDate(match.startTimestamp)}
                      </div>
                      <div className="flex items-center">
                        <span className="mr-1">⏰</span>
                        {formatTime(match.startTimestamp)}
                      </div>
                      {match.venue?.name && (
                        <div className="flex items-center">
                          <span className="mr-1">🏟️</span>
                          {match.venue.name}
                        </div>
                      )}
                    </div>
                    
                    {/* Afficher Man of the Match pour les matchs terminés */}
                    {match.status?.type === 'finished' && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center">
                          <span className="mr-2 text-yellow-500">🏆</span>
                          <span className="font-medium">Man of the Match:</span>
                          {match.manOfTheMatch ? (
                            <span className="ml-2 text-blue-600 font-medium">{match.manOfTheMatch.name}</span>
                          ) : (
                            <span className="ml-2 italic text-gray-500">Not yet announced</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {matches.length > matchesPerPage && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded font-medium ${
                  currentPage === 1 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Previous
              </button>
              
              <div className="text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              
              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded font-medium ${
                  currentPage === totalPages 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;