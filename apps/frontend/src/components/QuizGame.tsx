import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useGameScore } from "../hooks/useGameScore";
import Leaderboard from "./Leaderboard";
import GameResultsScreen from "./GameResultsScreen";
import { StartGameScreen } from "./StartGameScreen";

interface Question {
  questionText: string;
  answers: string[];
  correctAnswerIndex: number;
  timeLimit: number;
}

interface QuizGameData {
  title: string;
  description: string;
  questions: Question[];
  scoringSettings: {
    correctAnswerPoints: number;
    timeBonus: number;
  };
}

export default function QuizGame() {
  const { user } = useUser();
  const {
    saveGameScore,
    hasUserPlayedGame,
    getUserScoreForDay,
    loading: scoreLoading,
    error: scoreError,
  } = useGameScore();

  const [gameData, setGameData] = useState<QuizGameData | null>(null);
  const [dayInfo, setDayInfo] = useState<{ day: number; title: string } | null>(
    null
  );
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingPlayStatus, setCheckingPlayStatus] = useState(true);

  useEffect(() => {
    const gameDataStr = sessionStorage.getItem("currentGameData");
    const dayInfoStr = sessionStorage.getItem("currentDayInfo");

    if (gameDataStr) {
      try {
        const parsed = JSON.parse(gameDataStr);
        if (parsed.quizGameData) {
          setGameData(parsed.quizGameData);
        }
      } catch (error) {
        console.error("Error parsing game data:", error);
      }
    }

    if (dayInfoStr) {
      try {
        setDayInfo(JSON.parse(dayInfoStr));
      } catch (error) {
        console.error("Error parsing day info:", error);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const checkIfPlayedToday = async () => {
      if (!user || !dayInfo) {
        setCheckingPlayStatus(false);
        return;
      }

      try {
        const hasPlayed = await hasUserPlayedGame(dayInfo.day, "quizGame");
        if (hasPlayed) {
          const previousScoreData = await getUserScoreForDay(
            dayInfo.day,
            "quizGame"
          );
          setHasPlayedToday(true);
          setPreviousScore(previousScoreData?.score || null);
          setGameEnded(true);
        }
      } catch (err) {
        console.error("Error checking if user has played today:", err);
      } finally {
        setCheckingPlayStatus(false);
      }
    };

    checkIfPlayedToday();
  }, [user, dayInfo, hasUserPlayedGame, getUserScoreForDay]);

  useEffect(() => {
    if (gameStarted && !showResult && !gameEnded && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameStarted && !showResult && !gameEnded) {
      handleTimeout();
    }
  }, [gameStarted, timeLeft, showResult, gameEnded]);

  const startGame = () => {
    if (!gameData) return;
    setGameStarted(true);
    setGameEnded(false);
    setCurrentRound(0);
    setScore(0);
    setTimeLeft(gameData.questions[0].timeLimit);
    setSelectedAnswer(null);
    setShowResult(false);
    setScoreSaved(false);
  };

  const handleTimeout = () => {
    setShowResult(true);
    setTimeout(() => {
      nextRound();
    }, 2000);
  };

  const handleAnswerClick = (answerIndex: number) => {
    if (selectedAnswer !== null || !gameData) return;

    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const currentQuestion = gameData.questions[currentRound];
    const isCorrect = answerIndex === currentQuestion.correctAnswerIndex;

    if (isCorrect) {
      const points =
        gameData.scoringSettings.correctAnswerPoints +
        timeLeft * gameData.scoringSettings.timeBonus;
      setScore(score + points);
    }

    setTimeout(() => {
      nextRound();
    }, 2000);
  };

  const nextRound = () => {
    if (!gameData) return;

    if (currentRound + 1 < gameData.questions.length) {
      setCurrentRound(currentRound + 1);
      setTimeLeft(gameData.questions[currentRound + 1].timeLimit);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      endGame();
    }
  };

  const endGame = async () => {
    setGameEnded(true);

    if (user && dayInfo && !hasPlayedToday) {
      try {
        const result = await saveGameScore({
          day: dayInfo.day,
          gameType: "quizGame",
          score: score,
        });

        if (result) {
          setScoreSaved(true);
          setHasPlayedToday(true);
          setPreviousScore(score);
        }
      } catch (err) {
        console.error("Error saving game score:", err);
      }
    }
  };

  if (loading || checkingPlayStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center shadow-christmas-lg border-2 border-yellow-400/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-300 mx-auto mb-4"></div>
          <p className="text-red-100">Laster quiz...</p>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center shadow-christmas-lg border-2 border-yellow-400/20">
          <p className="text-red-100">Ingen quiz-data tilgjengelig</p>
        </div>
      </div>
    );
  }

  if (gameEnded) {
    return (
      <GameResultsScreen
        isFirstAttempt={!hasPlayedToday || scoreSaved}
        currentScore={score}
        previousScore={previousScore}
        scoreSaved={scoreSaved}
        loading={scoreLoading}
        error={scoreError}
        dayInfo={dayInfo}
        gameType="quizGame"
        gameName="Quiz"
        onPlayAgain={startGame}
        scoreLabel="poeng"
      />
    );
  }

  if (!gameStarted) {
    return (
      <StartGameScreen
        title={
          dayInfo ? `Dag ${dayInfo.day}: ${dayInfo.title}` : gameData.title
        }
        description={gameData.description}
        howToPlay={[
          `• ${gameData.questions.length} spørsmål`,
          "• 4 svaralternativer hver",
          "• Bonuspoeng for raske svar",
          "• Første forsøk teller!",
        ]}
        previousScore={hasPlayedToday ? previousScore : undefined}
        onClickStartGame={startGame}
      />
    );
  }

  const currentQuestion = gameData.questions[currentRound];
  const isCorrect = selectedAnswer === currentQuestion.correctAnswerIndex;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1482517967863-00e15c9b44be?q=80&w=2070&auto=format&fit=crop')] opacity-10 bg-cover bg-center" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold text-yellow-300 mb-2 drop-shadow-lg"
            style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
          >
            {dayInfo ? `Dag ${dayInfo.day}: ${dayInfo.title}` : gameData.title}
          </h1>
          <div className="flex justify-center gap-8 text-red-100">
            <span>
              Spørsmål {currentRound + 1} / {gameData.questions.length}
            </span>
            <span>Poeng: {score}</span>
            <span
              className={
                timeLeft <= 5 ? "text-red-300 font-bold animate-pulse" : ""
              }
            >
              Tid: {timeLeft}s
            </span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-christmas-lg border-2 border-yellow-400/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {currentQuestion.questionText}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.answers.map((answer, index) => {
              let buttonStyle = "bg-white/20 hover:bg-white/30 border-white/30";

              if (showResult) {
                if (index === currentQuestion.correctAnswerIndex) {
                  buttonStyle = "bg-green-600 border-green-500";
                } else if (index === selectedAnswer) {
                  buttonStyle = "bg-red-600 border-red-500";
                } else {
                  buttonStyle = "bg-gray-600 border-gray-500";
                }
              } else if (selectedAnswer === index) {
                buttonStyle = "bg-yellow-500 border-yellow-400";
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerClick(index)}
                  disabled={selectedAnswer !== null || showResult}
                  className={`p-6 rounded-lg font-semibold text-white border-2 transition-all duration-200 ${buttonStyle} disabled:cursor-not-allowed`}
                >
                  {answer}
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="mt-6 text-center">
              <p
                className={`text-2xl font-bold ${isCorrect ? "text-green-300" : "text-red-300"}`}
              >
                {isCorrect ? "✅ Riktig!" : "❌ Feil!"}
              </p>
              {isCorrect && (
                <p className="text-yellow-300 mt-2">
                  +
                  {gameData.scoringSettings.correctAnswerPoints +
                    timeLeft * gameData.scoringSettings.timeBonus}{" "}
                  poeng
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
