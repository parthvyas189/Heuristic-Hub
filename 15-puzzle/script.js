// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // == STATE & CONSTANTS
    // =================================================================
    const GRID_SIZE = 4;
    const TILE_COUNT = GRID_SIZE * GRID_SIZE;
    
    let boardState = []; 
    let emptyTileIndex = -1;
    let moves = 0;
    let timer = 0;
    let timerInterval = null;
    let gameInProgress = false;

    // =================================================================
    // == DOM ELEMENTS
    // =================================================================
    const boardElement = document.getElementById('game-board');
    const movesElement = document.getElementById('moves-count');
    const timerElement = document.getElementById('timer');
    const newGameBtn = document.getElementById('new-game-btn');
    const winOverlay = document.getElementById('win-overlay');
    const winTimeElement = document.getElementById('win-time');
    const winMovesElement = document.getElementById('win-moves');
    const winNewGameBtn = document.getElementById('win-new-game-btn');
    
    // =================================================================
    // == Firebase State
    // =================================================================
    let currentUser = null; // To store the logged-in user object

    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            console.log("User logged in:", user.email);
        } else {
            currentUser = null;
            console.log("User logged out.");
        }
        // Show the body now that auth is checked
        document.body.style.display = 'flex';
    });

    // =================================================================
    // == CORE GAME LOGIC
    // =================================================================

    /**
     * Initializes the entire game.
     */
    function init() {
        if (!currentUser) {
            alert("You must be logged in to play.");
            // Use your new filename
            window.location.href = '../AuthPage.html';
            return;
        }
        stopGame(); 
        createSolvedBoard(); 
        shuffleBoard(); 
        renderBoard(); 
        startGame(); 
    }

    /**
     * Creates the initial set of tiles and adds them to the DOM.
     */
    function createSolvedBoard() {
        boardElement.innerHTML = '';
        boardState = [];
        for (let i = 0; i < TILE_COUNT; i++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            const value = (i + 1) % TILE_COUNT;
            boardState.push(value);
            tile.dataset.index = i; 
            boardElement.appendChild(tile);
        }
        emptyTileIndex = TILE_COUNT - 1;
    }

    /**
     * Shuffles the board by making random, valid moves.
     */
    function shuffleBoard() {
        const SHUFFLE_MOVES = 200; 
        for (let i = 0; i < SHUFFLE_MOVES; i++) {
            const movableIndices = getMovableNeighbors(emptyTileIndex);
            const randomIndex = Math.floor(Math.random() * movableIndices.length);
            const neighborIndex = movableIndices[randomIndex];
            swapTiles(emptyTileIndex, neighborIndex, false); 
        }
    }

    /**
     * Swaps two tiles in the boardState array.
     */
    function swapTiles(index1, index2, checkWin = true) {
        [boardState[index1], boardState[index2]] = [boardState[index2], boardState[index1]];
        
        if (boardState[index1] === 0) emptyTileIndex = index1;
        else if (boardState[index2] === 0) emptyTileIndex = index2;

        if (checkWin) {
            moves++;
            updateStats();
            if (isSolved()) {
                finishGame();
            }
        }
    }

    /**
    * Renders the current boardState to the DOM.
     */
    function renderBoard() {
        const tileElements = boardElement.children;
        const movableIndices = getMovableNeighbors(emptyTileIndex);

        for (let i = 0; i < TILE_COUNT; i++) {
            const tile = tileElements[i];
            const value = boardState[i];
            
            tile.textContent = value === 0 ? '' : value;
            tile.classList.remove('empty', 'movable', 'correct'); 
            tile.onclick = null; 

            if (value === 0) {
                tile.classList.add('empty');
            } else if (movableIndices.includes(i)) {
                tile.classList.add('movable');
                tile.onclick = () => handleTileClick(i);
            }
            if (value !== 0 && value === i + 1) {
                tile.classList.add('correct');
            }
        }
    }

    /**
     * Starts the game: resets stats, starts timer.
     */
    function startGame() {
        moves = 0;
        timer = 0;
        updateStats();
        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);
        gameInProgress = true;
        winOverlay.classList.add('hidden');
    }

    /**
     * Ends the game: stops timer and movement.
     */
    function stopGame() {
        clearInterval(timerInterval);
        gameInProgress = false;
    }

    /**
     * Called when the puzzle is solved.
     */
    function finishGame() {
        stopGame();
        
        // Show win overlay
        winTimeElement.textContent = formatTime(timer);
        winMovesElement.textContent = moves;
        winOverlay.classList.remove('hidden');
        
        // Save score to Firestore
        if (currentUser) {
            saveScoreToFirebase();
        }
    }
    
    /**
     * Saves the game result to Firestore.
     */
    function saveScoreToFirebase() {
        if (!currentUser) return; // Should not happen
        
        db.collection('scores').add({
            game: '15Puzzle',
            userId: currentUser.uid,
            userEmail: currentUser.email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            
            moves: moves,
            timeInSeconds: timer,

            // Set other game's fields to null
            score: null,
            didWin: null
        })
        .then(() => {
            console.log("Score saved!");
        })
        .catch((error) => {
            console.error("Error saving score: ", error);
        });
    }

    // =================================================================
    // == EVENT HANDLERS
    // =================================================================

    /**
     * NEW: Handles keyboard arrow key presses for tile movement.
     */
    function handleKeyDown(event) {
        if (!gameInProgress) return;
        let targetTileIndex = -1;
        
        switch (event.key) {
            case 'ArrowUp': targetTileIndex = emptyTileIndex + GRID_SIZE; break;
            case 'ArrowDown': targetTileIndex = emptyTileIndex - GRID_SIZE; break;
            case 'ArrowLeft': targetTileIndex = emptyTileIndex + 1; break;
            case 'ArrowRight': targetTileIndex = emptyTileIndex - 1; break;
            default: return; 
        }

        const movableIndices = getMovableNeighbors(emptyTileIndex);
        if (targetTileIndex >= 0 && targetTileIndex < TILE_COUNT && movableIndices.includes(targetTileIndex)) {
            event.preventDefault(); 
            handleTileClick(targetTileIndex);
        }
    }

    /**
     * Handles the click event on a movable tile.
     */
    function handleTileClick(tileIndex) {
        if (!gameInProgress) return;
        swapTiles(tileIndex, emptyTileIndex);
        renderBoard();
    }

    // =================================================================
    // == HELPER FUNCTIONS
    // =================================================================

    function updateStats() {
        movesElement.textContent = moves;
        timerElement.textContent = formatTime(timer);
    }

    function updateTimer() {
        timer++;
        timerElement.textContent = formatTime(timer);
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function isSolved() {
        for (let i = 0; i < TILE_COUNT - 1; i++) {
            if (boardState[i] !== i + 1) return false;
        }
        return boardState[TILE_COUNT - 1] === 0;
    }

    function getMovableNeighbors(index) {
        const neighbors = [];
        const row = Math.floor(index / GRID_SIZE);
        const col = index % GRID_SIZE;
        if (row > 0) neighbors.push(index - GRID_SIZE); // Up
        if (row < GRID_SIZE - 1) neighbors.push(index + GRID_SIZE); // Down
        if (col > 0) neighbors.push(index - 1); // Left
        if (col < GRID_SIZE - 1) neighbors.push(index + 1); // Right
        return neighbors;
    }

    // =================================================================
    // == INITIALIZATION & EVENT LISTENERS
    // =================================================================

    newGameBtn.addEventListener('click', init);
    winNewGameBtn.addEventListener('click', init);
    document.addEventListener('keydown', handleKeyDown);

    // Start the first game!
    // init(); // Don't auto-start, wait for auth.
});