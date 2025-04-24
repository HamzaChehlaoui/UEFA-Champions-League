import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [matches, setMatches] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const matchesPerPage = 2;

  // Fetching matches from the API
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await axios.get('https://api.sofascore.com/api/v1/sport/football/scheduled-events/2025-04-15');
        setMatches(response.data.events);  // Ensure this is the correct data structure
      } catch (error) {
        console.error('Error fetching matches:', error);
      }
    };
    fetchMatches();
  }, []);

  // Calculating the matches to display on the current page
  const indexOfLastMatch = currentPage * matchesPerPage;
  const indexOfFirstMatch = indexOfLastMatch - matchesPerPage;
  const currentMatches = matches.slice(indexOfFirstMatch, indexOfLastMatch);

  // Pagination function
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="App">
      <h1>Quarter-Final Results - UEFA Champions League 2024/2025</h1>
      <div>
        {currentMatches.map((match) => (
          <div key={match.id}>
            {/* Check if team1 and team2 exist before trying to access 'name' */}
            <h2>{match.team1?.name || 'Unknown Team'} vs {match.team2?.name || 'Unknown Team'}</h2>
            <p>Score: {match.score1} - {match.score2}</p>
            <p>Man of the Match: {match.manOfTheMatch || 'Unknown'}</p>
          </div>
        ))}
      </div>

      {/* Pagination buttons */}
      <div>
        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage * matchesPerPage >= matches.length}>Next</button>
      </div>
    </div>
  );
}

export default App;
