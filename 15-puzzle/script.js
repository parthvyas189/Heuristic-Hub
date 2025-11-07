// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // == STATE & CONSTANTS
    // =================================================================

    const GRID_SIZE = 4;
    const TILE_COUNT = GRID_SIZE * GRID_SIZE;
    
    // boardState holds the numbers 0-15. 0 represents the empty tile.
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
    
    // Win Overlay Elements
    const winOverlay = document.getElementById('win-overlay');
    const winTimeElement = document.getElementById('win-time');
    const winMovesElement = document.getElementById('win-moves');
    const winNewGameBtn = document.getElementById('win-new-game-btn');
    
    // =================================================================
    // == CORE GAME LOGIC
    // =================================================================

    /**
     * Initializes the entire game.
     * Called on page load and by "New Game" buttons.
     */
    function init() {
        stopGame(); // Stop any existing game
        createSolvedBoard(); // Create the tiles
        shuffleBoard(); // Shuffle them
        renderBoard(); // Display them
        startGame(); // Start the timer and tracking
    }

    /**
     * Creates the initial set of tiles and adds them to the DOM.
     * The board is initially in a "solved" state.
     */
    function createSolvedBoard() {
        boardElement.innerHTML = '';
        boardState = [];

        for (let i = 0; i < TILE_COUNT; i++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            
            // Numbers 1-15, and 0 for the empty tile (last one)
            const value = (i + 1) % TILE_COUNT;
            boardState.push(value);

            // Store the tile's DOM element and its index for easy access
            tile.dataset.index = i; 
            boardElement.appendChild(tile);
        }
        emptyTileIndex = TILE_COUNT - 1;
    }

    /**
     * Shuffles the board by making a large number of random, valid moves.
     * This guarantees the puzzle is always solvable.
     */
    function shuffleBoard() {
        const SHUFFLE_MOVES = 200; // Number of random moves to make
        
        for (let i = 0; i < SHUFFLE_MOVES; i++) {
            const movableIndices = getMovableNeighbors(emptyTileIndex);
            // Pick a random neighbor to swap with
            const randomIndex = Math.floor(Math.random() * movableIndices.length);
            const neighborIndex = movableIndices[randomIndex];
            
            // Swap in the state
            swapTiles(emptyTileIndex, neighborIndex, false); // 'false' = don't check win
        }
    }

    /**
     * Swaps two tiles in the boardState array.
     * @param {number} index1 - The first tile's index.
     * @param {number} index2 - The second tile's index.
     * @param {boolean} [checkWin=true] - Whether to check for a win after swapping.
     */
    function swapTiles(index1, index2, checkWin = true) {
        // Swap in the array
        [boardState[index1], boardState[index2]] = [boardState[index2], boardState[index1]];
        
        // Update the empty tile's index
        if (boardState[index1] === 0) {
            emptyTileIndex = index1;
        } else if (boardState[index2] === 0) {
            emptyTileIndex = index2;
        }

        if (checkWin) {
            moves++;
            updateStats();
            
            // Check win condition
            if (isSolved()) {
                finishGame();
            }
        }
    }

    /**
     * Renders the current boardState to the DOM.
     * This function updates tile numbers, classes, and listeners.
     */
    function renderBoard() {
        // Get all tile elements from the DOM
        const tileElements = boardElement.children;
        const movableIndices = getMovableNeighbors(emptyTileIndex);

        for (let i = 0; i < TILE_COUNT; i++) {
            const tile = tileElements[i];
            const value = boardState[i];
            
            // Update number
            tile.textContent = value === 0 ? '' : value;
            
            // Remove all dynamic classes
            tile.classList.remove('empty', 'movable', 'correct'); // <-- ADDED 'correct'
            // Remove old listener to be safe
            tile.onclick = null; 

            if (value === 0) {
                tile.classList.add('empty');
            } else if (movableIndices.includes(i)) {
                // This tile is next to the empty space
                tile.classList.add('movable');
                // Add click listener ONLY to movable tiles
                tile.onclick = () => handleTileClick(i);
            }

            // NEW: Check if the tile is in the correct position
            // (and it's not the empty tile)
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
        
        // Start the timer
        clearInterval(timerInterval); // Clear any old timer
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
    }

    // =================================================================
    // == EVENT HANDLERS
    // =================================================================

    /**
     * NEW: Handles keyboard arrow key presses for tile movement.
     * @param {KeyboardEvent} event - The keydown event.
     */
    function handleKeyDown(event) {
        if (!gameInProgress) return;

        let targetTileIndex = -1;
        
        // Find which tile to "click" based on arrow key
        switch (event.key) {
            case 'ArrowUp':
                // We want to "click" the tile *below* the empty space
                targetTileIndex = emptyTileIndex + GRID_SIZE;
                break;
            case 'ArrowDown':
                // We want to "click" the tile *above* the empty space
                targetTileIndex = emptyTileIndex - GRID_SIZE;
                break;
            case 'ArrowLeft':
                // We want to "click" the tile to the *right* of the empty space
                targetTileIndex = emptyTileIndex + 1;
                break;
            case 'ArrowRight':
                // We want to "click" the tile to the *left* of the empty space
                targetTileIndex = emptyTileIndex - 1;
                break;
            default:
                return; // Not an arrow key
        }

        // Check if the target tile is valid and is a neighbor
        const movableIndices = getMovableNeighbors(emptyTileIndex);
        if (targetTileIndex >= 0 && targetTileIndex < TILE_COUNT && movableIndices.includes(targetTileIndex)) {
            // Prevent default arrow key behavior (like scrolling)
            event.preventDefault(); 
            // Simulate a click on that tile
            handleTileClick(targetTileIndex);
        }
    }

    /**
     * Handles the click event on a movable tile.
     * @param {number} tileIndex - The index (0-15) of the tile that was clicked.
     */
    function handleTileClick(tileIndex) {
        if (!gameInProgress) return;
        
        // Swap the clicked tile with the empty tile
        swapTiles(tileIndex, emptyTileIndex);

        // Re-render the board to update classes and listeners
        renderBoard();
    }

    /**
     * Handles the "New Game" button click (on-page and on-overlay).
     */
    /* DELETED this function:
    function handleNewGameClick() {
        init(); // Re-initialize the entire game
    }
    */

    // =================================================================
    // == HELPER FUNCTIONS
    // =================================================================

    /**
     * Updates the Moves and Time display on the page.
     */
    function updateStats() {
        movesElement.textContent = moves;
        timerElement.textContent = formatTime(timer);
    }

    /**
     * Increments the timer and updates the display.
     */
    function updateTimer() {
        timer++;
        timerElement.textContent = formatTime(timer);
    }

    /**
     * Formats a number of seconds into MM:SS format.
     * @param {number} seconds - The time in seconds.
     * @returns {string} The formatted time string.
     */
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        // PadStart adds a '0' if the number is less than 2 digits
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    /**
     * Checks if the board is in the solved state.
     * @returns {boolean} True if solved, false otherwise.
     */
    function isSolved() {
        for (let i = 0; i < TILE_COUNT - 1; i++) {
            if (boardState[i] !== i + 1) {
                return false;
            }
        }
        // Check that the last tile is the empty one
        return boardState[TILE_COUNT - 1] === 0;
    }

    /**
     * Gets the valid neighbors of a given tile index.
     * @param {number} index - The index (0-15) of the tile.
     * @returns {number[]} An array of indices that are valid neighbors.
     */
    function getMovableNeighbors(index) {
        const neighbors = [];
        const row = Math.floor(index / GRID_SIZE);
        const col = index % GRID_SIZE;

        // Check Up
        if (row > 0) neighbors.push(index - GRID_SIZE);
        // Check Down
        if (row < GRID_SIZE - 1) neighbors.push(index + GRID_SIZE);
        // Check Left
        if (col > 0) neighbors.push(index - 1);
        // Check Right
        if (col < GRID_SIZE - 1) neighbors.push(index + 1);

        return neighbors;
    }

    // =================================================================
    // == INITIALIZATION & EVENT LISTENERS
    // =================================================================

    // Add click listeners to the "New Game" buttons
    // Point them directly to the init function
    newGameBtn.addEventListener('click', init);
    winNewGameBtn.addEventListener('click', init);

    // NEW: Add keyboard listener
    document.addEventListener('keydown', handleKeyDown);

    // Start the first game!
    init();
});