import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useGameScore } from "../hooks/useGameScore";
import GameResultsScreen from "./GameResultsScreen";
import { StartGameScreen } from "./StartGameScreen";
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
  const [, assetId, extension] = ref.split("-");
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
        const hasPlayed = await hasUserPlayedGame(dayInfo.day, "songGuessGame");
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

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setGameState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, []);

  useEffect(() => {
    if (gameState.timeRemaining <= 0 && gameState.isPlaying) {
      stopAudio();
    }
  }, [gameState.timeRemaining, gameState.isPlaying, stopAudio]);

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
      const timeBonusPerSecond =
        gameData.scoringSettings.timeBonusPerSecond || 50;
      const maxTimeBonus = gameData.scoringSettings.maxTimeBonus || 500;
      const timeBonus = Math.min(
        Math.floor(gameState.timeRemaining * timeBonusPerSecond),
        maxTimeBonus
      );
      finalScore = baseScore + timeBonus;
    }

    // Update game state with answer
    setGameState((prev) => ({
      ...prev,
      userAnswer: answer,
      score: finalScore,
    }));

    // Save score if user hasn't played today and answer is correct
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
            previousScore: result.score,
            gameEnded: true,
          }));
        } else {
          setGameState((prev) => ({ ...prev, gameEnded: true }));
        }
      } catch (error) {
        console.error("Error saving score:", error);
        setGameState((prev) => ({ ...prev, gameEnded: true }));
      }
    } else {
      // If already played or wrong answer, just end the game
      setGameState((prev) => ({ ...prev, gameEnded: true }));
    }
  };

  const handlePlayAgain = () => {
    if (!gameData || !gameData.songFile?.asset?._ref || !gameData.answers)
      return;

    const songUrl = getFileUrl(gameData.songFile.asset._ref);
    const correctAnswer = gameData.answers[gameData.correctAnswerIndex];

    // Reset game state to start fresh
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

  // Render audio element at component level so it's always available
  const audioElement = <audio ref={audioRef} src={gameState.songUrl} />;

  if (gameState.gameEnded) {
    return (
      <>
        {audioElement}
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
      </>
    );
  }

  if (!gameData) {
    return (
      <>
        {audioElement}
        <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center shadow-christmas-lg border-2 border-yellow-400/20">
            <div className="text-6xl mb-4">🎵</div>
            <p className="text-red-100">Laster sang...</p>
          </div>
        </div>
      </>
    );
  }

  // Pre-game screen
  if (!gameState.gameStarted) {
    return (
      <>
        {audioElement}
        <StartGameScreen
          title={
            dayInfo
              ? `Dag ${dayInfo.day}: ${dayInfo.title}`
              : gameData.title || "Gjett julesangen!"
          }
          description={
            gameData.description ||
            "Lytt til klippet og gjett hvilken julesang det er!"
          }
          howToPlay={[
            `• Lytt til sangklippet (${gameState.clipDuration} sekunder)`,
            "• Velg riktig julesang",
            "• Rask gjetning gir bonuspoeng",
            "• Første forsøk teller!",
          ]}
          previousScore={
            gameState.hasPlayedToday ? gameState.previousScore : undefined
          }
          onClickStartGame={handleStartGame}
        />
      </>
    );
  }

  return (
    <>
      {audioElement}
      <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 relative overflow-hidden p-4">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1482517967863-00e15c9b44be?q=80&w=2070&auto=format&fit=crop')] opacity-10 bg-cover bg-center" />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold text-yellow-300 mb-2 drop-shadow-lg"
              style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
            >
              {dayInfo
                ? `Dag ${dayInfo.day}: ${dayInfo.title}`
                : gameData.title || "Gjett julesangen!"}
            </h1>
            <div className="flex justify-center gap-8 text-red-100">
              <span>🎵 Gjett sangen</span>
              {gameState.score > 0 && <span>Poeng: {gameState.score}</span>}
            </div>
          </div>

          {/* Game Area */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-christmas-lg border-2 border-yellow-400/20">
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

            {/* Answer Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameState.answerOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  disabled={gameState.userAnswer !== null}
                  className="bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white p-6 rounded-lg font-semibold border-2 border-white/30 hover:border-white/50 transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SongGuessGame;
