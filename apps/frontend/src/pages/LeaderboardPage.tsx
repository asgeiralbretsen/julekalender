import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { GameScoreAPI } from '../lib/api';
import { ChristmasBackground } from '../components/ChristmasBackground';

interface TotalScoreEntry {
  userId: number;
  user: {
    id: number;
    unimicroId: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  totalScore: number;
  gamesPlayed: number;
  lastPlayed: string;
}

export default function LeaderboardPage() {
  const { getToken } = useAuth();
  const [totalScores, setTotalScores] = useState<TotalScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDisplayName = (entry: TotalScoreEntry): string => {
    if (entry.user.firstName || entry.user.lastName) {
      return `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim();
    }
    return entry.user.email.split('@')[0];
  };

  useEffect(() => {
    const fetchTotalLeaderboard = async () => {
      try {
        setLoading(true);
        const scores = await GameScoreAPI.getTotalLeaderboard(getToken);
        setTotalScores(scores);
      } catch (err) {
        console.error('Error fetching total leaderboard:', err);
        setError('Kunne ikke hente topplisten');
      } finally {
        setLoading(false);
      }
    };

    fetchTotalLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <ChristmasBackground>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Henter toppliste...</p>
          </div>
        </div>
      </ChristmasBackground>
    );
  }

  if (error) {
    return (
      <ChristmasBackground>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-300 text-xl mb-4">❌ {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Prøv igjen
            </button>
          </div>
        </div>
      </ChristmasBackground>
    );
  }

  return (
    <ChristmasBackground>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
              Total Toppliste
            </h1>
            <p className="text-red-200 text-lg">
              Samlet poengsum fra alle spill
            </p>
          </div>

          {/* Leaderboard */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-christmas-lg border-2 border-red-400/20">
            {totalScores.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-red-200 text-lg">Ingen spillere har spilt ennå</p>
              </div>
            ) : (
              <div className="space-y-4">
                {totalScores.map((entry, index) => {
                  const rank = index + 1;
                  let rankStyle = '';
                  let rankIcon = '';

                  if (rank === 1) {
                    rankStyle = 'bg-yellow-500/40 text-white border border-yellow-400/50';
                    rankIcon = '🥇';
                  } else if (rank === 2) {
                    rankStyle = 'bg-gray-400/40 text-white border border-gray-400/50';
                    rankIcon = '🥈';
                  } else if (rank === 3) {
                    rankStyle = 'bg-orange-500/40 text-white border border-orange-400/50';
                    rankIcon = '🥉';
                  } else {
                    rankStyle = 'bg-red-500/20 border border-red-400/30';
                    rankIcon = `#${rank}`;
                  }

                  return (
                    <div
                      key={entry.userId}
                      className={`p-4 rounded-lg ${rankStyle} transition-all duration-200 hover:scale-105`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl font-bold">
                            {rankIcon}
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-lg">
                              {getDisplayName(entry)}
                            </h3>
                            <p className="text-red-200 text-sm">
                              {entry.gamesPlayed} spill spilt
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">
                            {entry.totalScore.toLocaleString()}
                          </div>
                          <div className="text-red-200 text-sm">
                            poeng
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stats */}
          {totalScores.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center border border-red-400/20">
                <div className="text-2xl font-bold text-white">
                  {totalScores.length}
                </div>
                <div className="text-red-200 text-sm">
                  Spillere
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center border border-red-400/20">
                <div className="text-2xl font-bold text-white">
                  {totalScores.reduce((sum, entry) => sum + entry.gamesPlayed, 0)}
                </div>
                <div className="text-red-200 text-sm">
                  Totalt spill
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center border border-red-400/20">
                <div className="text-2xl font-bold text-white">
                  {totalScores.reduce((sum, entry) => sum + entry.totalScore, 0).toLocaleString()}
                </div>
                <div className="text-red-200 text-sm">
                  Totale poeng
                </div>
              </div>
            </div>
          )}

          {/* Back button */}
          <div className="text-center mt-8">
            <button
              onClick={() => window.history.back()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              ← Tilbake
            </button>
          </div>
        </div>
      </div>
    </ChristmasBackground>
  );
}
