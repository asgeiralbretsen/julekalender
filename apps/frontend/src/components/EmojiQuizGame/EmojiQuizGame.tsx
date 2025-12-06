import { useEffect, useState } from "react";
import { ChristmasBackground } from "../ChristmasBackground";
import { StartGameScreen } from "../StartGameScreen";
import GameResultsScreen from "../GameResultsScreen";
import { useUser } from "@clerk/clerk-react";
import { useGameScore } from "../../hooks/useGameScore";
import { normalizeGameScore } from "../../utils";
import { LoadingScreen } from "../LoadingScreen";
import { NoDataScreen } from "../NoDataScreen";
import { shuffleArray } from "../../utils";
import type {
  EmojiQuizGameData as GameData,
  EmojiGameWord,
} from "../../models/GameDataModels";
import Piece from "./Piece";

type PieceType = "emojis" | "word";

interface GamePiece extends EmojiGameWord {
  id: string;
}

export interface SelectedPieceResult {
  id: string;
  type: PieceType;
  correct: boolean;
}

export function EmojiQuizGame() {
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

  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  /**
   * How much time the player has to play the game
   * Used in calculating time bonus
   */
  const [initialTime, setInitialTime] = useState(30);
  const [score, setScore] = useState(0);

  const [emojiPieces, setEmojiPieces] = useState<GamePiece[]>([]);
  const [wordPieces, setWordPieces] = useState<GamePiece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<GamePiece>(null);
  const [selectedPieceType, setSelectedPieceType] = useState<PieceType>();
  const [selectedPieceResult, setSelectedPieceResult] =
    useState<SelectedPieceResult>(null);
  const [correctAnswers, setCorrectAnswers] = useState<GamePiece[]>([]);
  const [wrongAnswers, setWrongAnswers] = useState(0);

  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [showResultsScreen, setShowResultsScreen] = useState(false);

  useEffect(() => {
    const loadGameData = async () => {
      try {
        const gameDataStr = sessionStorage.getItem("currentGameData");
        const dayInfoStr = sessionStorage.getItem("currentDayInfo");

        if (gameDataStr) {
          const parsedData = JSON.parse(gameDataStr);
          if (parsedData.emojiQuizGameData) {
            setGameData(parsedData.emojiQuizGameData);
            setTimeRemaining(parsedData.emojiQuizGameData.timeLimit || 30);
            setInitialTime(parsedData.emojiQuizGameData.timeLimit || 30);
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
        const hasPlayed = await hasUserPlayedGame(dayInfo.day, "emojiQuizGame");
        if (hasPlayed) {
          const previousScoreData = await getUserScoreForDay(
            dayInfo.day,
            "emojiQuizGame"
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

  /**
   * Creates an array for both Emoji and Word pieces, in random order
   */
  const createGamePieces = () => {
    // create an array first where ids are added to the pieces
    const pieces: GamePiece[] = gameData.words.map((piece, index) => ({
      ...piece,
      // Unique enough for this game...
      id: index + piece.word,
    }));
    setEmojiPieces(shuffleArray(pieces));
    setWordPieces(shuffleArray(pieces));
  };

  const selectPiece = (piece: GamePiece, type: PieceType) => {
    // If the user clicks another piece of the same type
    if (type === selectedPieceType) {
      setSelectedPiece(piece);
      return;
    }

    if (selectedPiece) {
      // Check if the clicked piece corresponds to the already selected piece
      if (piece.id === selectedPiece.id) {
        setSelectedPieceResult({
          id: piece.id,
          type: type,
          correct: true,
        });
        setSelectedPiece(null);
        setTimeout(() => {
          setCorrectAnswers((prev) => [...prev, piece]);

          setEmojiPieces((prev) =>
            prev.filter((emojiPiece) => emojiPiece.id !== piece.id)
          );
          setWordPieces((prev) =>
            prev.filter((wordPiece) => wordPiece.id !== piece.id)
          );
        }, 300);
      } else {
        // Wrong
        setWrongAnswers((prev) => prev + 1);
        setSelectedPieceResult({
          id: piece.id,
          type: type,
          correct: false,
        });
        // Unselect selected piece
        // setSelectedPiece(null);
      }
    } else {
      setSelectedPiece(piece);
      setSelectedPieceType(type);
    }
  };

  const startGame = () => {
    createGamePieces();
    setGameStarted(true);
  };

  /**
   * Game loop
   */
  useEffect(() => {
    if (gameStarted && !gameEnded) {
      if (timeRemaining <= 0) {
        endGame();
        return;
      }

      const timer = setTimeout(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [gameStarted, gameEnded, timeRemaining]);

  /**
   * Ends game if all pieces have been correctly matched
   */
  useEffect(() => {
    if (
      gameStarted &&
      !gameEnded &&
      correctAnswers.length === gameData.words.length
    ) {
      endGame();
    }
  }, [correctAnswers]);

  const endGame = async () => {
    setGameEnded(true);
    setGameStarted(false);

    // Each wrong answer subtracts 0.5 points
    const finalScore = Math.max(0, correctAnswers.length - wrongAnswers / 2);
    // Time bonus is  time left as a percentage of initial time,
    // 20% of initial time is subtracted, so that the first few seconds lost won't impact time bonus
    // With an exponentially larger penalty for each wrong answer, starting off gentle
    const finalTimeBonus = Math.max(
      0,
      (timeRemaining / (initialTime - initialTime * 0.2)) *
        Math.pow(0.97, wrongAnswers)
    );

    const normalizedScore = normalizeGameScore(
      finalScore,
      gameData.words.length,
      finalTimeBonus
    );

    setScore(normalizedScore);

    // Save score
    if (user && dayInfo && !hasPlayedToday) {
      try {
        const result = await saveGameScore({
          day: dayInfo.day,
          gameType: "emojiQuizGame",
          score: normalizedScore,
        });

        if (result && result.score === normalizedScore) {
          setScoreSaved(true);
          setHasPlayedToday(true);
          setPreviousScore(normalizedScore);
        }
      } catch (err) {
        console.error("Error saving game score:", err);
      }
    }
  };

  const resetGame = () => {
    setGameEnded(false);
    setShowResultsScreen(false);
    setScore(0);
    setEmojiPieces([]);
    setWordPieces([]);
    setSelectedPiece(null);
    setSelectedPieceType(null);
    setSelectedPieceResult(null);
    setCorrectAnswers([]);
    setWrongAnswers(0);
    setTimeRemaining(initialTime);
  };

  if (showResultsScreen) {
    return (
      <GameResultsScreen
        isFirstAttempt={false}
        currentScore={score}
        previousScore={previousScore}
        scoreSaved={true}
        loading={false}
        error={null}
        dayInfo={dayInfo}
        gameType="emojiQuizGame"
        gameName="Juleemoji"
        onPlayAgain={() => setShowResultsScreen(false)}
        scoreLabel="poeng"
      />
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!gameData) {
    return <NoDataScreen />;
  }

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
        gameType="emojiQuizGame"
        gameName="Juleemoji"
        onPlayAgain={() => {
          resetGame();
          startGame();
        }}
        scoreLabel="poeng"
      />
    );
  }

  if (!gameStarted) {
    return (
      <StartGameScreen
        title="Match juleord med juleemoji"
        description=""
        howToPlay={[
          "• Brikker med juleemoji og juleord vises",
          "• Trykk på en emoji-brikke og deretter på den matchende juleord-brikken ",
          "• Match så mange du klarer på 30 sekunder",
        ]}
        previousScore={previousScore}
        onClickStartGame={startGame}
      />
    );
  }

  return (
    <ChristmasBackground>
      <div className="relative z-10 flex flex-col gap-14 flex-wrap">
        <div className="text-center">
          <h1
            className="text-3xl font-bold text-yellow-300 mb-2 drop-shadow-lg"
            style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
          >
            {dayInfo
              ? `Dag ${dayInfo.day}: ${dayInfo.title}`
              : gameData.title || "Gjett julesangen!"}
          </h1>
          <div className="flex justify-center gap-8 text-red-100">
            <span
              className={`text-2xl font-bold ${timeRemaining <= 10 ? "text-red-400" : "text-white"}`}
            >
              Tid: {timeRemaining}s
            </span>
            <span className="text-2xl font-bold text-white">
              Rette: {correctAnswers.length}/{gameData.words.length}
            </span>
            <span className="text-2xl font-bold text-white">
              Feil: {wrongAnswers}
            </span>
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          {emojiPieces.map((value) => (
            <Piece
              key={value.id}
              text={value.emojis}
              selected={
                selectedPiece?.id == value.id && selectedPieceType === "emojis"
              }
              wasCorrect={
                selectedPieceResult?.id === value.id &&
                selectedPieceResult?.type === "emojis"
                  ? selectedPieceResult?.correct
                  : null
              }
              onClick={() => selectPiece(value, "emojis")}
            />
          ))}
        </div>
        <div className="flex gap-4 justify-center">
          {wordPieces.map((value) => (
            <Piece
              key={value.id}
              text={value.word}
              selected={
                selectedPiece?.id == value.id && selectedPieceType === "word"
              }
              wasCorrect={
                selectedPieceResult?.id === value.id &&
                selectedPieceResult?.type === "word"
                  ? selectedPieceResult?.correct
                  : null
              }
              onClick={() => selectPiece(value, "word")}
            />
          ))}
        </div>
        <div className="flex gap-4 justify-center">
          {correctAnswers.map((value) => (
            <Piece
              key={value.id}
              text={value.word + " = " + value.emojis + " ✅"}
            />
          ))}
        </div>
      </div>
    </ChristmasBackground>
  );
}
