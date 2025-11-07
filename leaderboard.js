// --- Firebase and DOM Elements ---
// We REMOVED const db and const auth, since they are already
// defined in FirebaseConfig.js and are available globally.
const usersCollection = db.collection('users');
const scoresCollection = db.collection('scores');

const btnTabDecision = document.getElementById('btn-tab-decision');
const btnTabPuzzle = document.getElementById('btn-tab-puzzle');
const leaderboardBody = document.getElementById('leaderboard-body');
const headerRow = document.getElementById('leaderboard-header-row');

// --- State ---
let currentTab = 'decision';
let unsubscribeDecision;
let unsubscribePuzzle;

// --- Utility Functions ---
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// --- Header/Tab Toggling ---
function toggleHeaderCols(tab) {
    const cols = headerRow.querySelectorAll('[data-col]');
    cols.forEach(col => {
        if (col.dataset.col === tab) {
            col.classList.remove('hidden');
        } else {
            col.classList.add('hidden');
        }
    });
    // Adjust colspan for loading/error
    const loadingRow = leaderboardBody.querySelector('[colspan]');
    if (loadingRow) {
        loadingRow.setAttribute('colspan', tab === 'dp' ? '6' : '4');
    }
}

function showDecisionPointTab() {
    if (currentTab === 'decision') return;
    currentTab = 'decision';

    btnTabDecision.classList.add('bg-blue-600', 'text-white');
    btnTabDecision.classList.remove('text-gray-300', 'hover:bg-gray-700');
    
    btnTabPuzzle.classList.add('text-gray-300', 'hover:bg-gray-700');
    btnTabPuzzle.classList.remove('bg-blue-600', 'text-white');
    
    toggleHeaderCols('dp');
    if (unsubscribePuzzle) unsubscribePuzzle();
    listenForDecisionPointScores();
}

function showPuzzleTab() {
    if (currentTab === 'puzzle') return;
    currentTab = 'puzzle';

    btnTabPuzzle.classList.add('bg-blue-600', 'text-white');
    btnTabPuzzle.classList.remove('text-gray-300', 'hover:bg-gray-700');
    
    btnTabDecision.classList.add('text-gray-300', 'hover:bg-gray-700');
    btnTabDecision.classList.remove('bg-blue-600', 'text-white');

    toggleHeaderCols('p15');
    if (unsubscribeDecision) unsubscribeDecision();
    listenForPuzzleScores();
}

// --- Leaderboard Rendering ---
function renderLeaderboard(snapshot, type) {
    if (snapshot.empty) {
        leaderboardBody.innerHTML = `
            <tr>
                <td colspan="${type === 'dp' ? 6 : 4}" class="px-4 py-6 text-center text-gray-400">
                    No scores found. Be the first!
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    let rank = 1;

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        if (type === 'dp') {
            const winRate = (data.dp_win_rate).toFixed(1);
            html += `
                <tr class="hover:bg-gray-700">
                    <td class="px-4 py-3 font-medium text-white">${rank}</td>
                    <td class="px-4 py-3 text-gray-300">${data.username || data.email}</td>
                    <td class="px-4 py-3 text-gray-300">${winRate}%</td>
                    <td class="px-4 py-3 text-gray-300">${data.dp_wins || 0}</td>
                    <td class="px-4 py-3 text-gray-300">${data.dp_losses || 0}</td>
                    <td class="px-4 py-3 text-gray-300">${data.dp_total_games || 0}</td>
                </tr>
            `;
        } else if (type === 'p15') {
            html += `
                <tr class="hover:bg-gray-700">
                    <td class="px-4 py-3 font-medium text-white">${rank}</td>
                    <td class="px-4 py-3 text-gray-300">${data.userEmail}</td>
                    <td class="px-4 py-3 text-gray-300">${data.moves}</td>
                    <td class="px-4 py-3 text-gray-300">${formatTime(data.timeInSeconds)}</td>
                </tr>
            `;
        }
        rank++;
    });
    
    leaderboardBody.innerHTML = html;
}

function renderError(error) {
    console.error("Error fetching leaderboard: ", error);
    leaderboardBody.innerHTML = `
        <tr>
            <td colspan="${currentTab === 'decision' ? 6 : 4}" class="px-4 py-6 text-center text-red-400">
                Error loading scores.
                <span class="block text-xs text-gray-500">${error.message}</span>
            </td>
        </tr>
    `;
}

// --- Firestore Listeners ---
function listenForDecisionPointScores() {
    leaderboardBody.innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-center text-gray-400">Loading...</td></tr>`;

    // *** THIS IS THE FIX (using v8 "compat" syntax) ***
    const dpQuery = usersCollection
        .where('dp_win_rate', '>', 0)
        .orderBy('dp_win_rate', 'desc')
        .orderBy('dp_total_games', 'desc')
        .limit(20);

    // Note: We are now calling .onSnapshot() ON the query object
    unsubscribeDecision = dpQuery.onSnapshot(
        (snapshot) => renderLeaderboard(snapshot, 'dp'),
        (error) => renderError(error)
    );
}

function listenForPuzzleScores() {
    leaderboardBody.innerHTML = `<tr><td colspan="4" class="px-4 py-6 text-center text-gray-400">Loading...</td></tr>`;
    
    // *** THIS IS THE FIX (using v8 "compat" syntax) ***
    const p15Query = scoresCollection
        .where('game', '==', '15Puzzle')
        .orderBy('moves', 'asc')
        .orderBy('timeInSeconds', 'asc')
        .limit(20);
    
    // Note: We are now calling .onSnapshot() ON the query object
    unsubscribePuzzle = p15Query.onSnapshot(
        (snapshot) => renderLeaderboard(snapshot, 'p15'),
        (error) => renderError(error)
    );
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    btnTabDecision.addEventListener('click', showDecisionPointTab);
    btnTabPuzzle.addEventListener('click', showPuzzleTab);

    // Start on the Decision Point tab by default
    showDecisionPointTab();
});