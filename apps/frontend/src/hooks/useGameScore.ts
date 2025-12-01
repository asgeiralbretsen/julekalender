import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { GameScoreAPI } from '../lib/api';

export interface GameScore {
  id: number;
  userId: number;
  day: number;
  gameType: string;
  score: number;
  playedAt: string;
  user: {
    id: number;
    unimicroId: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface SaveGameScoreRequest {
  day: number;
  gameType: string;
  score: number;
}

interface CurrentUser {
  id: number;
  unimicroId: string;
  email: string;
}

export const useGameScore = () => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [playedGamesCache, setPlayedGamesCache] = useState<Record<string, boolean> | null>(null);
  const playedGamesPromiseRef = useRef<Promise<Record<string, boolean>> | null>(null);

  const getCurrentUser = useCallback(async (): Promise<CurrentUser | null> => {
    if (currentUser) return currentUser;
    
    setLoading(true);
    setError(null);
    
    try {
      const user = await GameScoreAPI.getCurrentUser(getToken);
      if (user) {
        setCurrentUser(user);
        return user;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get current user';
      setError(errorMessage);
      console.error('Error getting current user:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getToken, currentUser]);

  const saveGameScore = useCallback(async (request: SaveGameScoreRequest): Promise<GameScore | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await GameScoreAPI.saveGameScore(request, getToken);
      setPlayedGamesCache(null);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save game score';
      setError(errorMessage);
      console.error('Error saving game score:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const getUserScoreForDay = useCallback(async (day: number, gameType: string): Promise<GameScore | null> => {
    const user = await getCurrentUser();
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await GameScoreAPI.getUserScoreForDay(user.id, day, gameType, getToken);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get user score';
      setError(errorMessage);
      console.error('Error getting user score:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getToken, getCurrentUser]);

  const getUserPlayedGames = useCallback(async (): Promise<Record<string, boolean>> => {
    if (playedGamesCache) return playedGamesCache;

    if (playedGamesPromiseRef.current) {
      return playedGamesPromiseRef.current;
    }

    const promise = (async () => {
      const user = await getCurrentUser();
      if (!user) return {};
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await GameScoreAPI.getUserPlayedGames(user.id, getToken);
        setPlayedGamesCache(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get user played games';
        setError(errorMessage);
        console.error('Error getting user played games:', err);
        return {};
      } finally {
        setLoading(false);
        playedGamesPromiseRef.current = null;
      }
    })();

    playedGamesPromiseRef.current = promise;
    return promise;
  }, [getToken, getCurrentUser, playedGamesCache]);

  const hasUserPlayedGame = useCallback(async (day: number, gameType: string): Promise<boolean> => {
    const playedGames = await getUserPlayedGames();
    const key = `${day}-${gameType}`;
    return playedGames[key] === true;
  }, [getUserPlayedGames]);

  const invalidatePlayedGamesCache = useCallback(() => {
    setPlayedGamesCache(null);
    playedGamesPromiseRef.current = null;
  }, []);

  const getUserScores = useCallback(async (): Promise<GameScore[]> => {
    const user = await getCurrentUser();
    if (!user) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await GameScoreAPI.getUserScores(user.id, getToken);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get user scores';
      setError(errorMessage);
      console.error('Error getting user scores:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getToken, getCurrentUser]);

  const getScoresForDay = useCallback(async (day: number): Promise<GameScore[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await GameScoreAPI.getScoresForDay(day, getToken);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get scores for day';
      setError(errorMessage);
      console.error('Error getting scores for day:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const getLeaderboard = useCallback(async (day: number, gameType: string): Promise<GameScore[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await GameScoreAPI.getLeaderboard(day, gameType, getToken);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get leaderboard';
      setError(errorMessage);
      console.error('Error getting leaderboard:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  return {
    saveGameScore,
    getUserScoreForDay,
    hasUserPlayedGame,
    getUserPlayedGames,
    invalidatePlayedGamesCache,
    getUserScores,
    getScoresForDay,
    getLeaderboard,
    getCurrentUser,
    loading,
    error,
  };
};
