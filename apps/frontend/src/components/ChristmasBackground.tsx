import React, { useState } from "react";

interface ChristmasBackgroundProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Overrides the background image and color
   */
  backgroundColor?: string;
}

interface Snowflake {
  id: number;
  icon: string;
  size: number;
  delay: number;
  positionX: number;
  positionY: number;
}

export const ChristmasBackground: React.FC<ChristmasBackgroundProps> = ({
  children,
  className = "",
  backgroundColor,
}) => {
  const backgroundEmojiList = ["🎁", "🌟", "🔔", "🎄"];
  // 10% chance of background emoji not being snowflake :P
  const [backgroundIcon, setBackgroundIcon] = useState(
    Math.random() >= 0.1
      ? "❄️"
      : backgroundEmojiList[
          Math.round(Math.random() * backgroundEmojiList.length)
        ]
  );
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      icon: backgroundIcon,
      size: Math.floor(Math.random() * 24) + 12, // Random size
      delay: Math.random() * 5, // Random delay between 0 and 5 seconds
      positionX: Math.floor(Math.random() * window.innerWidth) - 10,
      positionY: Math.floor(Math.random() * window.innerHeight) - 100,
    }))
  );

  const defaultBackgroundColor =
    "bg-gradient-to-b from-red-900 via-red-800 to-red-900";
  const defaultBackgroundImage =
    "bg-[url('https://images.unsplash.com/photo-1482517967863-00e15c9b44be?q=80&w=2070&auto=format&fit=crop')] opacity-10 bg-cover bg-center";

  return (
    <div
      className={`min-h-[calc(100vh-65px)] pt-[65px] ${backgroundColor ? backgroundColor : defaultBackgroundColor} relative overflow-hidden ${className}`}
    >
      {/* Background image overlay */}
      <div
        className={`absolute inset-0 ${backgroundColor ? "" : defaultBackgroundImage}`}
      />
      {/* Floating snowflakes */}
      <div className="absolute inset-0 pointer-events-none">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className={`absolute text-white/20 animate-pulse select-none`}
            style={{
              fontSize: `${flake.size}px`,
              animationDelay: "0s",
              top: `${flake.positionY}px`,
              left: `${flake.positionX}px`,
            }}
          >
            {flake.icon}
          </div>
        ))}
      </div>
      <div className="min-h-[calc(100vh-130px)]">{children}</div>
    </div>
  );
};
