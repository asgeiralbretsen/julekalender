import { useState, useEffect } from "react";
import { ChristmasBackground } from "./ChristmasBackground";
import { useUser } from "@clerk/clerk-react";
import { useGameScore } from "../hooks/useGameScore";
import GameResultsScreen from "./GameResultsScreen";

interface Word {
  word: string;
  hint?: string;
}

interface GameData {
  title: string;
  description?: string;
  words: Word[];
  timeLimit: number;
  scoringSettings: {
    correctAnswerPoints: number;
    timeBonusPerSecond: number;
  };
}

const ChristmasWordScramble = () => {
  const { user } = useUser();
  const {
    saveGameScore,
    hasUserPlayedGame,
    getUserScoreForDay,
    loading: scoreLoading,
    error: scoreError,
  } = useGameScore();

  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dayInfo, setDayInfo] = useState<{ day: number; title: string } | null>(
    null
  );

  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [scrambledWord, setScrambledWord] = useState("");
  const [userInput, setUserInput] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  // Track played status
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [showResultsScreen, setShowResultsScreen] = useState(false);

  // Load game data
  useEffect(() => {
    const loadGameData = async () => {
      try {
        const gameDataStr = sessionStorage.getItem("currentGameData");
        const dayInfoStr = sessionStorage.getItem("currentDayInfo");

        if (gameDataStr) {
          const parsedData = JSON.parse(gameDataStr);
          if (parsedData.wordScrambleGameData) {
            setGameData(parsedData.wordScrambleGameData);
            setTimeRemaining(parsedData.wordScrambleGameData.timeLimit);
          }
        }

        if (dayInfoStr) {
          setDayInfo(JSON.parse(dayInfoStr));
        }
      } catch (error) {
        console.error("Error loading game data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadGameData();
  }, []);

  // Check if user has played today
  useEffect(() => {
    const checkIfPlayedToday = async () => {
      if (!user || !dayInfo) return;

      try {
        const hasPlayed = await hasUserPlayedGame(
          dayInfo.day,
          "wordScrambleGame"
        );
        if (hasPlayed) {
          const previousScoreData = await getUserScoreForDay(
            dayInfo.day,
            "wordScrambleGame"
          );
          setHasPlayedToday(true);
          setPreviousScore(previousScoreData?.score || null);
          setShowResultsScreen(true);
        }
      } catch (err) {
        console.error("Error checking if user has played today:", err);
      }
    };

    checkIfPlayedToday();
  }, [user, dayInfo, hasUserPlayedGame, getUserScoreForDay]);

  // Scramble a word
  const scrambleWord = (word: string): string => {
    const letters = word.split("");
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    // Make sure it's actually scrambled (not the same as original)
    const scrambled = letters.join("");
    if (scrambled === word && word.length > 1) {
      return scrambleWord(word); // Try again
    }
    return scrambled;
  };

  // Start game
  const startGame = () => {
    if (!gameData || !gameData.words.length) return;

    setGameStarted(true);
    setCurrentWordIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setUserInput("");
    setFeedback(null);
    setTimeRemaining(gameData.timeLimit);
    setScrambledWord(scrambleWord(gameData.words[0].word));
  };

  // Timer countdown
  useEffect(() => {
    if (gameStarted && !gameEnded && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameStarted && timeRemaining === 0) {
      handleSkip();
    }
  }, [gameStarted, gameEnded, timeRemaining]);

  // Check answer
  const handleSubmit = () => {
    if (!gameData) return;

    const currentWord = gameData.words[currentWordIndex];
    const isCorrect =
      userInput.toLowerCase().trim() === currentWord.word.toLowerCase();

    if (isCorrect) {
      setFeedback("correct");
      const basePoints = gameData.scoringSettings.correctAnswerPoints;
      const timeBonus =
        timeRemaining * gameData.scoringSettings.timeBonusPerSecond;
      const totalPoints = basePoints + timeBonus;

      setScore((prev) => prev + totalPoints);
      setCorrectAnswers((prev) => prev + 1);

      setTimeout(() => {
        moveToNextWord();
      }, 1500);
    } else {
      setFeedback("wrong");
      setTimeout(() => {
        setFeedback(null);
      }, 1000);
    }
  };

  // Skip to next word
  const handleSkip = () => {
    setFeedback(null);
    moveToNextWord();
  };

  // Move to next word
  const moveToNextWord = () => {
    if (!gameData) return;

    if (currentWordIndex < gameData.words.length - 1) {
      setCurrentWordIndex((prev) => prev + 1);
      setScrambledWord(scrambleWord(gameData.words[currentWordIndex + 1].word));
      setUserInput("");
      setFeedback(null);
      setTimeRemaining(gameData.timeLimit);
    } else {
      endGame();
    }
  };

  // End game
  const endGame = async () => {
    setGameEnded(true);
    setGameStarted(false);

    // Save score
    if (user && dayInfo && !hasPlayedToday) {
      try {
        const result = await saveGameScore({
          day: dayInfo.day,
          gameType: "wordScrambleGame",
          score: score,
        });

        if (result && result.score === score) {
          setScoreSaved(true);
          setHasPlayedToday(true);
          setPreviousScore(score);
        }
      } catch (err) {
        console.error("Error saving game score:", err);
      }
    }
  };

  // Show results screen if already played
  if (showResultsScreen) {
    return (
      <GameResultsScreen
        isFirstAttempt={false}
        currentScore={0}
        previousScore={previousScore}
        scoreSaved={true}
        loading={false}
        error={null}
        dayInfo={dayInfo}
        gameType="wordScrambleGame"
        gameName="Juleord Scramble"
        onPlayAgain={() => setShowResultsScreen(false)}
        scoreLabel="poeng"
        scoreSuffix=" poeng"
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <ChristmasBackground>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="p-8 max-w-md w-full text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Laster spill...
            </h1>
            <p className="text-white/80">Forbereder juleordene dine!</p>
          </div>
        </div>
      </ChristmasBackground>
    );
  }

  // No game data
  if (!gameData || !gameData.words.length) {
    return (
      <ChristmasBackground>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              Ingen spill funnet
            </h1>
            <p className="text-white/80">
              Beklager, ingen juleord er konfigurert for denne dagen.
            </p>
          </div>
        </div>
      </ChristmasBackground>
    );
  }

  // Game ended - show results
  if (gameEnded) {
    return (
      <ChristmasBackground>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
            <h1 className="text-4xl font-bold text-white mb-6">
              🎄 Spillet er ferdig! 🎄
            </h1>

            <div className="mb-6 p-6 bg-white/10 rounded-xl">
              <div className="text-5xl font-bold text-yellow-300 mb-2">
                {score}
              </div>
              <div className="text-white/80 text-sm">poeng</div>
            </div>

            <div className="mb-6 space-y-2 text-white/80">
              <p>
                Riktige svar: {correctAnswers} / {gameData.words.length}
              </p>
              {scoreSaved && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-400/50 rounded-lg">
                  <p className="text-green-200 text-sm">✅ Poengsum lagret!</p>
                </div>
              )}
              {hasPlayedToday && !scoreSaved && (
                <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-400/50 rounded-lg">
                  <p className="text-yellow-200 text-sm">
                    ⚠️ Øvingsrunde - Poengsum ikke lagret
                  </p>
                  <p className="text-white/60 text-xs mt-1">
                    Din innsendte poengsum: {previousScore} poeng
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setGameEnded(false);
                setShowResultsScreen(false);
                startGame();
              }}
              className="w-full bg-gradient-to-r from-red-500 to-green-500 text-white px-6 py-3 rounded-full font-semibold hover:from-red-600 hover:to-green-600 transition-all duration-300"
            >
              {hasPlayedToday
                ? "🔄 Spill igjen (for moro skyld)"
                : "🔄 Prøv igjen"}
            </button>
          </div>
        </div>
      </ChristmasBackground>
    );
  }

  // Start screen
  if (!gameStarted) {
    return (
      <ChristmasBackground>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              🎄{" "}
              {dayInfo
                ? `Dag ${dayInfo.day}: ${dayInfo.title}`
                : gameData.title}
            </h1>
            {gameData.description && (
              <p className="text-white/80 mb-6">{gameData.description}</p>
            )}

            <div className="mb-6 p-4 bg-white/5 rounded-xl text-left">
              <h3 className="text-white font-semibold mb-2">
                📋 Hvordan spille:
              </h3>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Stokka juleord vises</li>
                <li>• Gjett det riktige ordet</li>
                <li>• {gameData.timeLimit} sekunder per ord</li>
                <li>• {gameData.words.length} ord totalt</li>
              </ul>
            </div>

            {hasPlayedToday && previousScore !== null && (
              <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-400/50 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  ⚠️ Bare første forsøk teller!
                </p>
                <p className="text-white/70 text-xs mt-1">
                  Din innsendte poengsum: {previousScore} poeng
                </p>
              </div>
            )}

            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-red-500 to-green-500 text-white px-8 py-4 rounded-full font-bold text-xl hover:from-red-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105"
            >
              🎮 Start Spill
            </button>
          </div>
        </div>
      </ChristmasBackground>
    );
  }

  // Game screen
  const currentWord = gameData.words[currentWordIndex];

  return (
    <ChristmasBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-2xl w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-white/80">
              Ord {currentWordIndex + 1} av {gameData.words.length}
            </div>
            <div
              className={`text-2xl font-bold ${timeRemaining <= 5 ? "text-red-400" : "text-white"}`}
            >
              ⏱️ {timeRemaining}s
            </div>
            <div className="text-white/80">Poeng: {score}</div>
          </div>

          {/* Scrambled word */}
          <div className="text-center mb-8">
            <div className="text-5xl font-bold text-white mb-4 tracking-wider">
              {scrambledWord.toUpperCase()}
            </div>
            {currentWord.hint && (
              <div className="text-yellow-300 text-sm">
                💡 Hint: {currentWord.hint}
              </div>
            )}
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={`text-center mb-4 p-3 rounded-lg ${
                feedback === "correct"
                  ? "bg-green-500/20 border border-green-400/50"
                  : "bg-red-500/20 border border-red-400/50"
              }`}
            >
              <p
                className={`font-bold ${
                  feedback === "correct" ? "text-green-200" : "text-red-200"
                }`}
              >
                {feedback === "correct"
                  ? `✅ Riktig! Ordet var "${currentWord.word}"`
                  : "❌ Feil, prøv igjen!"}
              </p>
            </div>
          )}

          {/* Input */}
          <div className="mb-6">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              disabled={feedback === "correct"}
              placeholder="Skriv ditt svar her..."
              className="w-full px-6 py-4 text-2xl text-center bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/50"
              autoFocus
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSkip}
              disabled={feedback === "correct"}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⏭️ Hopp over
            </button>
            <button
              onClick={handleSubmit}
              disabled={!userInput.trim() || feedback === "correct"}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✅ Sjekk svar
            </button>
          </div>
        </div>
      </div>
    </ChristmasBackground>
  );
};

export default ChristmasWordScramble;
