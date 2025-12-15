import React from "react";
import Leaderboard from "./Leaderboard";
import { ChristmasBackground } from "./ChristmasBackground";
import type { GameType } from "../models/SanityDayModel";

interface GameResultsScreenProps {
  // Game state
  isFirstAttempt: boolean;
  currentScore: number;
  previousScore?: number | null;
  scoreSaved: boolean;
  loading: boolean;
  error?: string | null;

  // Game info
  dayInfo: { day: number; title: string } | null;
  gameType: GameType;
  gameName?: string;

  // Actions
  onPlayAgain: () => void;

  // Optional customization
  scoreLabel?: string;
  scoreSuffix?: string;
  showRightAnswers?: boolean;
}

const GameResultsScreen: React.FC<GameResultsScreenProps> = ({
  isFirstAttempt,
  currentScore,
  previousScore,
  scoreSaved,
  loading,
  error,
  dayInfo,
  gameType,
  onPlayAgain,
  scoreLabel = "poeng",
  scoreSuffix = "",
  showRightAnswers = false,
}) => {
  return (
    <ChristmasBackground>
      <div className="flex justify-center p-4">
        <div className="max-w-6xl w-full relative z-10">
          {/* Game Title */}
          {dayInfo && (
            <div className="text-center mb-6">
              <p className="text-red-200 text-lg mb-2">Dag {dayInfo.day}</p>
              <h1
                className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg"
                style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
              >
                {dayInfo.title}
              </h1>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* Score Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center shadow-christmas-lg border-2 border-yellow-400/20">
              <h2
                className="text-3xl font-bold text-white mb-4 drop-shadow-lg"
                style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
              >
                Spillet er over!
              </h2>

              {isFirstAttempt ? (
                <>
                  <div className="mb-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-christmas-lg border-2 border-red-400/20">
                    <p className="text-red-200 text-sm mb-2">Din poengsum</p>
                    <p className="text-3xl text-white font-bold mb-2">
                      {currentScore}
                      {scoreSuffix}
                    </p>
                    <p className="text-red-200 text-sm">{scoreLabel}</p>
                  </div>

                  {loading && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg">
                      <p className="text-red-200 text-center text-sm">
                        💾 Lagrer poengsum...
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="mb-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-christmas-lg border-2 border-red-400/20">
                    <p className="text-red-200 text-sm mb-2">
                      {showRightAnswers ? "Antall riktige svar" : "Denne rundens poengsum"}
                    </p>
                    <p className="text-3xl text-white font-bold mb-2">
                      {currentScore}
                      {scoreSuffix}
                    </p>
                    <p className="text-red-200 text-sm">{scoreLabel}</p>
                  </div>

                  {previousScore !== null && previousScore !== undefined && (
                    <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-400/50 rounded-lg">
                      <p className="text-yellow-200 text-sm mb-2">
                        Din innsendte poengsum:
                      </p>
                      <p className="text-white text-2xl font-bold">
                        {previousScore}
                        {scoreSuffix}
                      </p>
                      <p className="text-yellow-200 text-xs mt-2">
                        Dette er din poengsum på topplisten
                      </p>
                    </div>
                  )}
                </>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={onPlayAgain}
                className="bg-green-700 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-green-700"
              >
                {isFirstAttempt
                  ? "Spill igjen"
                  : "Spill igjen (for moro skyld)"}
              </button>

              {!isFirstAttempt && (
                <p className="text-red-200 text-sm mt-4">
                  Bare første poengsum teller på topplisten
                </p>
              )}
            </div>

            {/* Leaderboard Section */}
            {dayInfo && (
              <Leaderboard
                day={dayInfo.day}
                gameType={gameType}
                title={`Dag ${dayInfo.day} toppliste`}
                showRank={true}
                maxEntries={10}
                scoreSaved={scoreSaved}
                isFirstAttempt={isFirstAttempt}
              />
            )}
          </div>
        </div>
      </div>
    </ChristmasBackground>
  );
};

export default GameResultsScreen;
