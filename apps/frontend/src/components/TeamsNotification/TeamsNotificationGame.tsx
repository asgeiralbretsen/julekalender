import { useEffect, useState, useMemo, useCallback } from "react";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "../../lib/sanity";
import { TeamsNotification } from "./TeamsNotification";
import { ChristmasBackground } from "../ChristmasBackground";
import { useUser } from "@clerk/clerk-react";
import { useGameScore } from "../../hooks/useGameScore";
import GameResultsScreen from "../GameResultsScreen";
import { StartGameScreen } from "../StartGameScreen";

const builder = imageUrlBuilder(client);

function urlFromRef(
  imageLike?: { asset?: { _ref?: string } } | null
): string | undefined {
  if (!imageLike?.asset?._ref) return undefined;
  try {
    return builder
      .image(imageLike.asset._ref)
      .auto("format")
      .fit("max")
      .url();
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
  const [activeNotifications, setActiveNotifications] = useState<
    Map<number, NotificationData>
  >(new Map());
  const [nextNotificationId, setNextNotificationId] = useState(0);
  const [spawnInterval, setSpawnInterval] = useState(1250); // Start at x seconds
  const [gameStarted, setGameStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30); // 30 seconds
  const [gameOver, setGameOver] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const minSpawnInterval = 550; // Minimum 0.x seconds between spawns
  const [placedPositions, setPlacedPositions] = useState<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profiles
        const profileDocs: ProfileEntry[] = await client.fetch(
          `*[_type=="profilePicture"]{name,"ref":image.asset._ref}`
        );
        console.log("Fetched profiles:", profileDocs);
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
              console.log("Game data:", parsed.teamsNotificationGameData);
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
          setGameOver(true); // Show results screen immediately if already played
        }
      }
    };
    checkPlayStatus();
  }, [dayInfo, user, hasUserPlayedGame, getUserScoreForDay]);

  // Poisson disc sampling for placement
  const findValidPosition = useCallback((existingPositions: Array<{ x: number; y: number }>, minDistance: number): { x: number; y: number } | null => {
    const notificationWidth = 500;
    const notificationHeight = 310;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const minX = 10;
    const maxX = Math.max(10, screenWidth - notificationWidth - 10);
    const minY = 200;
    const maxY = Math.max(10, screenHeight - notificationHeight - 10);

    const maxAttempts = 30;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidateX = Math.random() * (maxX - minX) + minX;
      const candidateY = Math.random() * (maxY - minY) + minY;

      // Check if candidate is far enough from all existing positions
      const isValid = existingPositions.every(pos => {
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
  }, []);

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

  // Game timer - counts down from 30 seconds
  useEffect(() => {
    if (gameStarted && !gameOver && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setGameOver(true);
            setActiveNotifications(new Map()); // Clear all notifications
            setPlacedPositions([]); // Clear all tracked positions
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStarted, gameOver, timeRemaining]);

  // Save score when game ends
  useEffect(() => {
    if (gameOver && !hasPlayedToday && dayInfo && user) {
      saveGameScore({
        day: dayInfo.day,
        gameType: "teamsNotificationGame",
        score: score,
      })
        .then((result) => {
          if (result) {
            setScoreSaved(true);
            setHasPlayedToday(true);
            setPreviousScore(result.score);
          }
        })
        .catch((error) => {
          console.error("Error saving score:", error);
        });
    }
  }, [gameOver, hasPlayedToday, dayInfo, user, score, saveGameScore]);

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
        setSpawnInterval((prev) => Math.max(prev - 100, minSpawnInterval));
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
    minSpawnInterval,
    gameData,
    profiles,
    generateRandomNotification,
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
    return (
      <ChristmasBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center shadow-christmas-lg border-2 border-yellow-400/20 z-10">
            <p className="text-white text-xl">Laster data...</p>
          </div>
        </div>
      </ChristmasBackground>
    );
  }

  if (profiles.length === 0) {
    return (
      <ChristmasBackground>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center shadow-christmas-lg border-2 border-yellow-400/20 max-w-md">
            <p className="text-white text-xl">
              Ingen profiler funnet i Sanity.
            </p>
          </div>
        </div>
      </ChristmasBackground>
    );
  }

  if (!gameData) {
    return (
      <ChristmasBackground>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center shadow-christmas-lg border-2 border-yellow-400/20 max-w-md">
            <h1 className="text-2xl font-bold mb-4 text-yellow-300 drop-shadow-lg">
              Teams Varsel Spill
            </h1>
            <p className="text-red-300">
              Ingen spilldata funnet. Vennligst åpne dette spillet fra en
              kalenderdag.
            </p>
          </div>
        </div>
      </ChristmasBackground>
    );
  }

  // Show results screen when game is over
  if (gameOver && dayInfo) {
    const handlePlayAgain = () => {
      setGameStarted(false);
      setGameOver(false);
      setScore(0);
      setNextNotificationId(0);
      setSpawnInterval(1000);
      setTimeRemaining(30);
      setActiveNotifications(new Map());
      setPlacedPositions([]);
      setScoreSaved(false);
    };

    return (
      <GameResultsScreen
        isFirstAttempt={!hasPlayedToday || scoreSaved}
        currentScore={score}
        previousScore={previousScore}
        scoreSaved={scoreSaved}
        loading={false}
        error={null}
        dayInfo={dayInfo}
        gameType="teamsNotificationGame"
        gameName="Teams Varsel Spill"
        onPlayAgain={handlePlayAgain}
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
          "• 30 sekunder spilletid",
          "• Varslene dukker opp raskere og raskere!",
        ]}
        previousScore={hasPlayedToday ? previousScore : undefined}
        onClickStartGame={() => setGameStarted(true)}
      />
    );
  }

  return (
    <ChristmasBackground>
      <div draggable={false} className="min-h-screen p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-christmas-lg border-2 border-red-400/20 mb-6 z-10 max-w-md">
          <h1
            className="text-4xl font-bold text-white mb-4 drop-shadow-lg text-center"
            style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
          >
            {gameData.title || dayInfo?.title || "Teams Varsel Spill"}
          </h1>
          {gameData.description && (
            <p className="text-white/90 text-center mb-4">
              {gameData.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 text-center mb-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-christmas-lg border-2 border-red-400/20">
              <p className="text-red-200 text-sm mb-1">Poeng</p>
              <p className="text-white text-4xl font-bold">{score}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-christmas-lg border-2 border-red-400/20">
              <p className="text-red-200 text-sm mb-1">Tid Igjen</p>
              <p
                className={`text-3xl font-bold ${timeRemaining <= 10 ? "text-red-400" : "text-white"}`}
              >
                {timeRemaining}s
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-red-200 text-sm mb-2">Spillet pågår...</p>
            <p className="text-white/80 text-xs">
              Klikk på varslene for å fjerne dem!
            </p>
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
