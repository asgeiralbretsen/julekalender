import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useGameScore } from "../hooks/useGameScore";
import Leaderboard from "./Leaderboard";
import GameResultsScreen from "./GameResultsScreen";
import { useNavigate } from "react-router-dom";
import { client } from "../lib/sanity";

interface GameState {
  songUrl: string;
  correctAnswer: string;
  answerOptions: string[];
  clipDuration: number;
  timeRemaining: number;
  score: number;
  gameStarted: boolean;
  gameEnded: boolean;
  userAnswer: string | null;
  showResult: boolean;
  scoreSaved: boolean;
  hasPlayedToday: boolean;
  previousScore: number | null;
  isPlaying: boolean;
  timeElapsed: number;
}

interface SongGuessGameData {
  title?: string;
  description?: string;
  songFile: {
    asset: {
      _ref: string;
      url?: string;
    };
  };
  answers: string[];
  correctAnswerIndex: number;
  clipDuration: number;
  scoringSettings?: {
    correctAnswerPoints?: number;
    timeBonusPerSecond?: number;
    maxTimeBonus?: number;
  };
}

// Helper function to get file URL from Sanity
const getFileUrl = (ref: string): string => {
  // Sanity file reference format: file-{assetId}-{extension}
  const [, assetId, extension] = ref.split('-');
  return `https://cdn.sanity.io/files/${client.config().projectId}/${client.config().dataset}/${assetId}.${extension}`;
};

const SongGuessGame: React.FC = () => {
  const { user } = useUser();
  const { saveGameScore, hasUserPlayedGame, getUserScoreForDay } =
    useGameScore();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<number | null>(null);

  const [gameData, setGameData] = useState<SongGuessGameData | null>(null);
  const [dayInfo, setDayInfo] = useState<{ day: number; title: string } | null>(
    null
  );

  const [gameState, setGameState] = useState<GameState>({
    songUrl: "",
    correctAnswer: "",
    answerOptions: [],
    clipDuration: 10,
    timeRemaining: 10,
    score: 0,
    gameStarted: false,
    gameEnded: false,
    userAnswer: null,
    showResult: false,
    scoreSaved: false,
    hasPlayedToday: false,
    previousScore: null,
    isPlaying: false,
    timeElapsed: 0,
  });

  // Load game data from sessionStorage
  useEffect(() => {
    const storedGameData = sessionStorage.getItem("currentGameData");
    const storedDayInfo = sessionStorage.getItem("currentDayInfo");

    if (storedGameData) {
      try {
        const parsed = JSON.parse(storedGameData);
        if (parsed.songGuessGameData) {
          setGameData(parsed.songGuessGameData);
        } else if (parsed.colorMatchGameData) {
          // Wrong game type
          navigate("/calendar");
        }
      } catch (error) {
        console.error("Error parsing game data:", error);
      }
    }

    if (storedDayInfo) {
      try {
        setDayInfo(JSON.parse(storedDayInfo));
      } catch (error) {
        console.error("Error parsing day info:", error);
      }
    }
  }, [navigate]);

  // Check if user has played today
  useEffect(() => {
    const checkPlayStatus = async () => {
      if (dayInfo && user) {
        const hasPlayed = await hasUserPlayedGame(
          dayInfo.day,
          "songGuessGame"
        );
        if (hasPlayed) {
          const userScore = await getUserScoreForDay(
            dayInfo.day,
            "songGuessGame"
          );
          setGameState((prev) => ({
            ...prev,
            hasPlayedToday: true,
            previousScore: userScore?.score || null,
            gameEnded: true, // Show results screen immediately if already played
          }));
        }
      }
    };
    checkPlayStatus();
  }, [dayInfo, user, hasUserPlayedGame, getUserScoreForDay]);

  // Initialize game state when game data loads
  useEffect(() => {
    if (gameData && gameData.songFile?.asset?._ref && gameData.answers) {
      const songUrl = getFileUrl(gameData.songFile.asset._ref);
      const correctAnswer = gameData.answers[gameData.correctAnswerIndex];
      setGameState((prev) => ({
        ...prev,
        songUrl,
        correctAnswer,
        answerOptions: shuffleArray([...gameData.answers]),
        clipDuration: gameData.clipDuration,
        timeRemaining: gameData.clipDuration,
      }));
    }
  }, [gameData]);

  // Timer for audio playback
  useEffect(() => {
    if (gameState.isPlaying && gameState.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setGameState((prev) => ({
          ...prev,
          timeRemaining: Math.max(0, prev.timeRemaining - 0.1),
          timeElapsed: prev.timeElapsed + 0.1,
        }));
      }, 100);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [gameState.isPlaying, gameState.timeRemaining]);

  // Stop audio when time runs out
  useEffect(() => {
    if (gameState.timeRemaining <= 0 && gameState.isPlaying) {
      stopAudio();
    }
  }, [gameState.timeRemaining, gameState.isPlaying]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const playAudio = useCallback(() => {
    if (audioRef.current && gameData) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setGameState((prev) => ({ ...prev, isPlaying: true, gameStarted: true }));
    }
  }, [gameData]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setGameState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const handleStartGame = () => {
    playAudio();
  };

  const handleAnswer = async (answer: string) => {
    if (gameState.gameEnded || gameState.userAnswer) return;

    stopAudio();
    const isCorrect = answer === gameState.correctAnswer;

    // Calculate score
    let finalScore = 0;
    if (isCorrect && gameData && gameData.scoringSettings) {
      const baseScore = gameData.scoringSettings.correctAnswerPoints || 1000;
      const timeBonusPerSecond = gameData.scoringSettings.timeBonusPerSecond || 50;
      const maxTimeBonus = gameData.scoringSettings.maxTimeBonus || 500;
      const timeBonus = Math.min(
        Math.floor(gameState.timeRemaining * timeBonusPerSecond),
        maxTimeBonus
      );
      finalScore = baseScore + timeBonus;
    }

    setGameState((prev) => ({
      ...prev,
      userAnswer: answer,
      score: finalScore,
      showResult: true,
      gameEnded: true,
    }));

    // Save score if user hasn't played today
    if (isCorrect && dayInfo && user && !gameState.hasPlayedToday) {
      try {
        const result = await saveGameScore({
          day: dayInfo.day,
          gameType: "songGuessGame",
          score: finalScore,
        });
        if (result) {
          setGameState((prev) => ({ 
            ...prev, 
            scoreSaved: true,
            hasPlayedToday: true,
            previousScore: result.score 
          }));
        }
      } catch (error) {
        console.error("Error saving score:", error);
      }
    }
  };

  const handlePlayAgain = () => {
    if (!gameData || !gameData.songFile?.asset?._ref || !gameData.answers) return;

    const songUrl = getFileUrl(gameData.songFile.asset._ref);
    const correctAnswer = gameData.answers[gameData.correctAnswerIndex];
    setGameState({
      songUrl,
      correctAnswer,
      answerOptions: shuffleArray([...gameData.answers]),
      clipDuration: gameData.clipDuration,
      timeRemaining: gameData.clipDuration,
      score: 0,
      gameStarted: false,
      gameEnded: false,
      userAnswer: null,
      showResult: false,
      scoreSaved: false,
      hasPlayedToday: gameState.hasPlayedToday,
      previousScore: gameState.previousScore,
      isPlaying: false,
      timeElapsed: 0,
    });
  };

  if (gameState.gameEnded) {
    return (
      <GameResultsScreen
        isFirstAttempt={!gameState.hasPlayedToday}
        currentScore={gameState.score}
        previousScore={gameState.previousScore}
        scoreSaved={gameState.scoreSaved}
        loading={false}
        error={null}
        dayInfo={dayInfo}
        gameType="songGuessGame"
        gameName="Gjett julesangen"
        onPlayAgain={handlePlayAgain}
        scoreLabel="poeng"
      />
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 flex items-center justify-center p-4">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">🎵</div>
          <h2 className="text-2xl font-bold mb-2">Loading Game...</h2>
          <p className="text-red-200">Please wait while we load the song!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 py-8 px-4">
      <audio ref={audioRef} src={gameState.songUrl} />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            {gameData.title || "🎵 Guess the Christmas Song!"}
          </h1>
          {dayInfo && (
            <p className="text-red-200 text-lg">
              Day {dayInfo.day} - {dayInfo.title}
            </p>
          )}
          <p className="text-red-100 mt-2">
            {gameData.description ||
              "Listen to the clip and guess which Christmas song it is!"}
          </p>
        </div>

        {/* First Attempt Notice */}
        {!gameState.gameStarted && !gameState.hasPlayedToday && (
          <div className="bg-green-500/20 border-2 border-green-400 rounded-xl p-4 mb-6">
            <p className="text-center text-white font-semibold">
              🎯 First Attempt Counts!
            </p>
            <p className="text-center text-green-100 text-sm mt-1">
              Your first score will be submitted to the leaderboard
            </p>
          </div>
        )}

        {/* Previous Score Notice */}
        {!gameState.gameStarted && gameState.hasPlayedToday && (
          <div className="bg-blue-500/20 border-2 border-blue-400 rounded-xl p-4 mb-6">
            <p className="text-center text-white font-semibold">
              ⚠️ Only First Attempt Counts!
            </p>
            <p className="text-center text-blue-100 text-sm mt-1">
              Your submitted score: {gameState.previousScore} points
            </p>
            <p className="text-center text-blue-200 text-xs mt-1">
              You can play again for fun, but your score won't change
            </p>
          </div>
        )}

        {/* Game Area */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl border-2 border-white/20 mb-8">
          {/* Audio Player Visual */}
          <div className="text-center mb-8">
            <div className="inline-block p-8 bg-gradient-to-br from-green-600 via-green-700 to-green-800 rounded-full shadow-2xl mb-4">
              <div className="text-8xl">🎵</div>
            </div>
            
            {gameState.gameStarted && (
              <div className="mt-4">
                <div className="text-white text-2xl font-bold mb-2">
                  {gameState.timeRemaining.toFixed(1)}s
                </div>
                <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-100"
                    style={{
                      width: `${(gameState.timeRemaining / gameState.clipDuration) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Start/Play Again Button */}
          {!gameState.gameStarted && !gameState.showResult && (
            <div className="text-center mb-8">
              <button
                onClick={handleStartGame}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                {gameState.hasPlayedToday ? "🔄 Play Again (For Fun)" : "▶️ Start Game"}
              </button>
            </div>
          )}

          {/* Answer Options */}
          {gameState.gameStarted && !gameState.showResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameState.answerOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={gameState.userAnswer !== null}
                  className="bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white p-6 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg border-2 border-white/30 hover:border-white/50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Result */}
          {gameState.showResult && (
            <div className="text-center">
              <div className="mb-6">
                {gameState.userAnswer === gameState.correctAnswer ? (
                  <>
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-3xl font-bold text-green-300 mb-2">
                      Correct!
                    </h2>
                    <p className="text-xl text-white mb-4">
                      The answer was: <span className="font-bold">{gameState.correctAnswer}</span>
                    </p>
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-christmas-lg border-2 border-red-400/20 mb-4">
                      <p className="text-4xl font-bold text-white">
                        {gameState.score} points
                      </p>
                      {!gameState.hasPlayedToday && (
                        <div className="mt-2 p-3 bg-red-500/20 border border-red-400/50 rounded-lg">
                          <p className="text-red-200 text-sm">
                            ✅ Score saved to leaderboard!
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">😔</div>
                    <h2 className="text-3xl font-bold text-red-300 mb-2">
                      Not quite!
                    </h2>
                    <p className="text-xl text-white mb-2">
                      The correct answer was:
                    </p>
                    <p className="text-2xl font-bold text-green-300 mb-4">
                      {gameState.correctAnswer}
                    </p>
                    <p className="text-lg text-red-200">
                      You answered: {gameState.userAnswer}
                    </p>
                  </>
                )}

                {gameState.hasPlayedToday && gameState.previousScore !== null && (
                  <div className="bg-red-500/20 border-2 border-red-400 rounded-xl p-4 mt-4">
                    <p className="text-white font-semibold text-sm">
                      Your Submitted Score (First Attempt)
                    </p>
                    <p className="text-red-300 text-2xl font-bold">
                      {gameState.previousScore} points
                    </p>
                    <p className="text-red-200 text-xs mt-1">
                      This is the score on the leaderboard
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handlePlayAgain}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                🔄 Play Again
              </button>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        {dayInfo && gameState.gameEnded && (
          <div className="mb-8">
            <Leaderboard day={dayInfo.day} gameType="songGuessGame" />
          </div>
        )}

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => navigate("/calendar")}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 border-2 border-white/30"
          >
            ← Back to Calendar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SongGuessGame;

