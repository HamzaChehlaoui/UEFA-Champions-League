import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [matches, setMatches] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const matchesPerPage = 2;

  // جلب المباريات من API-Football
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await axios.get('https://api.football-data.org/v2/competitions/CL/matches', {
          headers: {
            'X-Auth-Token': 'YOUR_API_KEY', // ضع مفتاح الـ API هنا
          },
        });
        setMatches(response.data.matches);  // تأكد من هيكل البيانات المسترجعة
      } catch (error) {
        console.error('Error fetching matches:', error);
      }
    };
    fetchMatches();
  }, []);

  // حساب المباريات المعروضة في الصفحة الحالية
  const indexOfLastMatch = currentPage * matchesPerPage;
  const indexOfFirstMatch = indexOfLastMatch - matchesPerPage;
  const currentMatches = matches.slice(indexOfFirstMatch, indexOfLastMatch);

  // دالة التصفح بين الصفحات
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="App">
      <h1>نتائج مباريات ربع النهائي - دوري أبطال أوروبا 2024/2025</h1>
      <div>
        {currentMatches.map((match) => (
          <div key={match.id}>
            <h2>{match.homeTeam.name} vs {match.awayTeam.name}</h2>
            <p>النتيجة: {match.score.fullTime.homeTeam} - {match.score.fullTime.awayTeam}</p>
            <p>رجل المباراة: {match.manOfTheMatch || 'غير معروف'}</p>
          </div>
        ))}
      </div>

      {/* زر التنقل بين الصفحات */}
      <div>
        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>السابق</button>
        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage * matchesPerPage >= matches.length}>التالي</button>
      </div>
    </div>
  );
}

export default App;
