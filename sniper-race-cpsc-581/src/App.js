import React, { useState } from "react";
import "./styles.css";

// Importing GIF assets to be used for players.
import g1 from "./media/g1.gif";
import g2 from "./media/g2.gif";
import g3 from "./media/g3.gif";
import g4 from "./media/g4.gif";
import g5 from "./media/g5.gif";
import g6 from "./media/g6.gif";
import g7 from "./media/g7.gif";
import g8 from "./media/g8.gif";
import g9 from "./media/g9.gif";
import g10 from "./media/g10.gif";

// This array contains the list of GIFs.
const gifs = [g1, g2, g3, g4, g5, g6, g7, g8, g9, g10];

// These constants are configuration values that dictate game mechanics.
const NUM_PLAYERS = 10; // Total number of players
const HUMAN_PLAYERS = 3; // Number of human-controlled players
const gridSize = 10; // Size of the game board (10x10)
const NUM_POWERUPS = 3; // Number of power-ups on the board

// A function to return a random movement either 1 or 2 rows forward.
const getRandomMove = () => {
  const moves = [
    { row: 1, col: 0 },
    { row: 2, col: 0 }
  ];
  return moves[Math.floor(Math.random() * moves.length)];
};

// A function to shuffle any given array, used to randomize player positions and labels.
const shuffleArray = (array) => {
  // Start from the last element and shuffle it towards the front of the array
  for (let i = array.length - 1; i > 0; i--) {
    // j is a random index such that 0 <= j <= i
    // This means on each iteration, we randomly select one of the remaining unshuffled elements (from the front)
    const j = Math.floor(Math.random() * (i + 1));

    // Swap the element at index i with the element at index j
    // This ensures that every element has an equal chance to be at any particular index
    [array[i], array[j]] = [array[j], array[i]];
  }
};

const App = () => {
  /*
   * Generates the initial data for each player.
   *
   * This function:
   * 1. Creates an array of `gridSize` positions.
   * 2. Shuffles the positions to ensure random placement on the board.
   * 3. Creates an array of labels for players based on the number of players (`NUM_PLAYERS`).
   * 4. Shuffles these labels for randomized identification.
   * 5. Maps each player to a position, label, and associated GIF from the `gifs` array.
   *
   * @returns {Array} An array of player objects, each having a position, label, and gif.
   *
   * @example
   *   const playersData = generateInitialPlayerData();
   *   // Example result (for `gridSize` = 10 and `NUM_PLAYERS` = 3):
   *   // [
   *   //   { position: { row: 9, col: 2 }, label: '1', gif: './media/g1.gif' },
   *   //   { position: { row: 9, col: 7 }, label: '2', gif: './media/g2.gif' },
   *   //   { position: { row: 9, col: 5 }, label: '3', gif: './media/g3.gif' }
   *   // ]
   */
  const generateInitialPlayerData = () => {
    // Generate an array of sequential numbers from 0 to (gridSize - 1)
    const positions = Array(gridSize)
      .fill(null)
      .map((_, i) => i);

    // Shuffle the generated positions to randomize player placements on the grid
    shuffleArray(positions);

    // Generate an array of labels for each player. Labels are from '1' to `NUM_PLAYERS`
    const labels = Array(NUM_PLAYERS)
      .fill(0)
      .map((_, index) => `${index + 1}`);

    // Shuffle the generated labels for randomized player identification
    shuffleArray(labels);

    // Create and return the array of player objects
    // Each player is placed on the last row (`gridSize - 1`) of the grid with a randomized column,
    // assigned a shuffled label, and an associated GIF from the `gifs` array
    return Array(NUM_PLAYERS)
      .fill({})
      .map((_, i) => ({
        position: { row: gridSize - 1, col: positions[i] },
        label: labels[i],
        gif: gifs[i]
      }));
  };

  // State variables for the application:
  // - `players`: Keeps track of all player's current positions, labels, and associated GIFs
  // - `activePlayer`: The index of the current human player taking action
  // - `winner`: Stores the label of the player who wins
  const [players, setPlayers] = useState(generateInitialPlayerData());
  const [activePlayer, setActivePlayer] = useState(
    Math.floor(Math.random() * HUMAN_PLAYERS)
  );
  const [winner, setWinner] = useState(null);

  const adjustForBorders = (row, col) => {
    row = Math.max(0, row);
    col = Math.max(0, Math.min(gridSize - 1, col));
    return { row, col };
  };

  /*
   * Generates initial power-up positions on the game grid.
   *
   * This function populates an array with coordinates for the power-ups until the number
   * of power-ups matches the specified `NUM_POWERUPS`.
   * The row for power-ups is fixed, approximately at the middle of the grid (`gridSize / 2`).
   * The column, however, is chosen randomly to distribute power-ups across the width of the grid.
   *
   * @returns {Array} An array of objects, each representing the grid position of a power-up.
   *
   * @example
   * // Example of the returned array for gridSize = 10 and NUM_POWERUPS = 3:
   * [
   *   { row: 5, col: 3 },
   *   { row: 5, col: 7 },
   *   { row: 5, col: 9 }
   * ]
   */
  const initialPowerUps = () => {
    let powerUps = [];
    while (powerUps.length < NUM_POWERUPS) {
      let row = Math.floor(gridSize / 2);
      let col = Math.floor(Math.random() * gridSize);
      if (!powerUps.some((p) => p.row === row && p.col === col)) {
        powerUps.push({ row, col });
      }
    }
    return powerUps;
  };

  const [powerUps, setPowerUps] = useState(initialPowerUps());
  const [hasPowerUp, setHasPowerUp] = useState(false);

  /*
   * Handles a move action initiated by the active player and updates other players accordingly.
   *
   * @param {number} rowMove - The number of rows the active player intends to move. Positive values move up, negative values move down.
   *
   * Here's a breakdown of the function's steps:
   * 1. If there's already a winner, no further moves are allowed, so the function exits immediately.
   * 2. A deep copy of the current players' state is created to avoid mutating the original state directly.
   * 3. The current active player's data is extracted for modification.
   * 4. The intended new position for the active player is calculated based on the specified rowMove.
   * 5. The adjustForBorders() function ensures the new position remains within the game board's boundaries.
   * 6. If the new position is at the topmost row (i.e., row 0), the active player wins, and the game concludes.
   * 7. Checks if the player's new position overlaps with a power-up. If yes, the power-up is used, and the relevant state is updated.
   * 8. The positions of the non-active, computer-controlled players are then updated. These players follow a randomized move.
   * 9. Finally, the updated players' state is saved, reflecting all the changes made during this move.
   */
  const handleMove = (rowMove) => {
    // 1. Check if the game is already over
    if (winner) return; // Ignore moves after game over

    // 2. Clone the current players array to avoid direct state mutation
    const updatedPlayers = [...players];
    // 3. Fetch the active player's current details
    const currentPlayer = updatedPlayers[activePlayer];
    // 4. Calculate intended new position
    let newRow = currentPlayer.position.row - rowMove;
    let newCol = currentPlayer.position.col;

    // 5. Ensure new position doesn't exceed game boundaries
    const { row, col } = adjustForBorders(newRow, newCol);
    // Update the active player's position
    currentPlayer.position = { row, col };

    // 6. Check if the active player reached the top and won the game
    if (row === 0) {
      setWinner(currentPlayer.label);
      return; // Stop the game once a winner is found
    }

    // 7. Check if the new position has a power-up and update the state accordingly
    // Check if any power-up exists at the player's new position (row and col).
    // The findIndex() function returns the index of the first power-up that meets the condition.
    // If no power-up is found, it returns -1.
    const powerUpIndex = powerUps.findIndex(
      (p) => p.row === row && p.col === col
    );
    // If a power-up was found at the player's new position...
    if (powerUpIndex !== -1) {
      // ...set the player's power-up status to 'true' indicating they have acquired a power-up
      setHasPowerUp(true);
      // Remove the acquired power-up from the power-ups array to ensure it's not used again
      powerUps.splice(powerUpIndex, 1);
      // Update the power-ups state with the modified array
      setPowerUps([...powerUps]);
    }

    // 8. Update positions for other computer-controlled players
    // Iterate over all the players
    for (let i = 0; i < updatedPlayers.length; i++) {
      // Ensure the current player isn't the active human player and that it's a computer-controlled player
      // Assuming indices greater than 2 are computer-controlled players
      if (i !== activePlayer && i > 2) {
        // Get a randomized move for the current computer-controlled player
        // This move logic is assumed to be defined elsewhere
        const move = getRandomMove();
        // Update the current player's row position by subtracting the randomized move value
        updatedPlayers[i].position.row -= move.row;
        // Ensure the updated position doesn't exceed the game's lower boundary (row 0)
        // If the position is less than 0, it's reset to 0
        updatedPlayers[i].position.row = Math.max(
          0,
          updatedPlayers[i].position.row
        );
      }
    }

    // 9. Save the updated players' data
    setPlayers(updatedPlayers);
  };

  const handleShoot = (targetPlayerLabel) => {
    // 1. Find the index of the targeted player within the players array
    const targetIndex = players.findIndex((p) => p.label === targetPlayerLabel);
    // 2. Filter out the targeted player from the players array, essentially "eliminating" them from the game
    const updatedPlayers = players.filter(
      (player) => player.label !== targetPlayerLabel
    );

    // 3. Logic to determine the new active player
    let newActivePlayer = activePlayer;
    // 3.1. If the targeted player's index is less than the current active player's index,
    // decrement the index of the active player. This handles the shift in array positions
    // 3.2. If the targeted player is the last in the array, set the active player index to 0 (start over)
    if (targetIndex < activePlayer) {
      newActivePlayer -= 1;
    } else if (targetIndex === players.length - 1) {
      newActivePlayer = 0;
    }

    // 4. Update the state to reflect the new list of players
    setPlayers(updatedPlayers);
    // 5. Update the state to reflect the new active player
    setActivePlayer(newActivePlayer);
    // 6. Reset the "hasPowerUp" state. This ensures the shooting ability is used up after one shot
    setHasPowerUp(false);
  };

  return (
    <div className="App">
      {/* Title for the game */}
      <h1>Sniper Race</h1>
      <div className="board">
        {/* Conditional rendering: If there's a winner, display the winner's details */}
        {winner ? (
          <div className="winner-display">
            WINNER: {/* Fetch and display the gif of the player who won */}
            <img
              src={players.find((p) => p.label === winner).gif}
              alt={winner}
              className="winner-animation"
            />
          </div>
        ) : (
          /* If there's no winner yet, render the game's grid */
          Array(gridSize)
            .fill(null)
            .map((_, rowIndex) => (
              /* Representing each row in the game grid. */
              <div
                key={rowIndex}
                className={`row ${rowIndex === 0 ? "finish-line" : ""}`}
              >
                {/* Loop through and render each column (or cell) for the given row */}
                {Array(gridSize)
                  .fill(null)
                  .map((_, colIndex) => (
                    <div key={colIndex} className="cell">
                      {/* Check if the current cell contains a power-up, and if so, render it */}
                      {powerUps.some(
                        (powerUp) =>
                          powerUp.row === rowIndex && powerUp.col === colIndex
                      ) && <div className="power-up"></div>}
                      {/* Map through all players to see which player(s) are on the current cell */}
                      {players.map((playerData, index) => {
                        if (
                          playerData.position.row === rowIndex &&
                          playerData.position.col === colIndex
                        ) {
                          return (
                            /* Display each player's image and label. Highlight the active player */
                            <div
                              key={index}
                              className={`player ${
                                activePlayer === index ? "active" : ""
                              }`}
                            >
                              <img
                                src={playerData.gif}
                                alt={playerData.label}
                              />
                              <span className="player-label">
                                {playerData.label}
                              </span>
                              {activePlayer === index && (
                                <span className="active-indicator"></span>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  ))}
              </div>
            ))
        )}
      </div>
      {/* Game controls: Only display if there isn't a winner yet */}
      {!winner ? (
        <div className="controls">
          <button onClick={() => handleMove(1)}>Walk Forward</button>
          <button onClick={() => handleMove(2)}>Run Forward</button>
          {hasPowerUp && (
            <label>
              Shoot player:
              <select onChange={(e) => handleShoot(e.target.value)}>
                {/* List down other players in a dropdown to choose who to shoot */}
                {players
                  .slice()
                  .sort((a, b) => parseInt(a.label) - parseInt(b.label))
                  .map((playerData) =>
                    playerData.label !== players[activePlayer].label ? (
                      <option key={playerData.label} value={playerData.label}>
                        {playerData.label}
                      </option>
                    ) : null
                  )}
              </select>
            </label>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default App;
