import React, { useState, useEffect, useCallback } from "react";

interface GameImage {
  id: string;
  src: string;
  answer: string;
  options: string[];
}

interface GameState {
  currentImage: GameImage | null;
  blurLevel: number;
  timeElapsed: number;
  score: number;
  round: number;
  gameStarted: boolean;
  gameEnded: boolean;
  correctAnswer: string | null;
  userAnswer: string | null;
  showResult: boolean;
}

const SAMPLE_IMAGES: GameImage[] = [
  {
    id: "1",
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    answer: "Mountain",
    options: ["Mountain", "Ocean", "Forest", "Desert", "City", "Lake"],
  },
  {
    id: "2",
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
    answer: "Forest",
    options: ["Forest", "Mountain", "Ocean", "Desert", "City", "Lake"],
  },
  {
    id: "3",
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
    answer: "Ocean",
    options: ["Ocean", "Mountain", "Forest", "Desert", "City", "Lake"],
  },
  {
    id: "4",
    src: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop",
    answer: "City",
    options: ["City", "Mountain", "Forest", "Ocean", "Desert", "Lake"],
  },
  {
    id: "5",
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    answer: "Lake",
    options: ["Lake", "Mountain", "Forest", "Ocean", "Desert", "City"],
  },
];

const MAX_BLUR = 20;
const BLUR_DECREASE_RATE = 0.5;
const MAX_TIME_PER_ROUND = 30000; // 30 seconds
const TOTAL_ROUNDS = 5;

const BlurGuessGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentImage: null,
    blurLevel: MAX_BLUR,
    timeElapsed: 0,
    score: 0,
    round: 1,
    gameStarted: false,
    gameEnded: false,
    correctAnswer: null,
    userAnswer: null,
    showResult: false,
  });

  const [timer, setTimer] = useState<number | null>(null);

  const startNewRound = useCallback(() => {
    const randomImage =
      SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];
    setGameState((prev) => ({
      ...prev,
      currentImage: randomImage,
      blurLevel: MAX_BLUR,
      timeElapsed: 0,
      correctAnswer: null,
      userAnswer: null,
      showResult: false,
    }));
  }, []);

  const startGame = () => {
    setGameState((prev) => ({
      ...prev,
      gameStarted: true,
      gameEnded: false,
      score: 0,
      round: 1,
    }));
    startNewRound();
  };

  const resetGame = () => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    setGameState({
      currentImage: null,
      blurLevel: MAX_BLUR,
      timeElapsed: 0,
      score: 0,
      round: 1,
      gameStarted: false,
      gameEnded: false,
      correctAnswer: null,
      userAnswer: null,
      showResult: false,
    });
  };

  const handleAnswer = (answer: string) => {
    if (gameState.userAnswer || gameState.showResult) return;

    const isCorrect = answer === gameState.currentImage?.answer;
    const timeBonus = Math.max(0, MAX_TIME_PER_ROUND - gameState.timeElapsed);
    const points = isCorrect ? Math.floor(timeBonus / 100) + 100 : 0;

    setGameState((prev) => ({
      ...prev,
      userAnswer: answer,
      correctAnswer: prev.currentImage?.answer || null,
      showResult: true,
      score: prev.score + points,
    }));

    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }

    // Show result for 2 seconds, then move to next round
    setTimeout(() => {
      if (gameState.round >= TOTAL_ROUNDS) {
        setGameState((prev) => ({ ...prev, gameEnded: true }));
      } else {
        setGameState((prev) => ({ ...prev, round: prev.round + 1 }));
        startNewRound();
      }
    }, 2000);
  };

  useEffect(() => {
    if (
      gameState.gameStarted &&
      !gameState.gameEnded &&
      !gameState.showResult &&
      gameState.currentImage
    ) {
      const interval = setInterval(() => {
        setGameState((prev) => {
          const newTimeElapsed = prev.timeElapsed + 100;
          const newBlurLevel = Math.max(0, prev.blurLevel - BLUR_DECREASE_RATE);

          // Time's up
          if (newTimeElapsed >= MAX_TIME_PER_ROUND) {
            clearInterval(interval);
            return {
              ...prev,
              timeElapsed: newTimeElapsed,
              blurLevel: newBlurLevel,
              showResult: true,
              correctAnswer: prev.currentImage?.answer || null,
            };
          }

          return {
            ...prev,
            timeElapsed: newTimeElapsed,
            blurLevel: newBlurLevel,
          };
        });
      }, 100);

      setTimer(interval);
      return () => clearInterval(interval);
    }
  }, [
    gameState.gameStarted,
    gameState.gameEnded,
    gameState.showResult,
    gameState.currentImage,
  ]);

  if (!gameState.gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Blur Guess Game
          </h1>
          <p className="text-white/80 mb-6">
            Watch as the image slowly unblurs and guess what it is as fast as
            possible!
          </p>
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-pink-500 to-violet-500 text-white px-8 py-3 rounded-full font-semibold hover:from-pink-600 hover:to-violet-600 transition-all duration-300 transform hover:scale-105"
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
            className="bg-gradient-to-r from-pink-500 to-violet-500 text-white px-8 py-3 rounded-full font-semibold hover:from-pink-600 hover:to-violet-600 transition-all duration-300 transform hover:scale-105"
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
            Blur Guess Game
          </h1>
          <div className="flex justify-center gap-8 text-white/80">
            <span>
              Round: {gameState.round}/{TOTAL_ROUNDS}
            </span>
            <span>Score: {gameState.score}</span>
            <span>
              Time:{" "}
              {Math.max(
                0,
                (MAX_TIME_PER_ROUND - gameState.timeElapsed) / 1000
              ).toFixed(1)}
              s
            </span>
          </div>
        </div>

        {/* Game Area */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Image */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={gameState.currentImage?.src}
                  alt="Guess the image"
                  className="w-full h-64 object-cover"
                  style={{
                    filter: `blur(${gameState.blurLevel}px)`,
                    transition: "filter 0.1s ease-out",
                  }}
                />
                {gameState.showResult && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <p className="text-2xl font-bold mb-2">
                        {gameState.userAnswer === gameState.correctAnswer
                          ? "Correct!"
                          : "Wrong!"}
                      </p>
                      <p className="text-lg">
                        Answer: {gameState.correctAnswer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">
              What do you see?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {gameState.currentImage?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={!!gameState.userAnswer || gameState.showResult}
                  className={`p-4 rounded-lg font-medium transition-all duration-200 ${
                    gameState.showResult
                      ? option === gameState.correctAnswer
                        ? "bg-green-500 text-white"
                        : option === gameState.userAnswer &&
                            option !== gameState.correctAnswer
                          ? "bg-red-500 text-white"
                          : "bg-gray-500 text-white"
                      : gameState.userAnswer === option
                        ? "bg-blue-500 text-white"
                        : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlurGuessGame;
