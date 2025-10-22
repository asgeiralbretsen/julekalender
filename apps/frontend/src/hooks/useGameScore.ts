import { useState, useCallback } from 'react';
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

  const hasUserPlayedGame = useCallback(async (day: number, gameType: string): Promise<boolean> => {
    const user = await getCurrentUser();
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await GameScoreAPI.hasUserPlayedGame(user.id, day, gameType, getToken);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check if user has played game';
      setError(errorMessage);
      console.error('Error checking if user has played game:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [getToken, getCurrentUser]);

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
    getUserScores,
    getScoresForDay,
    getLeaderboard,
    getCurrentUser,
    loading,
    error,
  };
};
