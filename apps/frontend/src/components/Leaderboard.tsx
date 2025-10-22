import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useGameScore } from '../hooks/useGameScore';
import type { GameScore } from '../hooks/useGameScore';

interface LeaderboardProps {
  day: number;
  gameType: string;
  title?: string;
  showRank?: boolean;
  maxEntries?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  day,
  gameType,
  title = 'Leaderboard',
  showRank = true,
  maxEntries,
}) => {
  const { user } = useUser();
  const { getLeaderboard, loading, error } = useGameScore();
  const [scores, setScores] = useState<GameScore[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const leaderboardScores = await getLeaderboard(day, gameType);
      const displayScores = maxEntries
        ? leaderboardScores.slice(0, maxEntries)
        : leaderboardScores;
      setScores(displayScores);

      if (user) {
        const userIndex = leaderboardScores.findIndex(
          (score) => score.user.unimicroId === user.id
        );
        if (userIndex !== -1) {
          setCurrentUserRank(userIndex + 1);
        }
      }
    };

    fetchLeaderboard();
  }, [day, gameType, maxEntries, getLeaderboard, user]);

  const getMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  const getDisplayName = (score: GameScore): string => {
    if (score.user.firstName || score.user.lastName) {
      return `${score.user.firstName || ''} ${score.user.lastName || ''}`.trim();
    }
    return score.user.email.split('@')[0];
  };

  const isCurrentUser = (score: GameScore): boolean => {
    return user ? score.user.unimicroId === user.id : false;
  };

  if (loading && scores.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
        <div className="text-center py-8">
          <p className="text-white/60">No scores yet. Be the first to play!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      
      {currentUserRank && (
        <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <p className="text-blue-200 text-sm text-center">
            Your rank: <span className="font-bold">#{currentUserRank}</span>
          </p>
        </div>
      )}

      <div className="space-y-2">
        {scores.map((score, index) => {
          const rank = index + 1;
          const isCurrent = isCurrentUser(score);
          
          return (
            <div
              key={score.id}
              className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                isCurrent
                  ? 'bg-blue-500/30 border border-blue-400/50'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {showRank && (
                  <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                    {rank <= 3 ? (
                      <span className="text-2xl">{getMedalEmoji(rank)}</span>
                    ) : (
                      <span className="text-white/60 font-semibold">
                        #{rank}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium truncate ${
                      isCurrent ? 'text-white' : 'text-white/90'
                    }`}
                  >
                    {getDisplayName(score)}
                    {isCurrent && (
                      <span className="ml-2 text-xs text-blue-300">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-white/50">
                    {new Date(score.playedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`px-4 py-2 rounded-lg font-bold ${
                    isCurrent
                      ? 'bg-blue-500/40 text-white'
                      : 'bg-white/10 text-white/90'
                  }`}
                >
                  {score.score}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {maxEntries && scores.length >= maxEntries && (
        <div className="mt-4 text-center">
          <p className="text-white/50 text-sm">
            Showing top {maxEntries} players
          </p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;

