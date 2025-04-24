import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  let [matches, setMatches] = useState([]);
  let [currentPage, setCurrentPage] = useState(1);
  let matchesPerPage = 3;

  useEffect(() => {
    let fetchMatches = async () => {
      try {
        let [res15, res16] = await Promise.all([
          axios.get('https://api.sofascore.com/api/v1/sport/football/scheduled-events/2025-04-15'),
          axios.get('https://api.sofascore.com/api/v1/sport/football/scheduled-events/2025-04-16'),
        ]);
  
        
        let allMatches = [...res15.data.events, ...res16.data.events];
  
        let filteredMatches = allMatches.filter((match) => {
          let dateUTC = new Date(match.startTimestamp * 1000).toISOString().split('T')[0];
          return dateUTC === '2025-04-15' || dateUTC === '2025-04-16';
        });
  
        setMatches(filteredMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
      }
    };
    fetchMatches();
  }, []);

  let indexOfLastMatch = currentPage * matchesPerPage;
  let indexOfFirstMatch = indexOfLastMatch - matchesPerPage;
  let currentMatches = matches.slice(indexOfFirstMatch, indexOfLastMatch);

  let paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="App">
      <h1>Matches on April 15 & 16, 2025</h1>
      <div>
        {currentMatches.length === 0 ? (
          <p>No matches available.</p>
        ) : (
          currentMatches.map((match) => (
            <div key={match.id} style={{ border: '1px solid #ccc', marginBottom: '10px', padding: '10px' }}>
              <h2>{match.homeTeam.name} vs {match.awayTeam.name}</h2>
              <p>Date: {new Date(match.startTimestamp * 1000).toLocaleDateString()}</p>
              <p>Time: {new Date(match.startTimestamp * 1000).toLocaleTimeString()}</p>
              <p>Status: {match.status.type}</p>
            </div>
          ))
        )}
      </div>

      <div>
        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage * matchesPerPage >= matches.length}>Next</button>
      </div>
    </div>
  );
}

export default App;
