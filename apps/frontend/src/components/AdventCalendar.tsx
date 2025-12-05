import { useMemo, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { client } from "../lib/sanity";
import imageUrlBuilder from "@sanity/image-url";
import { animate } from "animejs";
import { useGameScore } from "../hooks/useGameScore";
import logoIcon from "../assets/unimicro-logoikon-hvit_RGB.png";
import { ChristmasBackground } from "./ChristmasBackground";
import { DayCell } from "./DayCell";
import type { SanityDay } from "../models/SanityDayModel";

const builder = imageUrlBuilder(client);
const gameMonth = 11;

interface DayData {
  day: number;
  thumbnail?: string;
  title?: string;
  description?: string;
}

export default function AdventCalendar() {
  const navigate = useNavigate();
  const today = new Date();
  const currentDay = 24;
  const containerRef = useRef<HTMLDivElement>(null);
  const { getUserPlayedGames } = useGameScore();

  const [sanityDays, setSanityDays] = useState<SanityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playedGames, setPlayedGames] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
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
          interviewGameData,
          snowflakeCatchGameData,
          wordScrambleGameData,
          emojiQuizGameData,
          isUnlocked
        }`;
        const [daysData, playedGamesData] = await Promise.all([
          client.fetch(query),
          getUserPlayedGames(),
        ]);
        setSanityDays(daysData);
        setPlayedGames(playedGamesData);
      } catch (err) {
        setError("Kunne ikke hente kalenderdager");
        console.error("Error fetching days:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getUserPlayedGames]);

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

    // Check if this day has a game and navigate to it
    if (sanityDay?.gameType && sanityDay.gameType !== "none") {
      console.log("Game type found:", sanityDay.gameType);

      if (
        sanityDay.gameType === "blurGuessGame" &&
        sanityDay.blurGuessGameData
      ) {
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
        navigate("/game/blurGuessGame");
        return;
      } else if (
        sanityDay.gameType === "colorMatchGame" &&
        sanityDay.colorMatchGameData
      ) {
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
      } else if (
        sanityDay.gameType === "interviewGame" &&
        sanityDay.interviewGameData
      ) {
        sessionStorage.setItem(
          "currentGameData",
          JSON.stringify({
            interviewGameData: sanityDay.interviewGameData,
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
        navigate("/game/interviewGame");
        return;
      } else if (sanityDay.gameType === "snowflakeCatchGame") {
        sessionStorage.setItem(
          "currentGameData",
          JSON.stringify({
            snowflakeCatchGameData: sanityDay.snowflakeCatchGameData || {},
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
        navigate("/game/snowflakeCatchGame");
        return;
      } else if (
        sanityDay.gameType === "wordScrambleGame" &&
        sanityDay.wordScrambleGameData
      ) {
        sessionStorage.setItem(
          "currentGameData",
          JSON.stringify({
            wordScrambleGameData: sanityDay.wordScrambleGameData,
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
        navigate("/game/wordScrambleGame");
        return;
      } else if (sanityDay.gameType === "emojiQuizGame") {
        sessionStorage.setItem(
          "currentGameData",
          JSON.stringify({
            emojiQuizGameData: sanityDay.emojiQuizGameData,
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
        navigate("/game/emojiQuizGame");
      } else {
        console.warn("Game type found but no game data available");
        console.log(sanityDay.gameType);
      }
    } else {
      console.log("No game type or game type is none");
    }

    // Fallback to showing alert for days without games
    if (dayInfo) {
      const message = `${dayInfo.title}\n\n${dayInfo.description}`;

      console.warn(message);
    }
  };

  return (
    <ChristmasBackground>
      <div
        ref={containerRef}
        className="max-w-7xl mx-auto px-4 py-10 relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-red-100 drop-shadow flex justify-center items-center space-x-3">
            <img
              src={logoIcon}
              alt="Logo"
              className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-md"
            />
            <span>Julekalender</span>
          </h1>
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
                const isUnlocked =
                  today.getMonth() === gameMonth && day <= currentDay;
                const isToday =
                  day === currentDay && today.getMonth() === gameMonth;
                const dayInfo = dayData.find((d) => d.day === day);
                const sanityDay = sanityDays.find((d) => d.dayNumber === day);
                const gameType = sanityDay?.gameType;
                const hasPlayed =
                  gameType && gameType !== "none"
                    ? playedGames[`${day}-${gameType}`] === true
                    : false;
                return (
                  <DayCell
                    key={day}
                    day={day}
                    isUnlocked={isUnlocked}
                    isToday={isToday}
                    thumbnail={dayInfo?.thumbnail}
                    gameType={gameType}
                    hasPlayed={hasPlayed}
                    onDayClick={handleDayClick}
                  />
                );
              })}
            </div>
          )}

          {sanityDays.length > 0 && (
            <div className="mt-8 text-center text-red-100">
              <p>
                {today.getMonth() === gameMonth
                  ? `I dag er det ${currentDay}. desember. Dag 1-${currentDay} er låst opp! 🎄`
                  : "Kom tilbake i desember for å låse opp kalenderdager! 🎄"}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none select-none fixed inset-x-0 bottom-0 h-24 bg-gradient-to-t from-red-900 to-transparent" />
    </ChristmasBackground>
  );
}
