// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // == DOM ELEMENTS
    // =================================================================
    const tileGrid = document.getElementById('tile-grid');
    const statusText = document.getElementById('status-text');
    const tilesRemainingText = document.getElementById('tiles-remaining');
    const btnAccept = document.getElementById('btn-accept');
    const btnReject = document.getElementById('btn-reject');
    const btnNewGame = document.getElementById('btn-new-game');

    // =================================================================
    // == GAME STATE
    // =================================================================
    let tiles = []; // { id, value, element, state: 'hidden'|'revealed'|'rejected'|'accepted' }
    let gameover = false;
    let ACTUAL_BEST_VALUE = 0;
    let tilesRevealedCount = 0;
    let currentDecisionTileId = -1; // The ID of the tile we are currently deciding on

    // =================================================================
    // == FIREBASE STATE
    // =================================================================
    let currentUser = null;
    let userEmail = null; // We'll store this to save with the score

    /**
     * Updates the status message on the UI.
     * @param {string} message - The text to display.
     * @param {string} [colorClass='text-blue-400'] - The Tailwind color class.
     */
    function updateStatus(message, colorClass = 'text-blue-400') {
        statusText.textContent = message;
        // Remove old colors, add new one
        statusText.classList.remove('text-blue-400', 'text-green-400', 'text-red-400', 'text-gray-400', 'text-yellow-400');
        statusText.classList.add(colorClass);
    }

    /**
     * Initializes or resets the game board.
     */
    function initGame() {
        console.log("Initializing game...");
        // Reset state
        gameover = false;
        tiles = [];
        ACTUAL_BEST_VALUE = 0;
        tilesRevealedCount = 0;
        currentDecisionTileId = -1;

        // Create tile values with random, unknown numbers
        const tileValues = [];
        for (let i = 0; i < 30; i++) {
            const val = Math.floor(Math.random() * 900) + 100; // 3-digit numbers
            tileValues.push(val);
            if (val > ACTUAL_BEST_VALUE) {
                ACTUAL_BEST_VALUE = val; // Find the true max
            }
        }
        
        // Setup UI
        tileGrid.innerHTML = '';
        for (let i = 0; i < 30; i++) {
            const tileElement = document.createElement('div');
            tileElement.className = 'tile w-full aspect-square bg-gray-700 rounded-lg cursor-pointer hover:border-2 hover:border-blue-400';
            tileElement.dataset.tileId = i; // Give it an ID
            
            const tileData = {
                id: i,
                value: tileValues[i],
                element: tileElement,
                state: 'hidden' // This is our *internal* state
            };
            
            // Add click listener
            tileElement.addEventListener('click', () => handleTileClick(tileData));
            
            tiles.push(tileData);
            tileGrid.appendChild(tileElement);
        }

        // Reset buttons
        btnAccept.classList.add('hidden');
        btnReject.classList.add('hidden');
        btnNewGame.classList.add('hidden');
        
        // Set initial status
        tilesRemainingText.textContent = '30 tiles remaining.';
        if (currentUser) {
            updateStatus('Logged in. Click any tile to begin.', 'text-green-400');
        } else {
            updateStatus('Click any tile to begin.', 'text-blue-400');
        }
    }

    /**
     * Main click handler for all tiles
     */
    function handleTileClick(tileData) {
        if (gameover || tileData.state !== 'hidden' || currentDecisionTileId !== -1) {
            // Don't do anything if game is over, tile is already revealed,
            // or we are busy deciding on another tile.
            return;
        }

        // --- Reveal the tile ---
        tilesRevealedCount++;
        tileData.state = 'revealed'; // Mark internal state
        
        // Update element classes
        tileData.element.textContent = tileData.value;
        tileData.element.className = 'tile w-full aspect-square bg-blue-500 rounded-lg flex items-center justify-center text-2xl font-bold text-white shadow-lg scale-110 z-10';
        
        currentDecisionTileId = tileData.id;
        
        // Show decision buttons
        btnAccept.classList.remove('hidden');
        btnReject.classList.remove('hidden');
        
        updateStatus(`You found ${tileData.value}. Accept or Reject?`, 'text-yellow-400');
        tilesRemainingText.textContent = `${30 - tilesRevealedCount} tiles remaining.`;

        // Force decision on the last tile
        if (tilesRevealedCount === 30) {
            updateStatus(`Last tile! You must accept ${tileData.value}.`, 'text-yellow-400');
            btnReject.classList.add('hidden'); // Can't reject
            // Auto-accept
            setTimeout(() => handleAccept(true), 800);
        }
    }

    /**
     * Player action: Rejects the current tile.
     */
    function handleReject() {
        if (gameover || currentDecisionTileId === -1) return;

        const tileData = tiles.find(t => t.id === currentDecisionTileId);
        
        tileData.state = 'rejected';
        // Update element classes
        tileData.element.className = 'tile w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center text-lg font-bold text-gray-500 opacity-50 cursor-not-allowed';

        // Hide buttons, reset decision state
        btnAccept.classList.add('hidden');
        btnReject.classList.add('hidden');
        currentDecisionTileId = -1;
        
        updateStatus('Tile rejected. Keep looking...', 'text-blue-400');
    }

    /**
     * Player action: Accepts the current tile.
     */
    function handleAccept(isForced = false) {
        if (gameover) return;
        
        if (currentDecisionTileId === -1 && !isForced) return;

        let chosenTile;

        // Handle the forced-last-tile case
        if (isForced && currentDecisionTileId === -1) {
            chosenTile = tiles.find(t => t.state === 'revealed');
            if (!chosenTile) {
                console.error("Forced accept with no revealed tile.");
                return;
            }
        } else {
            chosenTile = tiles.find(t => t.id === currentDecisionTileId);
        }
        
        selectTile(chosenTile);
    }

    /**
     * Finalizes the game after a selection is made.
     * @param {object} chosenTile - The tileData object the player accepted.
     */
    function selectTile(chosenTile) {
        gameover = true;
        
        const playerChoice = chosenTile.value;
        chosenTile.state = 'accepted';
        
        const didWin = playerChoice === ACTUAL_BEST_VALUE;

        // Style the chosen tile
        chosenTile.element.className = `tile w-full aspect-square rounded-lg flex items-center justify-center text-2xl font-bold text-white shadow-lg scale-110 z-10 ${didWin ? 'bg-green-500' : 'bg-red-500'}`;


        // Check for win
        if (didWin) {
            updateStatus(`You Win! You found the best tile: ${ACTUAL_BEST_VALUE}!`, 'text-green-400');
        } else {
            updateStatus(`You Lost. You picked ${playerChoice}. The best was ${ACTUAL_BEST_VALUE}.`, 'text-red-400');
        }

        // Reveal all other tiles
        revealAllTiles(chosenTile.id);

        // Show "New Game" button
        btnAccept.classList.add('hidden');
        btnReject.classList.add('hidden');
        btnNewGame.classList.remove('hidden');
        btnNewGame.focus();

        // --- Save to Firebase ---
        if (currentUser) {
            // *** THIS IS THE NEW SAVE FUNCTION ***
            saveWinLoss(didWin);
        } else {
            console.log("No user logged in. Score not saved.");
        }
    }

    /**
     * Reveals all remaining tiles at the end of the game.
     */
    function revealAllTiles(chosenTileId) {
        for(const tile of tiles) {
            if (tile.id === chosenTileId) continue; // Skip the one already styled

            // Reset classes
            tile.element.className = 'tile w-full aspect-square rounded-lg flex items-center justify-center text-lg font-bold';

            if (tile.value === ACTUAL_BEST_VALUE) {
                // This is the one they missed
                tile.element.classList.add('bg-yellow-500', 'text-gray-900');
                tile.element.textContent = tile.value;
            }
            else if (tile.state === 'hidden') {
                // Reveal any other hidden tiles
                tile.element.classList.add('bg-gray-800', 'text-gray-500', 'opacity-50');
                tile.element.textContent = tile.value;
            }
        }
    }

    /**
     * --- NEW FUNCTION ---
     * Saves the game result (win/loss) to the user's document.
     * @param {boolean} didWin - Whether the player won or not.
     */
    function saveWinLoss(didWin) {
        if (!currentUser || !db) {
            console.error("Firebase not initialized or user not logged in.");
            return;
        }

        const userDocRef = db.collection('users').doc(currentUser.uid);

        // Use a transaction to safely update the user's stats
        db.runTransaction((transaction) => {
            return transaction.get(userDocRef).then((userDoc) => {
                if (!userDoc.exists) {
                    throw "User document does not exist!";
                }

                // Get current stats, defaulting to 0 if they don't exist
                const oldWins = userDoc.data().dp_wins || 0;
                const oldLosses = userDoc.data().dp_losses || 0;
                const oldTotal = userDoc.data().dp_total_games || 0;

                // Calculate new stats
                const newWins = oldWins + (didWin ? 1 : 0);
                const newLosses = oldLosses + (didWin ? 0 : 1);
                const newTotal = oldTotal + 1;
                const newWinRate = (newWins / newTotal) * 100;

                // Update the document
                transaction.update(userDocRef, {
                    dp_wins: newWins,
                    dp_losses: newLosses,
                    dp_total_games: newTotal,
                    dp_win_rate: newWinRate
                });
            });
        }).then(() => {
            console.log("Win/Loss stats updated successfully!");
        }).catch((error) => {
            console.error("Transaction failed: ", error);
        });
    }
    
    // =================================================================
    // == INITIALIZATION & EVENT LISTENERS
    // =================================================================

    // --- Firebase Auth Listener ---
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            currentUser = user;
            userEmail = user.email; // Store this just in case
            console.log("User logged in:", user.email);
            initGame();
        } else {
            // User is signed out
            currentUser = null;
            userEmail = null;
            console.log("User logged out.");
            initGame();
        }
        
        // Show the page now that auth is checked and game is ready
        document.body.style.display = 'flex';
    });
    
    // --- Button Listeners ---
    btnReject.addEventListener('click', handleReject);
    btnAccept.addEventListener('click', () => handleAccept(false));
    btnNewGame.addEventListener('click', initGame);
});