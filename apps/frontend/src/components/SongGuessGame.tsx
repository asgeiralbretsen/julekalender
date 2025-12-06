import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useGameScore } from "../hooks/useGameScore";
import GameResultsScreen from "./GameResultsScreen";
import { StartGameScreen } from "./StartGameScreen";
import { client } from "../lib/sanity";
import { normalizeGameScore } from "../utils";
import { ChristmasBackground } from "./ChristmasBackground";
import { LoadingScreen } from "./LoadingScreen";

interface SongData {
  songUrl: string;
  correctAnswer: string;
  answerOptions: string[];
  clipDuration: number;
}

interface GameState {
  currentSong: SongData | null;
  timeRemaining: number;
  score: number;
  timebonus: number;
  round: number;
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
  songs: Array<{
    songFile: {
      asset: {
        _ref: string;
        url?: string;
      };
    };
    answers: string[];
    correctAnswerIndex: number;
    clipDuration: number;
  }>;
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
  const [allSongs, setAllSongs] = useState<SongData[]>([]);
  const [dayInfo, setDayInfo] = useState<{ day: number; title: string } | null>(
    null
  );

  const gameTime = 20;

  const [gameState, setGameState] = useState<GameState>({
    currentSong: null,
    timeRemaining: gameTime,
    score: 0,
    timebonus: 0,
    round: 1,
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

  // Helper function to shuffle array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Initialize game state when game data loads
  useEffect(() => {
    if (gameData && gameData.songs && gameData.songs.length > 0) {
      // Convert all songs to SongData format
      const songs: SongData[] = gameData.songs.map((song) => ({
        songUrl: getFileUrl(song.songFile.asset._ref),
        correctAnswer: song.answers[song.correctAnswerIndex],
        answerOptions: shuffleArray([...song.answers]),
        clipDuration: song.clipDuration,
      }));
      setAllSongs(songs);
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

  const loadSong = useCallback(
    (roundNumber: number, autoPlay: boolean = false) => {
      const songIndex = roundNumber - 1;
      const song = allSongs[songIndex];

      if (!song) {
        console.error("No song found for round", roundNumber);
        return;
      }

      setGameState((prev) => ({
        ...prev,
        currentSong: song,
        timeRemaining: gameTime,
        timeElapsed: 0,
        userAnswer: null,
        showResult: false,
        isPlaying: autoPlay,
        gameStarted: autoPlay ? true : prev.gameStarted,
      }));
    },
    [allSongs]
  );

  // Auto-play audio when game starts
  useEffect(() => {
    if (
      gameState.gameStarted &&
      gameState.isPlaying &&
      audioRef.current &&
      gameState.currentSong
    ) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  }, [gameState.gameStarted, gameState.isPlaying, gameState.currentSong]);

  const handleStartGame = () => {
    if (allSongs.length === 0) {
      console.error("No songs available to play");
      return;
    }
    loadSong(1, true); // Load first song and auto-play
  };

  const handleAnswer = async (answer: string) => {
    if (gameState.gameEnded || gameState.userAnswer || !gameState.currentSong)
      return;

    stopAudio();
    const isCorrect = answer === gameState.currentSong.correctAnswer;

    // Calculate score for this round
    let roundScore = 0;
    let roundTimebonus = 0;
    if (isCorrect) {
      roundScore = 1;
      roundTimebonus = gameState.timeRemaining / gameTime / allSongs.length;
    }

    // Update game state with answer
    setGameState((prev) => ({
      ...prev,
      userAnswer: answer,
      score: prev.score + roundScore,
      timebonus: prev.timebonus + roundTimebonus,
      showResult: true,
    }));

    // Wait 2 seconds to show result, then move to next song or end game
    setTimeout(() => {
      if (gameState.round >= allSongs.length) {
        // Game is over - all songs completed
        const finalScore = gameState.score + roundScore;
        const finalTimeBonus = gameState.timebonus + roundTimebonus;

        // Save score if user hasn't played today
        if (dayInfo && user && !gameState.hasPlayedToday) {
          saveGameScore({
            day: dayInfo.day,
            gameType: "songGuessGame",
            score: normalizeGameScore(
              finalScore,
              allSongs.length,
              finalTimeBonus
            ),
          })
            .then((result) => {
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
            })
            .catch((error) => {
              console.error("Error saving score:", error);
              setGameState((prev) => ({ ...prev, gameEnded: true }));
            });
        } else {
          setGameState((prev) => ({ ...prev, gameEnded: true }));
        }
      } else {
        // Move to next song
        const nextRound = gameState.round + 1;
        setGameState((prev) => ({ ...prev, round: nextRound }));
        loadSong(nextRound, true); // Load and auto-play next song
      }
    }, 2000);
  };

  const handlePlayAgain = () => {
    if (!gameData || !gameData.songs || gameData.songs.length === 0) return;

    // Reshuffle all songs
    const songs: SongData[] = gameData.songs.map((song) => ({
      songUrl: getFileUrl(song.songFile.asset._ref),
      correctAnswer: song.answers[song.correctAnswerIndex],
      answerOptions: shuffleArray([...song.answers]),
      clipDuration: song.clipDuration,
    }));
    setAllSongs(songs);

    // Reset game state to start fresh
    setGameState({
      currentSong: null,
      timeRemaining: gameTime,
      score: 0,
      timebonus: 0,
      round: 1,
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
  const audioElement = (
    <audio ref={audioRef} src={gameState.currentSong?.songUrl || null} />
  );

  if (gameState.gameEnded) {
    return (
      <>
        {audioElement}
        <GameResultsScreen
          isFirstAttempt={!gameState.hasPlayedToday}
          currentScore={normalizeGameScore(
            gameState.score,
            allSongs.length,
            gameState.timebonus
          )}
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

  if (!gameData || allSongs.length === 0) {
    return (
      <>
        {audioElement}
        <LoadingScreen />
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
            `• ${allSongs.length} ${allSongs.length === 1 ? "sang" : "sanger"} totalt`,
            "• Lytt til hvert sangklipp",
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
      <ChristmasBackground>
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
              <span>
                Sang {gameState.round}/{allSongs.length}
              </span>
              <span>Poeng: {gameState.score}</span>
            </div>
          </div>

          {/* Game Area */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-christmas-lg border-2 border-yellow-400/20">
            {/* Audio Player Visual */}
            <div className="text-center mb-8">
              <div className="inline-block p-8 bg-gradient-to-br from-green-600 via-green-700 to-green-800 rounded-full shadow-2xl mb-4">
                <div className="text-8xl">🎵</div>
              </div>

              {gameState.gameStarted && gameState.currentSong && (
                <div className="mt-4">
                  <div className="text-white text-2xl font-bold mb-2">
                    {gameState.timeRemaining.toFixed(1)}s
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-100"
                      style={{
                        width: `${(gameState.timeRemaining / gameTime) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameState.currentSong?.answerOptions.map((option, index) => {
                const isUserAnswer = gameState.userAnswer === option;
                const isCorrectAnswer =
                  gameState.currentSong?.correctAnswer === option;
                const showFeedback = gameState.showResult;

                let buttonClass =
                  "bg-white/20 hover:bg-white/30 text-white p-6 rounded-lg font-semibold border-2 border-white/30 hover:border-white/50 transition-all duration-200";

                if (showFeedback) {
                  if (isCorrectAnswer) {
                    buttonClass =
                      "bg-green-600/50 text-white p-6 rounded-lg font-semibold border-2 border-green-400";
                  } else if (isUserAnswer) {
                    buttonClass =
                      "bg-red-600/50 text-white p-6 rounded-lg font-semibold border-2 border-red-400";
                  } else {
                    buttonClass =
                      "bg-white/10 text-white/50 p-6 rounded-lg font-semibold border-2 border-white/20";
                  }
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    disabled={gameState.userAnswer !== null}
                    className={`${buttonClass} disabled:cursor-not-allowed`}
                  >
                    {option}
                    {showFeedback && isCorrectAnswer && " ✓"}
                    {showFeedback && isUserAnswer && !isCorrectAnswer && " ✗"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ChristmasBackground>
    </>
  );
};

export default SongGuessGame;
