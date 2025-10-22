import React, { useState, useEffect, useCallback } from "react";
import { useUser } from '@clerk/clerk-react';
import { useGameScore } from '../hooks/useGameScore';
import type { GameScore, SaveGameScoreRequest } from '../hooks/useGameScore';

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
  scoreSaved: boolean;
  hasPlayedToday: boolean;
  previousScore: number | null;
}

// Default fallback images if no game data is available
const FALLBACK_IMAGES: GameImage[] = [
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

// Generate answer options dynamically
const generateOptions = (correctAnswer: string): string[] => {
  const commonOptions = [
    "Mountain", "Ocean", "Forest", "Desert", "City", "Lake", "River", "Beach",
    "Building", "Tree", "Sky", "Cloud", "Sun", "Moon", "Star", "Flower",
    "Animal", "Car", "House", "Bridge", "Road", "Path", "Garden", "Park"
  ];
  
  // Remove the correct answer from common options and add it back
  const filteredOptions = commonOptions.filter(option => option !== correctAnswer);
  
  // Shuffle and take 5 random options, then add the correct answer
  const shuffled = filteredOptions.sort(() => 0.5 - Math.random());
  const selectedOptions = shuffled.slice(0, 5);
  
  // Add the correct answer and shuffle again
  const allOptions = [...selectedOptions, correctAnswer].sort(() => 0.5 - Math.random());
  
  return allOptions;
};

const BlurGuessGame: React.FC = () => {
  const { user } = useUser();
  const { saveGameScore, hasUserPlayedGame, getUserScoreForDay, loading, error } = useGameScore();
  
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
    scoreSaved: false,
    hasPlayedToday: false,
    previousScore: null,
  });

  const [timer, setTimer] = useState<number | null>(null);
  const [gameImages, setGameImages] = useState<GameImage[]>(FALLBACK_IMAGES);
  const [dayInfo, setDayInfo] = useState<{day: number, title: string} | null>(null);

  // Load game data from sessionStorage on component mount
  useEffect(() => {
    const gameDataStr = sessionStorage.getItem('currentGameData');
    const gameType = sessionStorage.getItem('currentGameType');
    const dayInfoStr = sessionStorage.getItem('currentDayInfo');

    if (gameDataStr && gameType === 'blurGuessGame') {
      try {
        const gameData = JSON.parse(gameDataStr);
        if (gameData.blurGuessGame?.images) {
          // Convert Sanity image data to GameImage format
          const images: GameImage[] = gameData.blurGuessGame.images.map((img: any, index: number) => ({
            id: index.toString(),
            src: `https://cdn.sanity.io/images/54fixmwv/production/${img.image.asset._ref.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png').replace('-webp', '.webp')}`,
            answer: img.answer,
            options: generateOptions(img.answer)
          }));
          setGameImages(images);
        }
      } catch (error) {
        console.error('Error parsing game data:', error);
      }
    }

    if (dayInfoStr) {
      try {
        setDayInfo(JSON.parse(dayInfoStr));
      } catch (error) {
        console.error('Error parsing day info:', error);
      }
    }
  }, []);

  // Check if user has already played today
  useEffect(() => {
    const checkIfPlayedToday = async () => {
      if (!user || !dayInfo) return;

      try {
        const hasPlayed = await hasUserPlayedGame(dayInfo.day, 'blurGuessGame');
        if (hasPlayed) {
          // Get the previous score
          const previousScoreData = await getUserScoreForDay(dayInfo.day, 'blurGuessGame');
          setGameState(prev => ({
            ...prev,
            hasPlayedToday: true,
            previousScore: previousScoreData?.score || null,
          }));
        }
      } catch (err) {
        console.error('Error checking if user has played today:', err);
      }
    };

    checkIfPlayedToday();
  }, [user, dayInfo, hasUserPlayedGame, getUserScoreForDay]);

  const startNewRound = useCallback(() => {
    const randomImage =
      gameImages[Math.floor(Math.random() * gameImages.length)];
    setGameState((prev) => ({
      ...prev,
      currentImage: randomImage,
      blurLevel: MAX_BLUR,
      timeElapsed: 0,
      correctAnswer: null,
      userAnswer: null,
      showResult: false,
    }));
  }, [gameImages]);

  const saveGameScoreWhenEnded = async (finalScore: number) => {
    if (!user || !dayInfo || gameState.scoreSaved) return;

    try {
      await saveGameScore({
        day: dayInfo.day,
        gameType: 'blurGuessGame',
        score: finalScore,
      });
      
      setGameState(prev => ({ ...prev, scoreSaved: true }));
    } catch (err) {
      console.error('Error saving game score:', err);
    }
  };

  const startGame = () => {
    if (gameState.hasPlayedToday) {
      // If already played today, show the previous score
      setGameState((prev) => ({
        ...prev,
        gameStarted: true,
        gameEnded: true,
        score: prev.previousScore || 0,
        scoreSaved: true,
      }));
      return;
    }

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
      scoreSaved: false,
      hasPlayedToday: false,
      previousScore: null,
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
      if (gameState.round >= gameImages.length) {
        const finalScore = gameState.score + points;
        setGameState((prev) => ({ ...prev, gameEnded: true }));
        // Save the score when game ends
        saveGameScoreWhenEnded(finalScore);
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
            {dayInfo ? `Day ${dayInfo.day}: ${dayInfo.title}` : 'Blur Guess Game'}
          </h1>
          
          {gameState.hasPlayedToday ? (
            <>
              <p className="text-white/80 mb-4">
                You've already played this game today!
              </p>
              <p className="text-yellow-300 mb-6">
                Your previous score: {gameState.previousScore}
              </p>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-3 rounded-full font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105"
              >
                View Previous Score
              </button>
            </>
          ) : (
            <>
              <p className="text-white/80 mb-6">
                Watch as the image slowly unblurs and guess what it is as fast as
                possible!
              </p>
              <button
                onClick={startGame}
                disabled={loading}
                className="bg-gradient-to-r from-pink-500 to-violet-500 text-white px-8 py-3 rounded-full font-semibold hover:from-pink-600 hover:to-violet-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Start Game'}
              </button>
            </>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState.gameEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            {gameState.hasPlayedToday ? 'Previous Game Score' : 'Game Over!'}
          </h1>
          <p className="text-2xl text-white/80 mb-6">
            Final Score: {gameState.score}
          </p>
          
          {gameState.scoreSaved && !gameState.hasPlayedToday && (
            <p className="text-green-300 mb-4">
              ✅ Score saved successfully!
            </p>
          )}
          
          {loading && (
            <p className="text-yellow-300 mb-4">
              💾 Saving score...
            </p>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
          
          <button
            onClick={resetGame}
            className="bg-gradient-to-r from-pink-500 to-violet-500 text-white px-8 py-3 rounded-full font-semibold hover:from-pink-600 hover:to-violet-600 transition-all duration-300 transform hover:scale-105"
          >
            {gameState.hasPlayedToday ? 'Back to Calendar' : 'Play Again'}
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
            {dayInfo ? `Day ${dayInfo.day}: ${dayInfo.title}` : 'Blur Guess Game'}
          </h1>
          <div className="flex justify-center gap-8 text-white/80">
            <span>
              Round: {gameState.round}/{gameImages.length}
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
