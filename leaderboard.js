document.addEventListener('DOMContentLoaded', () => {
    const btnDecision = document.getElementById('btn-tab-decision');
    const btnPuzzle = document.getElementById('btn-tab-puzzle');
    const leaderboardBody = document.getElementById('leaderboard-body');
    
    // Columns
    const colScore = document.getElementById('col-score');
    const colMoves = document.getElementById('col-moves');
    const colTime = document.getElementById('col-time');

    let currentListener = null; // To store the active Firestore listener

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    }

    function renderTable(scores, type) {
        leaderboardBody.innerHTML = ''; // Clear old scores
        
        if (scores.length === 0) {
            leaderboardBody.innerHTML = `<tr><td colspan="5" class="px-4 py-6 text-center text-gray-400">No scores yet!</td></tr>`;
            return;
        }

        scores.forEach((doc, index) => {
            const data = doc.data();
            const rank = index + 1;
            const player = data.userEmail || 'Anonymous'; // Use email for now
            
            let row;
            if (type === 'decisionPoint') {
                row = `
                    <tr class="hover:bg-gray-700">
                        <td class="px-4 py-3 whitespace-nowrap text-white">${rank}</td>
                        <td class="px-4 py-3 whitespace-nowrap text-white">${player}</td>
                        <td class="px-4 py-3 whitespace-nowrap text-green-400 font-bold">${data.score}</td>
                    </tr>
                `;
            } else { // 15Puzzle
                 row = `
                    <tr class="hover:bg-gray-700">
                        <td class="px-4 py-3 whitespace-nowrap text-white">${rank}</td>
                        <td class="px-4 py-3 whitespace-nowrap text-white">${player}</td>
                        <td class="px-4 py-3 whitespace-nowrap text-white">${data.moves}</td>
                        <td class="px-4 py-3 whitespace-nowrap text-white">${formatTime(data.timeInSeconds)}</td>
                    </tr>
                `;
            }
            leaderboardBody.innerHTML += row;
        });
    }

    function fetchLeaderboard(gameType) {
        // Unsubscribe from any previous listener
        if (currentListener) {
            currentListener();
        }
        
        leaderboardBody.innerHTML = `<tr><td colspan="5" class="px-4 py-6 text-center text-gray-400">Loading...</td></tr>`;

        let query;
        if (gameType === 'decisionPoint') {
            // Decision Point: Highest score wins
            colScore.classList.remove('hidden');
            colMoves.classList.add('hidden');
            colTime.classList.add('hidden');
            
            query = db.collection('scores')
                .where('game', '==', 'decisionPoint')
                .where('didWin', '==', true) // Only show winners
                .orderBy('score', 'desc')
                .limit(20);

        } else {
            // 15-Puzzle: Fewest moves wins
            colScore.classList.add('hidden');
            colMoves.classList.remove('hidden');
            colTime.classList.remove('hidden');
            
            query = db.collection('scores')
                .where('game', '==', '15Puzzle')
                .orderBy('moves', 'asc')
                .orderBy('timeInSeconds', 'asc')
                .limit(20);
        }

        // Set up the real-time listener
        currentListener = query.onSnapshot(snapshot => {
            renderTable(snapshot.docs, gameType);
        }, error => {
            console.error("Error fetching leaderboard: ", error);
            leaderboardBody.innerHTML = `<tr><td colspan="5" class="px-4 py-6 text-center text-red-400">Error loading scores.</td></tr>`;
        });
    }

    // --- Tab Listeners ---
    btnDecision.addEventListener('click', () => {
        fetchLeaderboard('decisionPoint');
        btnDecision.classList.add('bg-blue-600', 'text-white');
        btnDecision.classList.remove('text-gray-300', 'hover:bg-gray-700');
        btnPuzzle.classList.add('text-gray-300', 'hover:bg-gray-700');
        btnPuzzle.classList.remove('bg-blue-600', 'text-white');
    });

    btnPuzzle.addEventListener('click', () => {
        fetchLeaderboard('15Puzzle');
        btnPuzzle.classList.add('bg-blue-600', 'text-white');
        btnPuzzle.classList.remove('text-gray-300', 'hover:bg-gray-700');
        btnDecision.classList.add('text-gray-300', 'hover:bg-gray-700');
        btnDecision.classList.remove('bg-blue-600', 'text-white');
    });

    // --- Initial Load ---
    fetchLeaderboard('decisionPoint');
});