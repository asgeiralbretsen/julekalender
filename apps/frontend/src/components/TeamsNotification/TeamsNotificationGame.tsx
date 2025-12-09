import { useEffect, useState, useMemo, useCallback } from "react";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "../../lib/sanity";
import {
  TeamsNotification,
  MAX_NOTIFICATION_HEIGHT,
  MAX_NOTIFICATION_WIDTH,
} from "./TeamsNotification";
import { ChristmasBackground } from "../ChristmasBackground";
import { useUser } from "@clerk/clerk-react";
import { useGameScore } from "../../hooks/useGameScore";
import GameResultsScreen from "../GameResultsScreen";
import { StartGameScreen } from "../StartGameScreen";
import { normalizeGameScore } from "../../utils";
import { LoadingScreen } from "../LoadingScreen";
import { NoDataScreen } from "../NoDataScreen";

const builder = imageUrlBuilder(client);

function urlFromRef(
  imageLike?: { asset?: { _ref?: string } } | null
): string | undefined {
  if (!imageLike?.asset?._ref) return undefined;
  try {
    return builder.image(imageLike.asset._ref).auto("format").fit("max").url();
  } catch {
    return undefined;
  }
}

interface ProfileEntry {
  name: string;
  ref: string;
}

interface NotificationData {
  sender: string;
  message: string;
  profilePicture: string;
  xPosition: number;
  yPosition: number;
}

interface TeamsNotificationGameData {
  title?: string;
  description?: string;
  firstMessage?: string;
  teamsMessages?: Array<{ message: string }>;
  lastMessage?: string;
  logo?: { asset?: { _ref?: string } };
  contextMenuIcon?: { asset?: { _ref?: string } };
  addEmojiIcon?: { asset?: { _ref?: string } };
  closeMessageIcon?: { asset?: { _ref?: string } };
  sendMessageIcon?: { asset?: { _ref?: string } };
}

const INITIAL_SPAWN_INTERVAL = 1100;
const INITIAL_TIME = 30;
const MIN_SPAWN_INTERVAL = 600;
const SPAWN_INTERVAL_DECREASE = 70;

export function TeamsNotificationGame() {
  const { user } = useUser();
  const { saveGameScore, hasUserPlayedGame, getUserScoreForDay } =
    useGameScore();

  const [profiles, setProfiles] = useState<ProfileEntry[]>([]);
  const [gameData, setGameData] = useState<TeamsNotificationGameData | null>(
    null
  );
  const [dayInfo, setDayInfo] = useState<{ day: number; title: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [normalizedScore, setNormalizedScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(INITIAL_TIME);
  const [gameOver, setGameOver] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [showResultsScreen, setShowResultsScreen] = useState(false);

  const [activeNotifications, setActiveNotifications] = useState<
    Map<number, NotificationData>
  >(new Map());
  const [totalNotificationsSpawned, setTotalNotificationsSpawned] = useState(0);
  const [nextNotificationId, setNextNotificationId] = useState(0);
  const [placedPositions, setPlacedPositions] = useState<
    Array<{ x: number; y: number }>
  >([]);
  const [spawnInterval, setSpawnInterval] = useState(INITIAL_SPAWN_INTERVAL);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profiles
        const profileDocs: ProfileEntry[] = await client.fetch(
          `*[_type=="profilePicture"]{name,"ref":image.asset._ref}`
        );
        const filteredProfiles = profileDocs.filter(
          (d) => !!d?.ref && !!(d?.name || "").trim()
        );
        setProfiles(filteredProfiles);

        // Get game data from sessionStorage
        const raw = sessionStorage.getItem("currentGameData");
        const dayInfoRaw = sessionStorage.getItem("currentDayInfo");

        if (dayInfoRaw) {
          try {
            const parsed = JSON.parse(dayInfoRaw);
            setDayInfo(parsed);
          } catch {
            setDayInfo(null);
          }
        }

        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.teamsNotificationGameData) {
              setGameData(
                parsed.teamsNotificationGameData as TeamsNotificationGameData
              );
            }
          } catch (error) {
            console.error("Error parsing game data:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Check if user has played today
  useEffect(() => {
    const checkPlayStatus = async () => {
      if (dayInfo && user) {
        const hasPlayed = await hasUserPlayedGame(
          dayInfo.day,
          "teamsNotificationGame"
        );
        if (hasPlayed) {
          const userScore = await getUserScoreForDay(
            dayInfo.day,
            "teamsNotificationGame"
          );
          setHasPlayedToday(true);
          setPreviousScore(userScore?.score || null);
          setShowResultsScreen(true);
        }
      }
    };
    checkPlayStatus();
  }, [dayInfo, user, hasUserPlayedGame, getUserScoreForDay]);

  // Poisson disc sampling for placement
  const findValidPosition = useCallback(
    (
      existingPositions: Array<{ x: number; y: number }>,
      minDistance: number
    ): { x: number; y: number } | null => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      const minX = 10;
      const maxX = Math.max(10, screenWidth - MAX_NOTIFICATION_WIDTH - 10);
      const minY = 250;
      const maxY = Math.max(10, screenHeight - MAX_NOTIFICATION_HEIGHT);

      const maxAttempts = 30;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const candidateX = Math.random() * (maxX - minX) + minX;
        const candidateY = Math.random() * (maxY - minY) + minY;

        // Check if candidate is far enough from all existing positions
        const isValid = existingPositions.every((pos) => {
          const dx = candidateX - pos.x;
          const dy = candidateY - pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance >= minDistance;
        });

        if (isValid) {
          return { x: candidateX, y: candidateY };
        }
      }

      // If we couldn't find a valid position after maxAttempts, return any position
      return {
        x: Math.random() * (maxX - minX) + minX,
        y: Math.random() * (maxY - minY) + minY,
      };
    },
    []
  );

  // Function to generate a random notification on-the-fly
  const generateRandomNotification = useCallback((): NotificationData => {
    if (!gameData?.teamsMessages || profiles.length === 0) {
      throw new Error("No data available");
    }

    // Pick random profile
    const profile = profiles[Math.floor(Math.random() * profiles.length)];

    // Pick random message
    const message =
      gameData.teamsMessages[
        Math.floor(Math.random() * gameData.teamsMessages.length)
      ].message;

    // Find valid position using Poisson disc sampling (minimum 200px distance)
    const position = findValidPosition(placedPositions, 200);

    if (!position) {
      throw new Error("Could not find valid position");
    }

    return {
      sender: profile.name,
      message: message,
      profilePicture: profile.ref,
      xPosition: position.x,
      yPosition: position.y,
    };
  }, [gameData?.teamsMessages, profiles, findValidPosition, placedPositions]);

  // Game timer
  useEffect(() => {
    if (gameStarted && !gameOver && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStarted, gameOver, timeRemaining]);

  const endGame = async () => {
    setGameOver(true);
    setGameStarted(false);
    setActiveNotifications(new Map()); // Clear all notifications
    setPlacedPositions([]); // Clear all tracked positions

    const normalizedScore = normalizeGameScore(
      score,
      // Subtract 15% from total notifications as the ones spawned toward the end can be almost
      // Still, disallow the max from being lower than the score
      Math.max(
        score,
        totalNotificationsSpawned - Math.round(totalNotificationsSpawned * 0.15)
      ),
      // Time bonus is the percentage of spawned notifications you managed to dismiss
      score / totalNotificationsSpawned
    );

    setNormalizedScore(normalizedScore);

    // Save score
    if (user && dayInfo && !hasPlayedToday) {
      try {
        const result = await saveGameScore({
          day: dayInfo.day,
          gameType: "teamsNotificationGame",
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

  // Auto-spawn notifications with decreasing interval
  useEffect(() => {
    if (
      !gameStarted ||
      gameOver ||
      !gameData?.teamsMessages ||
      profiles.length === 0
    )
      return;

    const spawnNext = () => {
      try {
        // Generate a new random notification
        const newNotification = generateRandomNotification();
        const notificationId = nextNotificationId;

        // Add to active notifications
        setActiveNotifications((prev) => {
          const newMap = new Map(prev);
          newMap.set(notificationId, newNotification);
          return newMap;
        });

        // Track position for Poisson disc sampling
        setPlacedPositions((prev) => [
          ...prev,
          { x: newNotification.xPosition, y: newNotification.yPosition },
        ]);

        setNextNotificationId((prev) => prev + 1);

        // Decrease spawn interval for next spawn
        setSpawnInterval((prev) =>
          Math.max(prev - SPAWN_INTERVAL_DECREASE, MIN_SPAWN_INTERVAL)
        );

        setTotalNotificationsSpawned((prev) => prev + 1);
      } catch (error) {
        console.error("Error generating notification:", error);
      }
    };

    const timer = setTimeout(spawnNext, spawnInterval);

    return () => clearTimeout(timer);
  }, [
    gameStarted,
    gameOver,
    spawnInterval,
    nextNotificationId,
    gameData,
    profiles,
  ]);

  // Handle notification click - award point and remove notification
  const handleNotificationClick = (notificationId: number) => {
    setScore((prev) => prev + 1);
    setActiveNotifications((prev) => {
      const notification = prev.get(notificationId);

      // Remove position from tracking
      if (notification) {
        setPlacedPositions((positions) =>
          positions.filter(
            (pos) =>
              Math.abs(pos.x - notification.xPosition) > 1 ||
              Math.abs(pos.y - notification.yPosition) > 1
          )
        );
      }

      const newMap = new Map(prev);
      newMap.delete(notificationId);
      return newMap;
    });
  };

  // Get icon URLs
  const logoUrl = useMemo(() => urlFromRef(gameData?.logo ?? null), [gameData]);
  const contextUrl = useMemo(
    () => urlFromRef(gameData?.contextMenuIcon ?? null),
    [gameData]
  );
  const emojiUrl = useMemo(
    () => urlFromRef(gameData?.addEmojiIcon ?? null),
    [gameData]
  );
  const closeUrl = useMemo(
    () => urlFromRef(gameData?.closeMessageIcon ?? null),
    [gameData]
  );
  const sendUrl = useMemo(
    () => urlFromRef(gameData?.sendMessageIcon ?? null),
    [gameData]
  );

  if (loading) {
    return <LoadingScreen />;
  }

  if (!gameData || profiles.length === 0) {
    return <NoDataScreen />;
  }

  const startGame = () => {
    setGameStarted(true);
  };

  const resetGame = () => {
    setGameOver(false);
    setScore(0);
    setNextNotificationId(0);
    setSpawnInterval(INITIAL_SPAWN_INTERVAL);
    setTimeRemaining(INITIAL_TIME);
    setActiveNotifications(new Map());
    setPlacedPositions([]);
    setScoreSaved(false);
    setTotalNotificationsSpawned(0);
  };

  if (showResultsScreen || gameOver) {
    return (
      <GameResultsScreen
        isFirstAttempt={!hasPlayedToday || scoreSaved}
        currentScore={normalizedScore}
        previousScore={previousScore}
        scoreSaved={scoreSaved}
        loading={false}
        error={null}
        dayInfo={dayInfo}
        gameType="teamsNotificationGame"
        gameName="Teams Varsel Spill"
        onPlayAgain={() => {
          resetGame();
          startGame();
        }}
        scoreLabel="poeng"
      />
    );
  }

  // Show start screen if game hasn't started yet
  if (!gameStarted) {
    return (
      <StartGameScreen
        title={gameData.title || dayInfo?.title || "Teams Varsel Spill"}
        description={
          gameData.description ||
          "Klikk på Teams-varslene så raskt som mulig for å fjerne dem!"
        }
        howToPlay={[
          "• Teams-varsler dukker opp på skjermen",
          "• Klikk på varslene for å fjerne dem",
          "• +1 poeng per varsel du lukker",
          `• ${timeRemaining} sekunder spilletid`,
          "• Varslene dukker opp raskere og raskere!",
        ]}
        previousScore={hasPlayedToday ? previousScore : undefined}
        onClickStartGame={() => setGameStarted(true)}
      />
    );
  }

  return (
    <ChristmasBackground>
      <div draggable={false}>
        <div className="text-center">
          <h1
            className="text-3xl font-bold text-yellow-300 mb-2 drop-shadow-lg"
            style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
          >
            {dayInfo
              ? `Dag ${dayInfo.day}: ${dayInfo.title}`
              : gameData.title || "Whack-a-notification"}
          </h1>
          <div className="flex justify-center gap-8 text-red-100">
            <span
              className={`text-2xl font-bold ${timeRemaining <= 10 ? "text-red-400" : "text-white"}`}
            >
              Tid: {timeRemaining}s
            </span>
            <span className="text-2xl font-bold text-white">
              Varslinger lukket: {score}
            </span>
          </div>
        </div>

        {/* Render active notifications */}
        {Array.from(activeNotifications.entries()).map(([id, notification]) => (
          <TeamsNotification
            key={id}
            sender={notification.sender}
            message={notification.message}
            logo={logoUrl || ""}
            profilePicture={notification.profilePicture}
            emojiIcon={emojiUrl || ""}
            closeMessageIcon={closeUrl || ""}
            sendMessageIcon={sendUrl || ""}
            contextMenuIcon={contextUrl || ""}
            xPosition={notification.xPosition}
            yPosition={notification.yPosition}
            displayDuration={0}
            onClick={() => handleNotificationClick(id)}
          />
        ))}
      </div>
    </ChristmasBackground>
  );
}
