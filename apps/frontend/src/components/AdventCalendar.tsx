import { useMemo, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { client } from "../lib/sanity";
import imageUrlBuilder from "@sanity/image-url";
import { animate } from "animejs";
import { Timer } from "./Timer";
import { useGameScore } from "../hooks/useGameScore";

const builder = imageUrlBuilder(client);

interface DayCellProps {
  day: number;
  isUnlocked: boolean;
  isToday: boolean;
  thumbnail?: string;
  gameType?: string;
  onDayClick?: (day: number) => void;
}

interface DayData {
  day: number;
  thumbnail?: string;
  title?: string;
  description?: string;
}

interface SanityDay {
  _id: string;
  dayNumber: number;
  date: string;
  title: string;
  image?: {
    asset: {
      _ref: string;
    };
    alt?: string;
  };
  gameType?:
    | "none"
    | "blurGuessGame"
    | "colorMatchGame"
    | "quizGame"
    | "teamsNotificationGame"
    | "songGuessGame";
  blurGuessGameData?: {
    images: Array<{
      image: {
        asset: {
          _ref: string;
        };
      };
      answer: string;
    }>;
  };
  colorMatchGameData?: {
    title: string;
    description: string;
    stockingColors: {
      topColor: { hex: string };
      topStripesColor: { hex: string };
      mainColor: { hex: string };
      heelColor: { hex: string };
      stripesColor: { hex: string };
    };
    scoringSettings: {
      perfectMatchBonus: number;
      closeMatchThreshold: number;
      timeBonus: number;
    };
  };
  songGuessGameData?: {
    title: string;
    description: string;
    songFile: {
      asset: {
        _ref: string;
        url?: string;
      };
    };
    answers: string[];
    correctAnswerIndex: number;
    clipDuration: number;
    scoringSettings?: {
      correctAnswerPoints?: number;
      timeBonusPerSecond?: number;
      maxTimeBonus?: number;
    };
  };
  quizGameData?: {
    title: string;
    description: string;
    questions: Array<{
      questionText: string;
      answers: string[];
      correctAnswerIndex: number;
      timeLimit: number;
    }>;
    scoringSettings: {
      correctAnswerPoints: number;
      timeBonus: number;
    };
  };
  teamsNotificationGameData?: {
    title: string;
    description: string;
    firstMessage: string;
    teamsMessages: Array<{
      message: string;
      sender?: string;
      timestamp?: string;
      profilePicture?: {
        _ref: string;
        _type: "reference";
      };
    }>;
    lastMessage: string;
    logo?: {
      asset: {
        _ref: string;
      };
    };
    defaultProfilePicture?: {
      _ref: string;
      _type: "reference";
    };
    contextMenuIcon?: {
      asset: {
        _ref: string;
      };
    };
    addEmojiIcon?: {
      asset: {
        _ref: string;
      };
    };
    closeMessageIcon?: {
      asset: {
        _ref: string;
      };
    };
    sendMessageIcon?: {
      asset: {
        _ref: string;
      };
    };
  };
  isUnlocked: boolean;
}

function DayCell({
  day,
  isUnlocked,
  isToday,
  thumbnail,
  gameType,
  onDayClick,
}: DayCellProps) {
  const cellRef = useRef<HTMLDivElement>(null);
  const doorRef = useRef<HTMLDivElement>(null);
  const { hasUserPlayedGame } = useGameScore();
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Check if user has played this game
  useEffect(() => {
    const checkIfPlayed = async () => {
      if (gameType && gameType !== "none") {
        const played = await hasUserPlayedGame(day, gameType);
        setHasPlayed(played);
        setIsOpen(played);
      }
    };
    checkIfPlayed();
  }, [day, gameType, hasUserPlayedGame]);

  // Initial entrance animation
  useEffect(() => {
    if (cellRef.current) {
      animate(cellRef.current, {
        scale: [0, 1],
        opacity: [0, 1],
        rotate: [180, 0],
        duration: 800,
        delay: day * 80,
        easing: "easeOutElastic(1, .6)",
      });
    }
  }, [day]);

  // Open door animation if already played
  useEffect(() => {
    if (hasPlayed && doorRef.current) {
      animate(doorRef.current, {
        rotateY: -180,
        duration: 0,
      });
    }
  }, [hasPlayed]);

  const handleClick = () => {
    if (isUnlocked && onDayClick && doorRef.current) {
      if (!isOpen) {
        // Door opening animation
        setIsOpen(true);
        animate(doorRef.current, {
          rotateY: [0, -180],
          duration: 800,
          easing: "easeInOutQuad",
          complete: () => {
            setTimeout(() => {
              onDayClick(day);
            }, 800);
          },
        });
      } else {
        // Already open, navigate immediately
        onDayClick(day);
      }
    }
  };

  const handleMouseEnter = () => {
    if (isUnlocked && cellRef.current) {
      animate(cellRef.current, {
        scale: isOpen ? 1.03 : 1.05,
        translateY: isOpen ? -4 : -8,
        duration: 300,
        easing: "easeOutQuad",
      });
    }
  };

  const handleMouseLeave = () => {
    if (isUnlocked && cellRef.current) {
      animate(cellRef.current, {
        scale: 1,
        translateY: 0,
        duration: 300,
        easing: "easeOutQuad",
      });
    }
  };

  return (
    <div
      ref={cellRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative aspect-square ${isUnlocked ? "cursor-pointer" : "cursor-not-allowed"}`}
      style={{ perspective: "1000px" }}
    >
      {/* Container that rotates */}
      <div
        ref={doorRef}
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Door front */}
        <div
          className={`absolute inset-0 rounded-2xl shadow-2xl transition-all duration-300 ${
            isUnlocked
              ? "bg-gradient-to-br from-red-600 via-red-700 to-red-800"
              : "bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600"
          }`}
          style={{
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
          }}
        >
          {/* Ornamental border */}
          <div className="absolute inset-2 rounded-xl border-4 border-yellow-400/30">
            <div className="absolute inset-2 rounded-lg border-2 border-yellow-300/20" />
          </div>

          {/* Snow effect on top */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/40 to-transparent rounded-t-2xl" />

          {/* Snowflake decorations */}
          <div className="absolute top-3 left-3 text-white/30 text-xl">❄</div>
          <div className="absolute top-3 right-3 text-white/30 text-xl">❄</div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/30 text-xl">
            ❄
          </div>

          {/* Day number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`text-5xl font-bold ${
                isUnlocked ? "text-yellow-300" : "text-gray-300"
              } drop-shadow-lg`}
              style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
            >
              {day}
            </div>
          </div>

          {isUnlocked && (
            <>
              {[...Array(5)].map((_, i) => {
                const seed = day * 1000 + i;
                const x = Math.sin(seed * 0.1) * 10000;
                const y = Math.sin(seed * 0.2) * 10000;
                const randomX = 10 + (x - Math.floor(x)) * 80; // 10-90%
                const randomY = 10 + (y - Math.floor(y)) * 80; // 10-90%
                const size =
                  1 +
                  (Math.sin(seed * 0.3) * 10000 -
                    Math.floor(Math.sin(seed * 0.3) * 10000)) *
                    2; // 1-3
                const delay =
                  (Math.sin(seed * 0.4) * 10000 -
                    Math.floor(Math.sin(seed * 0.4) * 10000)) *
                  2; // 0-2s
                const colors = [
                  "bg-yellow-300",
                  "bg-yellow-400",
                  "bg-white",
                  "bg-amber-300",
                ];
                const colorIndex = Math.floor(
                  (Math.sin(seed * 0.5) * 10000 -
                    Math.floor(Math.sin(seed * 0.5) * 10000)) *
                    colors.length
                );

                return (
                  <div
                    key={i}
                    className={`absolute ${colors[colorIndex]} rounded-full animate-ping`}
                    style={{
                      left: `${randomX}%`,
                      top: `${randomY}%`,
                      width: `${size * 2}px`,
                      height: `${size * 2}px`,
                      animationDelay: `${delay}s`,
                      animationDuration: `${1 + delay}s`,
                    }}
                  />
                );
              })}
            </>
          )}
        </div>

        {/* Door back (revealed content) */}
        <div
          className="absolute inset-0 rounded-2xl shadow-2xl bg-gradient-to-br from-green-600 via-green-700 to-green-800"
          style={{
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center p-4">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={`Day ${day}`}
                className="w-full h-full object-cover rounded-xl shadow-lg"
              />
            ) : (
              <span className="text-6xl drop-shadow-xl">🎁</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdventCalendar() {
  const navigate = useNavigate();
  const today = new Date();
  const currentDay = today.getMonth() === 9 ? today.getDate() -10 : 1; // December only; otherwise start at 1
  const containerRef = useRef<HTMLDivElement>(null);

  const [sanityDays, setSanityDays] = useState<SanityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch days from Sanity
  useEffect(() => {
    const fetchDays = async () => {
      try {
        const query = `*[_type == "day"] | order(dayNumber asc) {
          _id,
          dayNumber,
          date,
          title,
          image,
          gameType,
          blurGuessGameData,
          colorMatchGameData,
          songGuessGameData,
          quizGameData,
          teamsNotificationGameData,
          isUnlocked
        }`;
        const data = await client.fetch(query);
        setSanityDays(data);
      } catch (err) {
        setError("Kunne ikke hente kalenderdager");
        console.error("Error fetching days:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDays();
  }, []);

  const dayData: DayData[] = useMemo(() => {
    return sanityDays.map((sanityDay) => ({
      day: sanityDay.dayNumber,
      thumbnail: sanityDay.image?.asset
        ? builder.image(sanityDay.image).width(400).height(400).url()
        : undefined,
      title: sanityDay.title,
      description: `Dag ${sanityDay.dayNumber} i julekalenderen!`,
    }));
  }, [sanityDays]);

  const days = useMemo(() => {
    const dayNumbers = sanityDays.map((day) => day.dayNumber);
    const uniqueDays = [...new Set(dayNumbers)].sort((a, b) => a - b);

    const shuffled = [...uniqueDays];
    const seed = 54321; // Fixed seed for consistent shuffle

    for (let i = shuffled.length - 1; i > 0; i--) {
      const x = Math.sin(seed * (i + 1)) * 10000;
      const random = x - Math.floor(x);
      const j = Math.floor(random * (i + 1));

      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }, [sanityDays]);

  useEffect(() => {
    if (containerRef.current) {
      animate(containerRef.current, {
        opacity: [0, 1],
        translateY: [50, 0],
        duration: 1000,
        easing: "easeOutExpo",
      });
    }
  }, []);

  const handleDayClick = (day: number) => {
    const dayInfo = dayData.find((d) => d.day === day);
    const sanityDay = sanityDays.find((d) => d.dayNumber === day);

    // Debug logging
    console.log("Day clicked:", day);
    console.log("Sanity day data:", sanityDay);
    console.log("Game type:", sanityDay?.gameType);
    console.log("Game data:", sanityDay?.blurGuessGameData);

    // Check if this day has a game and navigate to it
    if (sanityDay?.gameType && sanityDay.gameType !== "none") {
      console.log("Game type found:", sanityDay.gameType);

      // Handle Blur Guess Game
      if (
        sanityDay.gameType === "blurGuessGame" &&
        sanityDay.blurGuessGameData
      ) {
        console.log(
          "Navigating to BlurGuessGame with data:",
          sanityDay.blurGuessGameData
        );

        sessionStorage.setItem(
          "currentGameData",
          JSON.stringify({
            blurGuessGame: sanityDay.blurGuessGameData,
          })
        );
        sessionStorage.setItem("currentGameType", sanityDay.gameType);
        sessionStorage.setItem(
          "currentDayInfo",
          JSON.stringify({
            day: sanityDay.dayNumber,
            title: sanityDay.title,
          })
        );

        // Navigate to the appropriate game route
        navigate("/game/blurGuessGame");
        return;
      } else if (
        sanityDay.gameType === "colorMatchGame" &&
        sanityDay.colorMatchGameData
      ) {
        console.log(
          "Navigating to StockingColorMatchGame with data:",
          sanityDay.colorMatchGameData
        );
        sessionStorage.setItem(
          "currentGameData",
          JSON.stringify({
            colorMatchGameData: sanityDay.colorMatchGameData,
          })
        );
        sessionStorage.setItem("currentGameType", sanityDay.gameType);
        sessionStorage.setItem(
          "currentDayInfo",
          JSON.stringify({
            day: sanityDay.dayNumber,
            title: sanityDay.title,
          })
        );
        navigate("/game/colorMatchGame");
        return;
      } else if (
        sanityDay.gameType === "songGuessGame" &&
        sanityDay.songGuessGameData
      ) {
        console.log(
          "Navigating to SongGuessGame with data:",
          sanityDay.songGuessGameData
        );
        sessionStorage.setItem(
          "currentGameData",
          JSON.stringify({
            songGuessGameData: sanityDay.songGuessGameData,
          })
        );
        sessionStorage.setItem("currentGameType", sanityDay.gameType);
        sessionStorage.setItem(
          "currentDayInfo",
          JSON.stringify({
            day: sanityDay.dayNumber,
            title: sanityDay.title,
          })
        );
        navigate("/game/songGuessGame");
        return;
      } else if (sanityDay.gameType === "quizGame" && sanityDay.quizGameData) {
        console.log(
          "Navigating to QuizGame with data:",
          sanityDay.quizGameData
        );
        sessionStorage.setItem(
          "currentGameData",
          JSON.stringify({
            quizGameData: sanityDay.quizGameData,
          })
        );
        sessionStorage.setItem("currentGameType", sanityDay.gameType);
        sessionStorage.setItem(
          "currentDayInfo",
          JSON.stringify({
            day: sanityDay.dayNumber,
            title: sanityDay.title,
          })
        );
        navigate("/game/quizGame");
        return;
      } else if (
        sanityDay.gameType === "teamsNotificationGame" &&
        sanityDay.teamsNotificationGameData
      ) {
        console.log(
          "Navigating to TeamsNotificationGame with data:",
          sanityDay.teamsNotificationGameData
        );
        sessionStorage.setItem(
          "currentGameData",
          JSON.stringify({
            teamsNotificationGameData: sanityDay.teamsNotificationGameData,
          })
        );
        sessionStorage.setItem("currentGameType", sanityDay.gameType);
        sessionStorage.setItem(
          "currentDayInfo",
          JSON.stringify({
            day: sanityDay.dayNumber,
            title: sanityDay.title,
          })
        );
        navigate("/game/teamsNotificationGame");
        return;
      }
    } else {
      console.log("No game type or game type is none");
    }

    // Fallback to showing alert for days without games
    if (dayInfo) {
      const message = `${dayInfo.title}\n\n${dayInfo.description}`;

      console.log(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 relative overflow-hidden">
      {/* Animated snow background */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1482517967863-00e15c9b44be?q=80&w=2070&auto=format&fit=crop')] opacity-10 bg-cover bg-center" />

      {/* Floating snowflakes */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-20 left-10 text-white/20 text-2xl animate-pulse"
          style={{ animationDelay: "0s" }}
        >
          ❄
        </div>
        <div
          className="absolute top-40 right-20 text-white/20 text-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        >
          ❄
        </div>
        <div
          className="absolute top-60 left-1/3 text-white/20 text-xl animate-pulse"
          style={{ animationDelay: "2s" }}
        >
          ❄
        </div>
        <div
          className="absolute top-80 right-1/4 text-white/20 text-2xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        >
          ❄
        </div>
      </div>

      <div
        ref={containerRef}
        className="max-w-7xl mx-auto px-4 py-10 relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow">
            🎄 Julekalender
          </h1>
          <Timer
            mode="up"
            durationMs={10000}
            startFromMs={1000}
            running={true}
            isFinished={false}
            onFinished={() => {
              console.log("finished");
            }}
            className="text-red-100"
          />
          <p className="mt-3 text-red-100">
            Tell ned til jul med daglige overraskelser
          </p>
          {loading && (
            <div className="mt-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span className="ml-2 text-red-100">Laster kalenderdager...</span>
            </div>
          )}
          {error && (
            <div className="mt-4 text-red-200 bg-red-800/20 rounded-lg p-3 max-w-md mx-auto">
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-1">
                Vennligst sjekk Sanity-konfigurasjonen din
              </p>
            </div>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl border-2 border-white/20">
          {!loading && !error && sanityDays.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Ingen kalenderdager funnet
              </h3>
              <p className="text-red-100 mb-4">
                Opprett din første kalenderdag i Sanity Studio for å komme i
                gang!
              </p>
              <a
                href="/studio/"
                className="inline-block bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Åpne Sanity Studio
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
              {days.map((day) => {
                const isUnlocked = today.getMonth() === 9 && day <= currentDay;
                const isToday = day === currentDay && today.getMonth() === 9;
                const dayInfo = dayData.find((d) => d.day === day);
                const sanityDay = sanityDays.find((d) => d.dayNumber === day);
                return (
                  <DayCell
                    key={day}
                    day={day}
                    isUnlocked={isUnlocked}
                    isToday={isToday}
                    thumbnail={dayInfo?.thumbnail}
                    gameType={sanityDay?.gameType}
                    onDayClick={handleDayClick}
                  />
                );
              })}
            </div>
          )}

          {sanityDays.length > 0 && (
            <div className="mt-8 text-center text-red-100">
              <p>
                {today.getMonth() === 11
                  ? `I dag er det ${currentDay}. desember. Dag 1-${currentDay} er låst opp! 🎄`
                  : "Kom tilbake i desember for å låse opp kalenderdager! 🎄"}
              </p>
              <p className="text-sm mt-2 text-red-200">
                Viser {sanityDays.length} kalenderdag
                {sanityDays.length !== 1 ? "er" : ""} fra Sanity
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none select-none fixed inset-x-0 bottom-0 h-24 bg-gradient-to-t from-red-900 to-transparent" />
    </div>
  );
}
