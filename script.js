// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    
    // --- DOM Elements ---
    const tileGrid = document.getElementById('tile-grid');
    const statusBar = document.getElementById('status-bar');
    const statsBar = document.getElementById('stats-bar');
    const btnAccept = document.getElementById('btn-accept');
    const btnReject = document.getElementById('btn-reject');
    const btnNewGame = document.getElementById('btn-new-game');

    // --- Game Constants ---
    const TOTAL_TILES = 30;
    
    // --- Game State ---
    let tiles = []; // Array of { id, value, element, state: 'hidden'|'revealed'|'rejected'|'accepted' }
    let gameover = false;
    let ACTUAL_BEST_VALUE = 0;
    let tilesRevealedCount = 0;
    let currentDecisionTileId = -1; // The ID of the tile we are currently deciding on
    
    // --- Tailwind Class Definitions ---
    // We define all our styles here, using only Tailwind classes
    const TILE_BASE = [
        'flex', 'items-center', 'justify-center', 
        'text-xl', 'font-semibold', 'rounded-lg', 
        'transition-all', 'duration-300', 'ease-in-out',
        'aspect-square', 'min-h-[50px]', 'border-2'
    ];

    const TILE_STATE = {
        hidden: [
            'bg-gray-700', 'text-transparent', 'border-gray-600', 
            'cursor-pointer', 'hover:border-emerald-300'
        ],
        revealed: [
            'bg-gray-800', 'text-gray-100', 'border-gray-500',
            'scale-110', 'shadow-[0_0_15px_rgba(59,130,246,0.4)]', // shadow-blue-500
            'cursor-default'
        ],
        rejected: [
            'bg-gray-800', 'text-gray-500', 'border-gray-600',
            'border-dashed', 'opacity-60', 'cursor-default'
        ],
        accepted: [
            'bg-emerald-500', 'text-white', 'border-white',
            'scale-110', 'shadow-[0_0_20px_rgba(16,185,129,0.7)]', // shadow-emerald
            'cursor-default'
        ],
        best: [
            'bg-amber-500', 'text-gray-800', 'border-white',
            'shadow-[0_0_20px_rgba(245,158,11,0.7)]', // shadow-amber
            'cursor-default'
        ]
    };


    /**
     * Initializes or resets the game.
     */
    function initGame() {
        // Reset state
        ACTUAL_BEST_VALUE = 0;
        gameover = false;
        tiles = [];
        tilesRevealedCount = 0;
        currentDecisionTileId = -1;

        // Create tile values with random, unknown numbers
        const tileValues = [];
        for (let i = 0; i < TOTAL_TILES; i++) {
            const val = Math.floor(Math.random() * 900) + 100;
            tileValues.push(val);
            if (val > ACTUAL_BEST_VALUE) {
                ACTUAL_BEST_VALUE = val; // Find the true max
            }
        }
        
        // Setup UI
        tileGrid.innerHTML = '';
        for (let i = 0; i < TOTAL_TILES; i++) {
            const tileElement = document.createElement('div');
            
            // Apply base styles and initial hidden state from Tailwind
            tileElement.classList.add(...TILE_BASE, ...TILE_STATE.hidden);
            
            tileElement.dataset.tileId = i; // Give it an ID
            
            const tileData = {
                id: i,
                value: tileValues[i],
                element: tileElement,
                state: 'hidden'
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
        updateStats();
        updateStatus(`Click any tile to begin.`);
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
        tileData.element.textContent = tileData.value;
        
        // Every tile click immediately forces a decision
        tileData.state = 'revealed';
        // Apply 'revealed' styles
        tileData.element.classList.remove(...TILE_STATE.hidden);
        tileData.element.classList.add(...TILE_STATE.revealed);
        
        currentDecisionTileId = tileData.id;
        
        // Show decision buttons
        btnAccept.classList.remove('hidden');
        btnReject.classList.remove('hidden');
        
        updateStatus(`You found ${tileData.value}. Accept or Reject?`);

        // Force decision on the last tile
        if (tilesRevealedCount === TOTAL_TILES) {
            updateStatus(`Last tile! You must accept.`);
            btnReject.classList.add('hidden'); // Can't reject
            // Auto-accept
            setTimeout(() => handleAccept(true), 800);
        }
        updateStats();
    }

    /**
     * Player action: Rejects the current tile.
     */
    function handleReject() {
        if (gameover || currentDecisionTileId === -1) return;

        const tileData = tiles.find(t => t.id === currentDecisionTileId);
        
        tileData.state = 'rejected';
        // Apply 'rejected' styles
        tileData.element.classList.remove(...TILE_STATE.revealed);
        tileData.element.classList.add(...TILE_STATE.rejected);

        // Hide buttons, reset decision state
        btnAccept.classList.add('hidden');
        btnReject.classList.add('hidden');
        currentDecisionTileId = -1;
        
        updateStatus(`Click another tile.`);
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
     * Updates the statistics bar.
     */
    function updateStats() {
        const remaining = TOTAL_TILES - tilesRevealedCount;
        statsBar.textContent = `${remaining} tiles remaining.`;
    }

    /**
     * Updates the status message with a fade-in animation.
     */
    function updateStatus(message, colorClass = 'text-blue-400') {
        statusBar.textContent = message;
        // Apply animation
        statusBar.classList.remove('fade-in');
        // Set text color, remove old ones
        statusBar.classList.remove('text-blue-400', 'text-green-400', 'text-red-400');
        statusBar.classList.add(colorClass);
        // Trigger reflow to restart animation
        void statusBar.offsetWidth; 
        statusBar.classList.add('fade-in');
    }

    /**
     * Finalizes the game after a selection is made.
     * @param {object} chosenTile - The tileData object the player accepted.
     */
    function selectTile(chosenTile) {
        gameover = true;
        
        const playerChoice = chosenTile.value;
        chosenTile.state = 'accepted';
        // Apply 'accepted' styles
        if (chosenTile.element.classList.contains('revealed')) {
             chosenTile.element.classList.remove(...TILE_STATE.revealed);
        }
        chosenTile.element.classList.add(...TILE_STATE.accepted);

        // Check for win
        if (playerChoice === ACTUAL_BEST_VALUE) {
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
    }

    /**
     * Reveals all remaining tiles at the end of the game.
     */
    function revealAllTiles(chosenTileId) {
        for(const tile of tiles) {
            if (tile.id === chosenTileId) continue; // Skip the one already styled

            if (tile.value === ACTUAL_BEST_VALUE) {
                // This is the one they missed
                // Apply 'best' styles
                if(tile.state === 'hidden') tile.element.classList.remove(...TILE_STATE.hidden);
                if(tile.state === 'rejected') tile.element.classList.remove(...TILE_STATE.rejected);
                // Ensure no conflicting styles
                tile.element.classList.remove(...TILE_STATE.accepted, ...TILE_STATE.revealed); 
                tile.element.classList.add(...TILE_STATE.best);
                tile.element.textContent = tile.value;
            }

            // Reveal any other hidden tiles
            if (tile.state === 'hidden') {
                // Apply 'rejected' styles to un-clicked tiles
                tile.element.classList.remove(...TILE_STATE.hidden);
                tile.element.classList.add(...TILE_STATE.rejected); 
                tile.element.textContent = tile.value;
            }
        }
    }

    // --- Event Listeners ---
    btnReject.addEventListener('click', handleReject);
    btnAccept.addEventListener('click', () => handleAccept(false));
    btnNewGame.addEventListener('click', initGame);

    // --- Start Game ---
    initGame();
});