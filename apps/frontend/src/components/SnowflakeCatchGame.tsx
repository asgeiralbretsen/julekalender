import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChristmasBackground } from "./ChristmasBackground";

interface FallingObject {
  id: string;
  x: number;
  y: number;
  type: "snowflake";
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
  gameTime: number; // Time elapsed in seconds
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 20;
const OBJECT_SIZE = 40;
const PLAYER_SPEED = 8;
const SNOWFLAKE_POINTS = 10;
const MAX_LIVES = 1;

const SnowflakeCatchGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: MAX_LIVES,
    gameStarted: false,
    gameEnded: false,
    playerX: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
    playerY: GAME_HEIGHT - 50,
    fallingObjects: [],
    gameTime: 0,
  });

  const gameLoopRef = useRef<number | null>(null);
  const gameContainerRef = useRef<HTMLDivElement | null>(null);

  const startGame = () => {
    setGameState({
      score: 0,
      lives: MAX_LIVES,
      gameStarted: true,
      gameEnded: false,
      playerX: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
      playerY: GAME_HEIGHT - 50,
      fallingObjects: [],
      gameTime: 0,
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
      gameTime: 0,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (
        !gameContainerRef.current ||
        !gameState.gameStarted ||
        gameState.gameEnded
      )
        return;

      const rect = gameContainerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;

      // Calculate player position (center the player bar on the mouse)
      let newPlayerX = mouseX - PLAYER_WIDTH / 2;

      // Keep player within game boundaries
      newPlayerX = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, newPlayerX));

      setGameState((prev) => ({
        ...prev,
        playerX: newPlayerX,
      }));
    },
    [gameState.gameStarted, gameState.gameEnded]
  );

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
      let newGameTime = prev.gameTime + 1 / 60; // Assuming 60 FPS

      // Calculate difficulty based on game time
      // Spawn rate increases from 0.5% to 4% over 60 seconds
      const baseSpawnChance = 0.005;
      const maxSpawnChance = 0.04;
      const spawnRate = Math.min(
        maxSpawnChance,
        baseSpawnChance +
          (newGameTime / 60) * (maxSpawnChance - baseSpawnChance)
      );

      // Speed increases from 1.5-3 to 4-7 over 60 seconds
      const baseMinSpeed = 1.5;
      const baseMaxSpeed = 3;
      const maxMinSpeed = 4;
      const maxMaxSpeed = 7;
      const speedMultiplier = Math.min(1, newGameTime / 60);
      const minSpeed =
        baseMinSpeed + speedMultiplier * (maxMinSpeed - baseMinSpeed);
      const maxSpeed =
        baseMaxSpeed + speedMultiplier * (maxMaxSpeed - baseMaxSpeed);

      // Player movement is now handled by mouse, so we just use the current position

      // Update falling objects
      newFallingObjects = newFallingObjects
        .map((obj) => ({
          ...obj,
          y: obj.y + obj.speed,
        }))
        .filter((obj) => {
          // Check if object is still on screen
          if (obj.y > GAME_HEIGHT) {
            // If a snowflake falls off screen, lose a life
            if (obj.type === "snowflake") {
              newLives -= 1;
            }
            return false;
          }

          // Check collision with player
          if (checkCollision(obj, newPlayerX, newPlayerY)) {
            newScore += SNOWFLAKE_POINTS;
            return false; // Remove the object
          }

          return true;
        });

      // Spawn new objects with increasing frequency
      if (Math.random() < spawnRate) {
        const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);

        newFallingObjects.push({
          id: Math.random().toString(36).substr(2, 9),
          x: Math.random() * (GAME_WIDTH - OBJECT_SIZE),
          y: -OBJECT_SIZE,
          type: "snowflake",
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
        gameTime: newGameTime,
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
    if (gameState.gameStarted && !gameState.gameEnded) {
      window.addEventListener("mousemove", handleMouseMove);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
      };
    }
  }, [handleMouseMove, gameState.gameStarted, gameState.gameEnded]);

  if (!gameState.gameStarted) {
    return (
      <ChristmasBackground>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            ❄️ Snowflake Catch
          </h1>
          <p className="text-white/80 mb-6">
            Catch falling snowflakes ❄️! Move your mouse to control the paddle.
          </p>
          <div className="text-white/70 text-sm mb-6">
            <p>❄️ Snowflakes: +10 points</p>
            <p>⚠️ Miss a snowflake = game over!</p>
            <p>Lives: {MAX_LIVES}</p>
          </div>
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105"
          >
            Start Game
          </button>
        </div>
      </ChristmasBackground>
    );
  }

  if (gameState.gameEnded) {
    return (
      <ChristmasBackground>
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
      </ChristmasBackground>
    );
  }

  return (
    <ChristmasBackground>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            ❄️ Snowflake Catch
          </h1>
          <div className="flex justify-center gap-8 text-white/80">
            <span>Score: {gameState.score}</span>
            <span>Time: {Math.floor(gameState.gameTime)}s</span>
            <span>Lives: {"❤️".repeat(gameState.lives)}</span>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="flex justify-center">
          <div
            ref={gameContainerRef}
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
                className="absolute text-2xl text-white"
                style={{
                  left: obj.x,
                  top: obj.y,
                  width: OBJECT_SIZE,
                  height: OBJECT_SIZE,
                }}
              >
                ❄️
              </div>
            ))}

            {/* Instructions Overlay */}
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-2 rounded-lg text-sm">
              Move your mouse to control the paddle
            </div>
          </div>
        </div>

        {/* Game Stats */}
        <div className="mt-6 text-center text-white/70">
          <p>Catch ❄️ snowflakes for points! Miss one = game over!</p>
        </div>
      </div>
    </ChristmasBackground>
  );
};

export default SnowflakeCatchGame;
