import { useEffect, useMemo, useState } from "react";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "../../lib/sanity";
import { TeamsNotification } from "./TeamsNotification";

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

type ProfileEntry = {
  name: string;
  ref: string;
  side: "left" | "right";
  yPosition: number;
};

export function TeamsNotificationGame() {
  const [data, setData] = useState<TeamsNotificationGameData | null>(null);
  const [dayTitle, setDayTitle] = useState<string>("");
  const [profileCatalog, setProfileCatalog] = useState<ProfileEntry[]>([]);
  const [assignedProfiles, setAssignedProfiles] = useState<ProfileEntry[]>([]);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [showNotifications, setShowNotifications] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);
  const [baseDisplayDuration] = useState(10000); // Start with 10 seconds
  const [minDisplayDuration] = useState(1000); // Minimum 1 second
  const [gameStarted, setGameStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds
  const [gameOver, setGameOver] = useState(false);
  const [spawnInterval, setSpawnInterval] = useState(3000); // Start with 3 seconds between spawns
  const [minSpawnInterval] = useState(500); // Minimum 0.5 seconds between spawns

  useEffect(() => {
    const raw = sessionStorage.getItem("currentGameData");
    const dayInfoRaw = sessionStorage.getItem("currentDayInfo");
    try {
      if (dayInfoRaw) {
        const parsed = JSON.parse(dayInfoRaw);
        setDayTitle(parsed?.title || "");
      }
    } catch {
      setDayTitle("");
    }
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.teamsNotificationGameData) {
        setData(parsed.teamsNotificationGameData as TeamsNotificationGameData);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Load global profile pictures (independent library)
  useEffect(() => {
    const fetchProfilePictures = async () => {
      try {
        const docs: ProfileEntry[] = await client.fetch(
          `*[_type=="profilePicture"]{name,"ref":image.asset._ref}`
        );
        console.log("Fetched profile pictures:", docs);
        const filtered = docs.filter(
          (d) => !!d?.ref && !!(d?.name || "").trim()
        );
        console.log("Filtered profile pictures:", filtered);
        setProfileCatalog(filtered as ProfileEntry[]);
      } catch (error) {
        console.error("Error fetching profile pictures:", error);
        setProfileCatalog([]);
      }
    };
    fetchProfilePictures();
  }, []);

  // Create a stable random assignment of profiles for the visible messages
  useEffect(() => {
    if (!data) {
      console.log("No data yet, waiting...");
      return;
    }
    const total =
      (data.firstMessage ? 1 : 0) + (data.teamsMessages?.length || 0);
    console.log("Total messages needed:", total);
    if (total === 0) return;

    // If no catalog, wait for it to load
    if (!profileCatalog || profileCatalog.length === 0) {
      console.log("No profile catalog yet, waiting...");
      return;
    }

    // If we already have profiles assigned and catalog hasn't changed, keep them stable
    if (assignedProfiles.length === total) {
      console.log("Already have correct number of profiles assigned");
      return;
    }

    // Generate random assignments with smart Y positioning
    const randoms: ProfileEntry[] = [];
    const notificationHeight = 300; // Each notification is ~300px tall
    const spacing = 20; // Gap between notifications
    const startY = 40; // Start from top of screen

    // First entry is hardcoded
    // Get image and name from the profile catalog
    const hardcodedFirst = profileCatalog[3];
    const hardcodedFirstEntry: ProfileEntry = {
      name: hardcodedFirst.name,
      ref: hardcodedFirst.ref,
      side: hardcodedFirst.side,
      yPosition: screen.height - 400,
    };
    randoms.push(hardcodedFirstEntry);

    // Generate random profiles for the rest
    for (let i = 1; i < total; i++) {
      const pick =
        profileCatalog[Math.floor(Math.random() * profileCatalog.length)];

      // Calculate Y position to avoid overlap
      // Stack them vertically with spacing
      //   make the y position a random position on the height of the screen
      const yPosition = Math.random() * (screen.height - 200);
      //   const yPosition = startY + i * (notificationHeight + spacing);

      randoms.push({
        ...pick,
        side: Math.random() < 0.5 ? "left" : "right",
        yPosition: yPosition,
      });
    }
    console.log("Assigned profiles:", randoms);
    setAssignedProfiles(randoms);
    // Initialize showNotifications array - start with enough slots
    setShowNotifications(new Array(100).fill(false)); // Pre-allocate 100 slots for endless mode
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, profileCatalog.length]);

  // Game timer - starts after first click
  useEffect(() => {
    if (gameStarted && !gameOver && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStarted, gameOver, timeRemaining]);

  // Auto-spawn notifications with increasing frequency
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnTimer = setInterval(() => {
      showNextNotification();

      // Gradually decrease spawn interval (increase spawn rate)
      setSpawnInterval((prev) => {
        const newInterval = prev - 100; // Decrease by 100ms each spawn
        return Math.max(newInterval, minSpawnInterval);
      });
    }, spawnInterval);

    return () => clearInterval(spawnTimer);
  }, [gameStarted, gameOver, spawnInterval, minSpawnInterval]);

  const logoUrl = useMemo(() => urlFromRef(data?.logo ?? null), [data]);
  const contextUrl = useMemo(
    () => urlFromRef(data?.contextMenuIcon ?? null),
    [data]
  );
  const emojiUrl = useMemo(
    () => urlFromRef(data?.addEmojiIcon ?? null),
    [data]
  );
  const closeUrl = useMemo(
    () => urlFromRef(data?.closeMessageIcon ?? null),
    [data]
  );
  const sendUrl = useMemo(
    () => urlFromRef(data?.sendMessageIcon ?? null),
    [data]
  );

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Teams Notification Game</h1>
        <p className="text-sm text-gray-500">
          No game data found. Open a day with Teams Notification Game.
        </p>
      </div>
    );
  }

  const firstProfile = assignedProfiles[0] || {
    name: "Unknown",
    ref: "",
    side: "right" as const,
    yPosition: 40,
  };

  // Get next profile (cycles through catalog for endless mode)
  const getNextProfile = (index: number): ProfileEntry => {
    if (!profileCatalog || profileCatalog.length === 0) {
      return {
        name: "Unknown",
        ref: "",
        side: "right" as const,
        yPosition: 100,
      };
    }

    // Cycle through catalog
    const catalogIndex = index % profileCatalog.length;
    const profile = profileCatalog[catalogIndex];
    return {
      ...profile,
      side: Math.random() < 0.5 ? "left" : "right",
      yPosition: Math.random() * (window.innerHeight - 400) + 100,
    };
  };

  // Function to show next notification (endless mode)
  const showNextNotification = () => {
    if (gameOver) return;

    // Start game on first notification spawn
    if (!gameStarted && currentNotificationIndex === 0) {
      setGameStarted(true);
    }

    // Ensure we have enough slots in showNotifications
    if (currentNotificationIndex >= showNotifications.length) {
      setShowNotifications((prev) => [...prev, ...new Array(20).fill(false)]);
    }

    // Ensure we have the profile assigned
    if (currentNotificationIndex >= assignedProfiles.length) {
      const newProfile = getNextProfile(currentNotificationIndex);
      setAssignedProfiles((prev) => [...prev, newProfile]);
    }

    setShowNotifications((prev) => {
      const newState = [...prev];
      newState[currentNotificationIndex] = true;
      return newState;
    });
    setCurrentNotificationIndex((prev) => prev + 1);
  };

  // Function to show all notifications
  const showAllNotifications = () => {
    setShowNotifications(new Array(assignedProfiles.length).fill(true));
    setCurrentNotificationIndex(assignedProfiles.length);
  };

  // Function to reset notifications
  const resetNotifications = () => {
    setShowNotifications(new Array(100).fill(false));
    setCurrentNotificationIndex(0);
    setScore(0);
    setGameStarted(false);
    setTimeRemaining(60);
    setGameOver(false);
    setSpawnInterval(3000); // Reset spawn interval to initial value
  };

  // Calculate display duration for a given index (decreases over time, min 1000ms)
  const getDisplayDuration = (index: number): number => {
    const decreasePerNotification = 500; // Decrease by 500ms each time
    const duration = baseDisplayDuration - index * decreasePerNotification;
    return Math.max(duration, minDisplayDuration);
  };

  // Handle notification click - award point and hide notification
  const handleNotificationClick = (index: number) => {
    // Don't allow clicks if game is over
    if (gameOver) return;

    // Award point
    setScore((prev) => prev + 1);

    // Hide current notification
    setShowNotifications((prev) => {
      const newState = [...prev];
      newState[index] = false;
      return newState;
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 overflow-x-hidden">
      <div className="flex items-center gap-3 mb-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Teams Logo"
            className="h-8 w-8 object-contain"
          />
        ) : (
          <span className="text-2xl" role="img" aria-label="logo">
            💬
          </span>
        )}
        <div>
          <h1 className="text-xl font-bold">
            {data.title || dayTitle || "Teams Notification"}
          </h1>
          {data.description ? (
            <p className="text-sm text-gray-600">{data.description}</p>
          ) : null}
        </div>
      </div>

      {/* Score, Timer, and Control buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6">
          <div className="text-2xl font-bold text-blue-600">Score: {score}</div>
          <div
            className={`text-2xl font-bold ${
              timeRemaining <= 10 ? "text-red-600" : "text-green-600"
            }`}
          >
            {gameStarted
              ? `⏱️ ${timeRemaining}s`
              : "⏱️ 60s (Click 'Show Next' to start!)"}
          </div>
          {gameStarted && (
            <div
              className={`text-lg font-semibold ${spawnInterval <= 1000 ? "text-orange-600" : "text-purple-600"}`}
            >
              ⚡ Spawn: {(spawnInterval / 1000).toFixed(1)}s
            </div>
          )}
          {gameOver && (
            <div className="text-2xl font-bold text-red-600 animate-pulse">
              🎮 GAME OVER! Final Score: {score}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={showNextNotification}
            disabled={gameOver}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Show Next (#{currentNotificationIndex + 1})
          </button>
          <button
            onClick={resetNotifications}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Toolbar icons */}
      <div className="flex items-center gap-3 mb-4">
        {contextUrl && (
          <img
            src={contextUrl}
            alt="Context menu"
            className="h-5 w-5 object-contain"
          />
        )}
        {emojiUrl && (
          <img
            src={emojiUrl}
            alt="Add emoji"
            className="h-5 w-5 object-contain"
          />
        )}
        {closeUrl && (
          <img
            src={closeUrl}
            alt="Close message"
            className="h-5 w-5 object-contain"
          />
        )}
        {sendUrl && (
          <img
            src={sendUrl}
            alt="Send message"
            className="h-5 w-5 object-contain"
          />
        )}
      </div>

      {/* First message */}
      {data.firstMessage && showNotifications[0] && !gameOver ? (
        <TeamsNotification
          sender={firstProfile.name}
          message={data.firstMessage}
          logo={logoUrl || ""}
          profilePicture={firstProfile.ref || ""}
          emojiIcon={emojiUrl || ""}
          closeMessageIcon={closeUrl || ""}
          sendMessageIcon={sendUrl || ""}
          contextMenuIcon={contextUrl || ""}
          animate={true}
          side={firstProfile.side}
          yPosition={firstProfile.yPosition}
          displayDuration={getDisplayDuration(0)}
          onClick={() => handleNotificationClick(0)}
          onDismiss={() => {
            setShowNotifications((prev) => {
              const newState = [...prev];
              newState[0] = false;
              return newState;
            });
          }}
        />
      ) : null}

      {/* Dynamic notifications - cycles through messages infinitely */}
      {assignedProfiles.length > 0 &&
      data.teamsMessages &&
      data.teamsMessages.length > 0 ? (
        <div className="mt-3 space-y-3">
          {assignedProfiles.slice(data.firstMessage ? 1 : 0).map((ap, idx) => {
            const profileIndex = idx + (data.firstMessage ? 1 : 0);

            // Cycle through messages infinitely
            const messageIndex = idx % data.teamsMessages!.length;
            const message = data.teamsMessages![messageIndex]?.message || "";

            // Only render if this notification should be shown and game is not over
            if (!showNotifications[profileIndex] || gameOver) {
              return null;
            }

            return (
              <TeamsNotification
                key={`notification-${profileIndex}`}
                sender={ap.name}
                message={message}
                logo={logoUrl || ""}
                profilePicture={ap.ref || ""}
                emojiIcon={emojiUrl || ""}
                closeMessageIcon={closeUrl || ""}
                sendMessageIcon={sendUrl || ""}
                contextMenuIcon={contextUrl || ""}
                animate={true}
                side={ap.side}
                yPosition={ap.yPosition}
                displayDuration={getDisplayDuration(profileIndex)}
                onClick={() => handleNotificationClick(profileIndex)}
                onDismiss={() => {
                  setShowNotifications((prev) => {
                    const newState = [...prev];
                    newState[profileIndex] = false;
                    return newState;
                  });
                }}
              />
            );
          })}
        </div>
      ) : null}

      {/* Last message */}
      {/* {data.lastMessage ? (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm mt-3">
          <p className="text-gray-900">{data.lastMessage}</p>
        </div>
      ) : null} */}
    </div>
  );
}
