import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [matches, setMatches] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const matchesPerPage = 2;

  // جلب المباريات من API
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await axios.get('https://api.sofascore.com/api/v1/sport/football/scheduled-events/2025-04-15');
        setMatches(response.data.events);  // تأكد من أن هذه هي البنية الصحيحة للبيانات
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
            {/* تحقق إذا كانت team1 و team2 موجودتين قبل محاولة الوصول إلى name */}
            <h2>{match.team1?.name || 'فريق غير معروف'} vs {match.team2?.name || 'فريق غير معروف'}</h2>
            <p>النتيجة: {match.score1} - {match.score2}</p>
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
