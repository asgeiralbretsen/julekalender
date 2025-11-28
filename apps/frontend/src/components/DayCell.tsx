import { useEffect, useRef, useState } from "react";
import { useGameScore } from "../hooks/useGameScore";
import { animate } from "animejs";

interface DayCellProps {
  day: number;
  isUnlocked: boolean;
  isToday: boolean;
  thumbnail?: string;
  gameType?: string;
  onDayClick?: (day: number) => void;
}

export function DayCell({
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
