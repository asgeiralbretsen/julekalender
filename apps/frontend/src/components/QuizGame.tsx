import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useGameScore } from "../hooks/useGameScore";
import GameResultsScreen from "./GameResultsScreen";
import { StartGameScreen } from "./StartGameScreen";
import { normalizeGameScore } from "../utils";
import { ChristmasBackground } from "./ChristmasBackground";
import { LoadingScreen } from "./LoadingScreen";
import { NoDataScreen } from "./NoDataScreen";
import { useGameUnloadHandler } from '../hooks/useGameUnloadHandler';

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
  const [finalScore, setFinalScore] = useState(0);
  const [totalTimeBonus, setTotalTimeBonus] = useState(0);
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

  const gameTime = 10;

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

  // Register unload handler
  useGameUnloadHandler(
    () => {
      if (gameStarted && !gameEnded) {
        endGame();
      }
    },
    gameStarted && !gameEnded
  );

  const startGame = () => {
    if (!gameData) return;
    setGameStarted(true);
    setGameEnded(false);
    setCurrentRound(0);
    setScore(0);
    setFinalScore(0);
    setTimeLeft(gameTime);
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
      const timeBonus = timeLeft / gameTime / gameData.questions.length;
      setTotalTimeBonus((prev) => prev + timeBonus);
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      nextRound();
    }, 2000);
  };

  const nextRound = () => {
    if (!gameData) return;

    if (currentRound + 1 < gameData.questions.length) {
      setCurrentRound(currentRound + 1);
      setTimeLeft(gameTime);
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
          score: normalizeGameScore(
            score,
            gameData.questions.length,
            totalTimeBonus
          ),
        });

        if (result) {
          setScoreSaved(true);
          setHasPlayedToday(true);
          setPreviousScore(score);
          setFinalScore(result.score);
        }
      } catch (err) {
        console.error("Error saving game score:", err);
      }
    }
  };

  if (loading || checkingPlayStatus) {
    return <LoadingScreen />;
  }

  if (!gameData) {
    return <NoDataScreen />;
  }

  if (gameEnded) {
    return (
      <GameResultsScreen
        isFirstAttempt={!hasPlayedToday || scoreSaved}
        currentScore={normalizeGameScore(
          score,
          gameData.questions.length,
          totalTimeBonus
        )}
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
    <ChristmasBackground>
      <div className="min-h-[calc(100vh-130px)]">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold text-yellow-300 mb-2 drop-shadow-lg"
              style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
            >
              {dayInfo
                ? `Dag ${dayInfo.day}: ${dayInfo.title}`
                : gameData.title}
            </h1>
            <div className="flex justify-center gap-8 text-red-100">
              <span>
                Spørsmål {currentRound + 1} / {gameData.questions.length}
              </span>
              <span>Riktige svar: {score}</span>
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
                let buttonStyle =
                  "bg-white/20 hover:bg-white/30 border-white/30";

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
              </div>
            )}
          </div>
        </div>
      </div>
    </ChristmasBackground>
  );
}
