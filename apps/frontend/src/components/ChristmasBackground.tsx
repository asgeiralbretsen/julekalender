import React from "react";

interface ChristmasBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const ChristmasBackground: React.FC<ChristmasBackgroundProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 relative overflow-hidden ${className}`}
    >
      {/* Background image overlay */}
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

      {/* Content */}
      {children}
    </div>
  );
};
