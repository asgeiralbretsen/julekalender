using BackendApi.Models;

namespace BackendApi.Services;

public interface IGameScoreService
{
    Task<GameScore?> GetUserScoreForDayAsync(int userId, int day, string gameType);
    Task<GameScore> SaveGameScoreAsync(int userId, int day, string gameType, int score);
    Task<List<GameScore>> GetUserScoresAsync(int userId);
    Task<List<GameScore>> GetScoresForDayAsync(int day);
    Task<bool> HasUserPlayedGameTodayAsync(int userId, int day, string gameType);
}
