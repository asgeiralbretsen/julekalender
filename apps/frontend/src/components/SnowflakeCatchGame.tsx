import React, { useState, useEffect, useCallback, useRef } from "react";

interface FallingObject {
  id: string;
  x: number;
  y: number;
  type: "snowflake" | "coal";
  speed: number;
}

interface GameState {
  score: number;
  lives: number;
  gameStarted: boolean;
  gameEnded: boolean;
  playerX: number;
  playerY: number;
  fallingObjects: FallingObject[];
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 20;
const OBJECT_SIZE = 40;
const PLAYER_SPEED = 8;
const SNOWFLAKE_POINTS = 10;
const COAL_PENALTY = -5;
const MAX_LIVES = 3;

const SnowflakeCatchGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: MAX_LIVES,
    gameStarted: false,
    gameEnded: false,
    playerX: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
    playerY: GAME_HEIGHT - 50,
    fallingObjects: [],
  });

  const gameLoopRef = useRef<number | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());

  const startGame = () => {
    setGameState({
      score: 0,
      lives: MAX_LIVES,
      gameStarted: true,
      gameEnded: false,
      playerX: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
      playerY: GAME_HEIGHT - 50,
      fallingObjects: [],
    });
  };

  const resetGame = () => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    setGameState({
      score: 0,
      lives: MAX_LIVES,
      gameStarted: false,
      gameEnded: false,
      playerX: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
      playerY: GAME_HEIGHT - 50,
      fallingObjects: [],
    });
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysPressed.current.add(e.key);
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysPressed.current.delete(e.key);
  }, []);

  const spawnObject = useCallback(() => {
    const type = Math.random() < 0.7 ? "snowflake" : "coal"; // 70% snowflakes, 30% coal
    const speed = 2 + Math.random() * 3; // Speed between 2-5

    const newObject: FallingObject = {
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * (GAME_WIDTH - OBJECT_SIZE),
      y: -OBJECT_SIZE,
      type,
      speed,
    };

    setGameState((prev) => ({
      ...prev,
      fallingObjects: [...prev.fallingObjects, newObject],
    }));
  }, []);

  const checkCollision = (
    obj: FallingObject,
    playerX: number,
    playerY: number
  ) => {
    return (
      obj.x < playerX + PLAYER_WIDTH &&
      obj.x + OBJECT_SIZE > playerX &&
      obj.y < playerY + PLAYER_HEIGHT &&
      obj.y + OBJECT_SIZE > playerY
    );
  };

  const updateGame = useCallback(() => {
    if (!gameState.gameStarted || gameState.gameEnded) return;

    setGameState((prev) => {
      let newPlayerX = prev.playerX;
      let newPlayerY = prev.playerY;
      let newScore = prev.score;
      let newLives = prev.lives;
      let newFallingObjects = [...prev.fallingObjects];

      // Handle player movement
      if (
        keysPressed.current.has("ArrowLeft") ||
        keysPressed.current.has("a")
      ) {
        newPlayerX = Math.max(0, newPlayerX - PLAYER_SPEED);
      }
      if (
        keysPressed.current.has("ArrowRight") ||
        keysPressed.current.has("d")
      ) {
        newPlayerX = Math.min(
          GAME_WIDTH - PLAYER_WIDTH,
          newPlayerX + PLAYER_SPEED
        );
      }

      // Update falling objects
      newFallingObjects = newFallingObjects
        .map((obj) => ({
          ...obj,
          y: obj.y + obj.speed,
        }))
        .filter((obj) => {
          // Check if object is still on screen
          if (obj.y > GAME_HEIGHT) {
            return false;
          }

          // Check collision with player
          if (checkCollision(obj, newPlayerX, newPlayerY)) {
            if (obj.type === "snowflake") {
              newScore += SNOWFLAKE_POINTS;
            } else if (obj.type === "coal") {
              newScore += COAL_PENALTY;
              newLives -= 1;
            }
            return false; // Remove the object
          }

          return true;
        });

      // Spawn new objects occasionally
      if (Math.random() < 0.02) {
        // 2% chance per frame
        const type = Math.random() < 0.7 ? "snowflake" : "coal";
        const speed = 2 + Math.random() * 3;

        newFallingObjects.push({
          id: Math.random().toString(36).substr(2, 9),
          x: Math.random() * (GAME_WIDTH - OBJECT_SIZE),
          y: -OBJECT_SIZE,
          type,
          speed,
        });
      }

      // Check game over
      const gameEnded = newLives <= 0;

      return {
        ...prev,
        playerX: newPlayerX,
        playerY: newPlayerY,
        score: newScore,
        lives: newLives,
        fallingObjects: newFallingObjects,
        gameEnded,
      };
    });
  }, [gameState.gameStarted, gameState.gameEnded]);

  useEffect(() => {
    if (gameState.gameStarted && !gameState.gameEnded) {
      const gameLoop = () => {
        updateGame();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      };
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.gameStarted, gameState.gameEnded, updateGame]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  if (!gameState.gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            ❄️ Snowflake Catch
          </h1>
          <p className="text-white/80 mb-6">
            Catch falling snowflakes ❄️ and avoid coal 🪨! Use arrow keys or A/D
            to move.
          </p>
          <div className="text-white/70 text-sm mb-6">
            <p>❄️ Snowflakes: +10 points</p>
            <p>🪨 Coal: -5 points, -1 life</p>
            <p>Lives: {MAX_LIVES}</p>
          </div>
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (gameState.gameEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Game Over!</h1>
          <p className="text-2xl text-white/80 mb-6">
            Final Score: {gameState.score}
          </p>
          <button
            onClick={resetGame}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            ❄️ Snowflake Catch
          </h1>
          <div className="flex justify-center gap-8 text-white/80">
            <span>Score: {gameState.score}</span>
            <span>Lives: {"❤️".repeat(gameState.lives)}</span>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="flex justify-center">
          <div
            className="relative bg-gradient-to-b from-sky-200 to-blue-300 rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          >
            {/* Player */}
            <div
              className="absolute bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg"
              style={{
                left: gameState.playerX,
                top: gameState.playerY,
                width: PLAYER_WIDTH,
                height: PLAYER_HEIGHT,
              }}
            />

            {/* Falling Objects */}
            {gameState.fallingObjects.map((obj) => (
              <div
                key={obj.id}
                className={`absolute text-2xl ${
                  obj.type === "snowflake" ? "text-white" : "text-gray-800"
                }`}
                style={{
                  left: obj.x,
                  top: obj.y,
                  width: OBJECT_SIZE,
                  height: OBJECT_SIZE,
                }}
              >
                {obj.type === "snowflake" ? "❄️" : "🪨"}
              </div>
            ))}

            {/* Instructions Overlay */}
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-2 rounded-lg text-sm">
              Use ← → or A D to move
            </div>
          </div>
        </div>

        {/* Game Stats */}
        <div className="mt-6 text-center text-white/70">
          <p>Catch ❄️ snowflakes for points, avoid 🪨 coal!</p>
        </div>
      </div>
    </div>
  );
};

export default SnowflakeCatchGame;
