const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5002' : '');

export class GameScoreAPI {
  private static async getAuthHeaders(getToken: () => Promise<string | null>): Promise<HeadersInit> {
    const token = await getToken();
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  static async saveGameScore(request: { day: number; gameType: string; score: number }, getToken: () => Promise<string | null>): Promise<any> {
    const headers = await this.getAuthHeaders(getToken);
    
    const response = await fetch(`${API_BASE_URL}/api/gamescore/save`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to save game score: ${response.statusText}`);
    }

    return response.json();
  }

  static async getUserScoreForDay(userId: number, day: number, gameType: string, getToken: () => Promise<string | null>): Promise<any | null> {
    const headers = await this.getAuthHeaders(getToken);
    
    const response = await fetch(
      `${API_BASE_URL}/api/gamescore/user/${userId}/day/${day}/game/${gameType}`,
      { headers }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get user score: ${response.statusText}`);
    }

    return response.json();
  }

  static async getUserScores(userId: number, getToken: () => Promise<string | null>): Promise<any[]> {
    const headers = await this.getAuthHeaders(getToken);
    
    const response = await fetch(`${API_BASE_URL}/api/gamescore/user/${userId}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get user scores: ${response.statusText}`);
    }

    return response.json();
  }

  static async getScoresForDay(day: number, getToken: () => Promise<string | null>): Promise<any[]> {
    const headers = await this.getAuthHeaders(getToken);
    
    const response = await fetch(`${API_BASE_URL}/api/gamescore/day/${day}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get scores for day: ${response.statusText}`);
    }

    return response.json();
  }

  static async hasUserPlayedGame(userId: number, day: number, gameType: string, getToken: () => Promise<string | null>): Promise<boolean> {
    const headers = await this.getAuthHeaders(getToken);
    
    const response = await fetch(
      `${API_BASE_URL}/api/gamescore/user/${userId}/day/${day}/game/${gameType}/played`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to check if user has played game: ${response.statusText}`);
    }

    return response.json();
  }

  static async getCurrentUser(getToken: () => Promise<string | null>): Promise<{ id: number; unimicroId: string; email: string } | null> {
    const headers = await this.getAuthHeaders(getToken);
    
    const response = await fetch(`${API_BASE_URL}/api/users/me`, { headers });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get current user: ${response.statusText}`);
    }

    return response.json();
  }

  static async getLeaderboard(day: number, gameType: string, getToken: () => Promise<string | null>): Promise<any[]> {
    const headers = await this.getAuthHeaders(getToken);
    
    const response = await fetch(
      `${API_BASE_URL}/api/gamescore/leaderboard/day/${day}/game/${gameType}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to get leaderboard: ${response.statusText}`);
    }

    return response.json();
  }

  static async getTotalLeaderboard(getToken: () => Promise<string | null>): Promise<any[]> {
    const headers = await this.getAuthHeaders(getToken);
    
    const response = await fetch(
      `${API_BASE_URL}/api/gamescore/leaderboard/total`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to get total leaderboard: ${response.statusText}`);
    }

    return response.json();
  }
}
