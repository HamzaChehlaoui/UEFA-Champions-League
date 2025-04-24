import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [matches, setMatches] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const matchesPerPage = 2;

  // Fetching the matches from the API
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await axios.get('https://api.sofascore.com/api/v1/sport/football/scheduled-events/2025-04-15');
        setMatches(response.data.events);  // Make sure this is the correct structure of the data
      } catch (error) {
        console.error('Error fetching matches:', error);
      }
    };
    fetchMatches();
  }, []);

  // Calculate the matches to display on the current page
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
            <h2>{match.team1.name} vs {match.team2.name}</h2>
            <p>Score: {match.score1} - {match.score2}</p>
            <p>Man of the Match: {match.manOfTheMatch}</p>
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
