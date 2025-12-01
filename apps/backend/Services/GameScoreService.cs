using Microsoft.EntityFrameworkCore;
using BackendApi.Data;
using BackendApi.Models;

namespace BackendApi.Services;

public class GameScoreService : IGameScoreService
{
    private readonly ApplicationDbContext _context;

    public GameScoreService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<GameScore?> GetUserScoreForDayAsync(int userId, int day, string gameType)
    {
        return await _context.GameScores
            .Include(gs => gs.User)
            .FirstOrDefaultAsync(gs => gs.UserId == userId && gs.Day == day && gs.GameType == gameType);
    }

    public async Task<GameScore> SaveGameScoreAsync(int userId, int day, string gameType, int score)
    {
        var existingScore = await GetUserScoreForDayAsync(userId, day, gameType);
        
        if (existingScore != null)
        {
            return existingScore;
        }

        var gameScore = new GameScore
        {
            UserId = userId,
            Day = day,
            GameType = gameType,
            Score = score,
            PlayedAt = DateTime.UtcNow
        };

        _context.GameScores.Add(gameScore);
        await _context.SaveChangesAsync();
        return gameScore;
    }

    public async Task<List<GameScore>> GetUserScoresAsync(int userId)
    {
        return await _context.GameScores
            .Include(gs => gs.User)
            .Where(gs => gs.UserId == userId)
            .OrderBy(gs => gs.Day)
            .ThenBy(gs => gs.GameType)
            .ToListAsync();
    }

    public async Task<List<GameScore>> GetScoresForDayAsync(int day)
    {
        return await _context.GameScores
            .Include(gs => gs.User)
            .Where(gs => gs.Day == day)
            .OrderBy(gs => gs.Score)
            .ToListAsync();
    }

    public async Task<bool> HasUserPlayedGameTodayAsync(int userId, int day, string gameType)
    {
        return await _context.GameScores
            .AnyAsync(gs => gs.UserId == userId && gs.Day == day && gs.GameType == gameType);
    }

    public async Task<Dictionary<string, bool>> GetUserPlayedGamesAsync(int userId)
    {
        var playedGames = await _context.GameScores
            .Where(gs => gs.UserId == userId)
            .Select(gs => new { gs.Day, gs.GameType })
            .ToListAsync();

        var result = new Dictionary<string, bool>();
        foreach (var game in playedGames)
        {
            result[$"{game.Day}-{game.GameType}"] = true;
        }

        return result;
    }

    public async Task<List<GameScore>> GetLeaderboardAsync(int day, string gameType)
    {
        return await _context.GameScores
            .Include(gs => gs.User)
            .Where(gs => gs.Day == day && gs.GameType == gameType)
            .OrderByDescending(gs => gs.Score)
            .ToListAsync();
    }

    public async Task<List<object>> GetTotalLeaderboardAsync()
    {
        var totalScores = await _context.GameScores
            .Include(gs => gs.User)
            .GroupBy(gs => gs.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                User = g.First().User,
                TotalScore = g.Sum(gs => gs.Score),
                GamesPlayed = g.Count(),
                LastPlayed = g.Max(gs => gs.PlayedAt)
            })
            .OrderByDescending(x => x.TotalScore)
            .ToListAsync();

        return totalScores.Cast<object>().ToList();
    }
}
