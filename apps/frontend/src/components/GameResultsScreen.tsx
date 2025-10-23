import React from 'react';
import Leaderboard from './Leaderboard';

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
  gameType: string;
  gameName?: string;
  
  // Actions
  onPlayAgain: () => void;
  
  // Optional customization
  scoreLabel?: string;
  scoreSuffix?: string;
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
  gameName,
  onPlayAgain,
  scoreLabel = "poeng",
  scoreSuffix = ""
}) => {
  const displayScore = isFirstAttempt ? currentScore : (previousScore || 0);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1482517967863-00e15c9b44be?q=80&w=2070&auto=format&fit=crop')] opacity-10 bg-cover bg-center" />
      
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 text-white/20 text-2xl animate-pulse" style={{ animationDelay: '0s' }}>❄</div>
        <div className="absolute top-40 right-20 text-white/20 text-3xl animate-pulse" style={{ animationDelay: '1s' }}>❄</div>
        <div className="absolute top-60 left-1/3 text-white/20 text-xl animate-pulse" style={{ animationDelay: '2s' }}>❄</div>
        <div className="absolute top-80 right-1/4 text-white/20 text-2xl animate-pulse" style={{ animationDelay: '1.5s' }}>❄</div>
      </div>

      <div className="max-w-6xl w-full relative z-10">
        {/* Game Title */}
        {dayInfo && (
          <div className="text-center mb-6">
            <p className="text-red-200 text-lg mb-2">
              Dag {dayInfo.day}
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
              {dayInfo.title}
            </h1>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Score Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center shadow-christmas-lg border-2 border-yellow-400/20">
            <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
              {isFirstAttempt ? 'Spillet er over!' : 'Din poengsum'}
            </h2>
            
            {isFirstAttempt ? (
              <>
                <div className="mb-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-christmas-lg border-2 border-red-400/20">
                  <p className="text-red-200 text-sm mb-2">
                    Din poengsum (innsendt)
                  </p>
                  <p className="text-3xl text-white font-bold mb-2">
                    {currentScore}{scoreSuffix}
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
              <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-lg">
                <p className="text-red-200 text-sm mb-2">
                  Din innsendte poengsum:
                </p>
                <p className="text-white text-4xl font-bold">
                  {displayScore}{scoreSuffix}
                </p>
                <p className="text-red-200 text-xs mt-2">
                  Dette er din poengsum på topplisten
                </p>
              </div>
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
              {isFirstAttempt ? 'Spill igjen' : 'Spill igjen (for moro skyld)'}
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
  );
};

export default GameResultsScreen;
