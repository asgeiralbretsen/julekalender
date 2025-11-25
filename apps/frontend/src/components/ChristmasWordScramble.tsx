import { useState, useEffect, useRef } from "react";
import { ChristmasBackground } from "./ChristmasBackground";
import { useUser } from "@clerk/clerk-react";
import { useGameScore } from "../hooks/useGameScore";
import GameResultsScreen from "./GameResultsScreen";
import { StartGameScreen } from "./StartGameScreen";
import { normalizeGameScore } from "../utils";

interface Word {
  word: string;
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
  const [totalTimeBonus, setTotalTimeBonus] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState<
    "correct" | "wrong" | "skipped" | null
  >(null);
  const [revealedWord, setRevealedWord] = useState<string | null>(null);

  // Track played status
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [showResultsScreen, setShowResultsScreen] = useState(false);

  // Ref for input field
  const inputRef = useRef<HTMLInputElement>(null);

  const gameTime = 10;

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
    setTimeRemaining(gameTime);
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
      const timeBonus =
        (timeRemaining / gameTime) / gameData.words.length;
      
      setTotalTimeBonus((prev) => prev + timeBonus);

      setScore((prev) => prev + 1);
      setCorrectAnswers((prev) => prev + 1);

      setTimeout(() => {
        moveToNextWord();
      }, 1500);
    } else {
      setFeedback("wrong");
      setRevealedWord(currentWord.word);

      setTimeout(() => {
        setFeedback(null);
        setRevealedWord(null);
        moveToNextWord();
      }, 2000);
    }
  };

  // Skip to next word
  const handleSkip = () => {
    if (!gameData) return;

    const currentWord = gameData.words[currentWordIndex];
    setFeedback("skipped");
    setRevealedWord(currentWord.word);

    setTimeout(() => {
      setFeedback(null);
      setRevealedWord(null);
      moveToNextWord();
    }, 2000);
  };

  // Move to next word
  const moveToNextWord = () => {
    if (!gameData) return;

    if (currentWordIndex < gameData.words.length - 1) {
      setCurrentWordIndex((prev) => prev + 1);
      setScrambledWord(scrambleWord(gameData.words[currentWordIndex + 1].word));
      setUserInput("");
      setFeedback(null);
      setRevealedWord(null);
      setTimeRemaining(gameData.timeLimit);

      // Refocus input field after a short delay
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
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
          score: normalizeGameScore(score, gameData.words.length, totalTimeBonus)
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
      <GameResultsScreen
        isFirstAttempt={!hasPlayedToday}
        currentScore={score}
        previousScore={previousScore}
        scoreSaved={scoreSaved}
        loading={scoreLoading}
        error={scoreError}
        dayInfo={dayInfo}
        gameType="wordScrambleGame"
        gameName="Juleord Scramble"
        onPlayAgain={() => {
          setGameEnded(false);
          setShowResultsScreen(false);
          startGame();
        }}
        scoreLabel="poeng"
      />
    );
  }

  // Start screen
  if (!gameStarted) {
    return (
      <StartGameScreen
        title="Juleord Scramble"
        description=""
        howToPlay={[
          "Stokkede juleord vises",
          "Gjett det riktige ordet",
          "10 sekunder per ord",
        ]}
        previousScore={previousScore}
        onClickStartGame={startGame}
      />
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
              {timeRemaining}s
            </div>
            <div className="text-white/80">Poeng: {score}</div>
          </div>

          {/* Scrambled word */}
          <div className="text-center mb-8">
            <div className="text-5xl font-bold text-white mb-4 tracking-wider">
              {scrambledWord.toUpperCase()}
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={`text-center mb-4 p-3 rounded-lg ${
                feedback === "correct"
                  ? "bg-green-500/20 border border-green-400/50"
                  : feedback === "skipped"
                    ? "bg-yellow-500/20 border border-yellow-400/50"
                    : "bg-red-500/20 border border-red-400/50"
              }`}
            >
              <p
                className={`font-bold ${
                  feedback === "correct"
                    ? "text-green-200"
                    : feedback === "skipped"
                      ? "text-yellow-200"
                      : "text-red-200"
                }`}
              >
                {feedback === "correct"
                  ? `Riktig! Ordet var "${currentWord.word}"`
                  : feedback === "skipped"
                    ? `Hoppet over! Ordet var "${revealedWord}"`
                    : `Feil! Riktig ord var "${revealedWord}"`}
              </p>
            </div>
          )}

          {/* Input */}
          <div className="mb-6">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              disabled={feedback !== null}
              placeholder="Skriv ditt svar her..."
              className="w-full px-6 py-4 text-2xl text-center bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-yellow-400/50"
              autoFocus
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSkip}
              disabled={feedback !== null}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hopp over
            </button>
            <button
              onClick={handleSubmit}
              disabled={!userInput.trim() || feedback !== null}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sjekk svar
            </button>
          </div>
        </div>
      </div>
    </ChristmasBackground>
  );
};

export default ChristmasWordScramble;
