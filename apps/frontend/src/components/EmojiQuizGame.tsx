import { useEffect, useState } from "react";
import { ChristmasBackground } from "./ChristmasBackground";
import { StartGameScreen } from "./StartGameScreen";
import GameResultsScreen from "./GameResultsScreen";
import { useUser } from "@clerk/clerk-react";
import { useGameScore } from "../hooks/useGameScore";
import { normalizeGameScore } from "../utils";
import { LoadingScreen } from "./LoadingScreen";
import { NoDataScreen } from "./NoDataScreen";
import type { EmojiQuizGameData as GameData } from "../models/GameDataModels";

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

  const [timeRemaining, setTimeRemaining] = useState(30);

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
            setTimeRemaining(parsedData.emojiQuizGameData.timeLimit);
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

  return <></>;
}
