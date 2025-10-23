import { useEffect, useState, useMemo } from "react";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "../../lib/sanity";
import { TeamsNotification } from "./TeamsNotification";
import { ChristmasBackground } from "../ChristmasBackground";

const builder = imageUrlBuilder(client);

function urlFromRef(
  imageLike?: { asset?: { _ref?: string } } | null
): string | undefined {
  if (!imageLike?.asset?._ref) return undefined;
  try {
    return builder
      .image({ _type: "image", asset: { _ref: imageLike.asset._ref } as any })
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
  const [profiles, setProfiles] = useState<ProfileEntry[]>([]);
  const [gameData, setGameData] = useState<TeamsNotificationGameData | null>(
    null
  );
  const [dayTitle, setDayTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [activeNotifications, setActiveNotifications] = useState<
    Map<number, NotificationData>
  >(new Map());
  const [nextNotificationId, setNextNotificationId] = useState(0);
  const [spawnInterval, setSpawnInterval] = useState(1000); // Start at 2 seconds
  const [gameStarted, setGameStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30); // 30 seconds
  const [gameOver, setGameOver] = useState(false);
  const minSpawnInterval = 500; // Minimum 0.5 seconds between spawns

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
            setDayTitle(parsed?.title || "");
          } catch {
            setDayTitle("");
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

  // Function to generate a random notification on-the-fly
  const generateRandomNotification = (): NotificationData => {
    if (!gameData?.teamsMessages || profiles.length === 0) {
      throw new Error("No data available");
    }

    const notificationWidth = 500;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Calculate safe boundaries - full screen with small margins
    const minX = 10;
    const maxX = Math.max(10, screenWidth - notificationWidth - 10);
    const minY = 200;
    const maxY = Math.max(10, screenHeight - 310);

    // Pick random profile
    const profile = profiles[Math.floor(Math.random() * profiles.length)];

    // Pick random message
    const message =
      gameData.teamsMessages[
        Math.floor(Math.random() * gameData.teamsMessages.length)
      ].message;

    return {
      sender: profile.name,
      message: message,
      profilePicture: profile.ref,
      xPosition: Math.random() * (maxX - minX) + minX,
      yPosition: Math.random() * (maxY - minY) + minY,
    };
  };

  // Game timer - counts down from 30 seconds
  useEffect(() => {
    if (gameStarted && !gameOver && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setGameOver(true);
            setActiveNotifications(new Map()); // Clear all notifications
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStarted, gameOver, timeRemaining]);

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
  ]);

  // Handle notification click - award point and remove notification
  const handleNotificationClick = (notificationId: number) => {
    setScore((prev) => prev + 1);
    setActiveNotifications((prev) => {
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

  return (
    <ChristmasBackground>
      <div className="min-h-screen p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-christmas-lg border-2 border-yellow-400/20 mb-6 z-10 max-w-md">
          <h1
            className="text-4xl font-bold text-yellow-300 mb-4 drop-shadow-lg text-center"
            style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
          >
            {gameData.title || dayTitle || "Teams Varsel Spill"}
          </h1>
          {gameData.description && (
            <p className="text-white/90 text-center mb-4">
              {gameData.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 text-center mb-4">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-yellow-300 font-bold">Poeng</p>
              <p className="text-white text-4xl font-bold">{score}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-yellow-300 font-bold">Tid Igjen</p>
              <p
                className={`text-3xl font-bold ${timeRemaining <= 10 ? "text-red-400" : "text-white"}`}
              >
                {timeRemaining}s
              </p>
            </div>
          </div>

          {!gameStarted && !gameOver && (
            <button
              onClick={() => setGameStarted(true)}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white text-xl font-bold rounded-lg transition-colors"
            >
              Start Spillet
            </button>
          )}

          {gameOver && (
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-yellow-300 mb-2">
                🎮 Spillet er over!
              </p>
              <p className="text-2xl text-white">
                Din endelige poengsum:{" "}
                <span className="font-bold text-green-400">{score}</span>
              </p>
            </div>
          )}

          {(gameStarted || gameOver) && (
            <button
              onClick={() => {
                setGameStarted(false);
                setGameOver(false);
                setScore(0);
                setNextNotificationId(0);
                setSpawnInterval(2000);
                setTimeRemaining(30);
                setActiveNotifications(new Map());
              }}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white text-xl font-bold rounded-lg transition-colors"
            >
              {gameOver ? "Spill Igjen" : "Nullstill Spillet"}
            </button>
          )}
        </div>

        {gameStarted && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-yellow-300 mb-4 drop-shadow-lg">
              {/* Klikk på varslene for å fjerne dem! */}
            </h2>
          </div>
        )}

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
            animate={true}
            duration={150}
            displayDuration={0}
            onClick={() => handleNotificationClick(id)}
          />
        ))}
      </div>
    </ChristmasBackground>
  );
}
