using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BackendApi.Services;
using BackendApi.Models;
using System.Security.Claims;

namespace BackendApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameScoreController : ControllerBase
{
    private readonly IGameScoreService _gameScoreService;
    private readonly IUserService _userService;

    public GameScoreController(IGameScoreService gameScoreService, IUserService userService)
    {
        _gameScoreService = gameScoreService;
        _userService = userService;
    }

    [HttpPost("save")]
    [Authorize]
    public async Task<ActionResult<GameScore>> SaveGameScore([FromBody] SaveGameScoreRequest request)
    {
        try
        {
            var clerkId = GetCurrentUserId();
            if (clerkId == null)
            {
                return Unauthorized("User not found");
            }

            var user = await _userService.GetUserByClerkIdAsync(clerkId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            var gameScore = await _gameScoreService.SaveGameScoreAsync(
                user.Id, 
                request.Day, 
                request.GameType, 
                request.Score
            );

            return Ok(gameScore);
        }
        catch (Exception ex)
        {
            return BadRequest($"Error saving game score: {ex.Message}");
        }
    }

    [HttpGet("user/{userId}/day/{day}/game/{gameType}")]
    [Authorize]
    public async Task<ActionResult<GameScore>> GetUserScoreForDay(int userId, int day, string gameType)
    {
        try
        {
            var clerkId = GetCurrentUserId();
            if (clerkId == null)
            {
                return Unauthorized("User not found");
            }

            var user = await _userService.GetUserByClerkIdAsync(clerkId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            // Ensure the user can only access their own scores
            if (user.Id != userId)
            {
                return Forbid("You can only access your own scores");
            }

            var gameScore = await _gameScoreService.GetUserScoreForDayAsync(userId, day, gameType);
            if (gameScore == null)
            {
                return NotFound("No score found for this user, day, and game type");
            }

            return Ok(gameScore);
        }
        catch (Exception ex)
        {
            return BadRequest($"Error retrieving game score: {ex.Message}");
        }
    }

    [HttpGet("user/{userId}")]
    [Authorize]
    public async Task<ActionResult<List<GameScore>>> GetUserScores(int userId)
    {
        try
        {
            var clerkId = GetCurrentUserId();
            if (clerkId == null)
            {
                return Unauthorized("User not found");
            }

            var user = await _userService.GetUserByClerkIdAsync(clerkId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            // Ensure the user can only access their own scores
            if (user.Id != userId)
            {
                return Forbid("You can only access your own scores");
            }

            var scores = await _gameScoreService.GetUserScoresAsync(userId);
            return Ok(scores);
        }
        catch (Exception ex)
        {
            return BadRequest($"Error retrieving user scores: {ex.Message}");
        }
    }

    [HttpGet("day/{day}")]
    [Authorize]
    public async Task<ActionResult<List<GameScore>>> GetScoresForDay(int day)
    {
        try
        {
            var scores = await _gameScoreService.GetScoresForDayAsync(day);
            return Ok(scores);
        }
        catch (Exception ex)
        {
            return BadRequest($"Error retrieving scores for day: {ex.Message}");
        }
    }

    [HttpGet("user/{userId}/day/{day}/game/{gameType}/played")]
    [Authorize]
    public async Task<ActionResult<bool>> HasUserPlayedGame(int userId, int day, string gameType)
    {
        try
        {
            var clerkId = GetCurrentUserId();
            if (clerkId == null)
            {
                return Unauthorized("User not found");
            }

            var user = await _userService.GetUserByClerkIdAsync(clerkId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            // Ensure the user can only check their own game status
            if (user.Id != userId)
            {
                return Forbid("You can only check your own game status");
            }

            var hasPlayed = await _gameScoreService.HasUserPlayedGameTodayAsync(userId, day, gameType);
            return Ok(hasPlayed);
        }
        catch (Exception ex)
        {
            return BadRequest($"Error checking if user has played game: {ex.Message}");
        }
    }

    [HttpGet("leaderboard/day/{day}/game/{gameType}")]
    [Authorize]
    public async Task<ActionResult<List<GameScore>>> GetLeaderboard(int day, string gameType)
    {
        try
        {
            var scores = await _gameScoreService.GetLeaderboardAsync(day, gameType);
            return Ok(scores);
        }
        catch (Exception ex)
        {
            return BadRequest($"Error retrieving leaderboard: {ex.Message}");
        }
    }

    private string? GetCurrentUserId()
    {
        // Try different claim types that Clerk might use
        return User.FindFirst("sub")?.Value ?? 
               User.FindFirst("user_id")?.Value ?? 
               User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}

public class SaveGameScoreRequest
{
    public int Day { get; set; }
    public string GameType { get; set; } = string.Empty;
    public int Score { get; set; }
}
