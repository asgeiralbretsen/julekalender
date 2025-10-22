using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BackendApi.Services;
using BackendApi.Models;
using System.Security.Claims;

namespace BackendApi.Controllers;

/// <summary>
/// Manages game scores and leaderboards for the advent calendar games
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class GameScoreController : ControllerBase
{
    private readonly IGameScoreService _gameScoreService;
    private readonly IUserService _userService;

    public GameScoreController(IGameScoreService gameScoreService, IUserService userService)
    {
        _gameScoreService = gameScoreService;
        _userService = userService;
    }

    /// <summary>
    /// Saves a game score for the authenticated user
    /// </summary>
    /// <param name="request">The game score data to save</param>
    /// <returns>The saved game score</returns>
    /// <remarks>
    /// Sample request:
    /// 
    ///     POST /api/gamescore/save
    ///     {
    ///        "day": 1,
    ///        "gameType": "blurGuessGame",
    ///        "score": 1250
    ///     }
    /// 
    /// Note: Only the first score submission per day/game combination will be saved.
    /// Subsequent attempts will return the original score without updating it.
    /// </remarks>
    /// <response code="200">Returns the saved game score</response>
    /// <response code="400">If the request is invalid</response>
    /// <response code="401">If the user is not authenticated</response>
    /// <response code="404">If the user is not found</response>
    [HttpPost("save")]
    [Authorize]
    [ProducesResponseType(typeof(GameScore), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GameScore>> SaveGameScore([FromBody] SaveGameScoreRequest request)
    {
        try
        {
            var clerkId = GetCurrentUserId();
            if (clerkId == null)
            {
                return Unauthorized("Bruker ikke funnet");
            }

            var user = await _userService.GetUserByClerkIdAsync(clerkId);
            if (user == null)
            {
                return NotFound("Bruker ikke funnet");
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
            return BadRequest($"Feil ved lagring av spillpoeng: {ex.Message}");
        }
    }

    /// <summary>
    /// Gets a specific user's score for a given day and game type
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="day">The day number (1-24)</param>
    /// <param name="gameType">The game type identifier (e.g., "blurGuessGame", "colorMatchGame")</param>
    /// <returns>The user's game score</returns>
    /// <response code="200">Returns the game score</response>
    /// <response code="401">If the user is not authenticated</response>
    /// <response code="403">If trying to access another user's score</response>
    /// <response code="404">If no score is found</response>
    [HttpGet("user/{userId}/day/{day}/game/{gameType}")]
    [Authorize]
    [ProducesResponseType(typeof(GameScore), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GameScore>> GetUserScoreForDay(int userId, int day, string gameType)
    {
        try
        {
            var clerkId = GetCurrentUserId();
            if (clerkId == null)
            {
                return Unauthorized("Bruker ikke funnet");
            }

            var user = await _userService.GetUserByClerkIdAsync(clerkId);
            if (user == null)
            {
                return NotFound("Bruker ikke funnet");
            }

            // Ensure the user can only access their own scores
            if (user.Id != userId)
            {
                return Forbid("Du kan bare se dine egne poengsummer");
            }

            var gameScore = await _gameScoreService.GetUserScoreForDayAsync(userId, day, gameType);
            if (gameScore == null)
            {
                return NotFound("Ingen poengsum funnet for denne brukeren, dagen og spilltypen");
            }

            return Ok(gameScore);
        }
        catch (Exception ex)
        {
            return BadRequest($"Feil ved henting av spillpoeng: {ex.Message}");
        }
    }

    /// <summary>
    /// Gets all scores for a specific user
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <returns>A list of all game scores for the user</returns>
    /// <response code="200">Returns the list of game scores</response>
    /// <response code="401">If the user is not authenticated</response>
    /// <response code="403">If trying to access another user's scores</response>
    /// <response code="404">If the user is not found</response>
    [HttpGet("user/{userId}")]
    [Authorize]
    [ProducesResponseType(typeof(List<GameScore>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<GameScore>>> GetUserScores(int userId)
    {
        try
        {
            var clerkId = GetCurrentUserId();
            if (clerkId == null)
            {
                return Unauthorized("Bruker ikke funnet");
            }

            var user = await _userService.GetUserByClerkIdAsync(clerkId);
            if (user == null)
            {
                return NotFound("Bruker ikke funnet");
            }

            // Ensure the user can only access their own scores
            if (user.Id != userId)
            {
                return Forbid("Du kan bare se dine egne poengsummer");
            }

            var scores = await _gameScoreService.GetUserScoresAsync(userId);
            return Ok(scores);
        }
        catch (Exception ex)
        {
            return BadRequest($"Feil ved henting av brukerpoengsummer: {ex.Message}");
        }
    }

    /// <summary>
    /// Gets all scores for a specific day (all game types)
    /// </summary>
    /// <param name="day">The day number (1-24)</param>
    /// <returns>A list of all game scores for that day</returns>
    /// <response code="200">Returns the list of game scores</response>
    /// <response code="401">If the user is not authenticated</response>
    [HttpGet("day/{day}")]
    [Authorize]
    [ProducesResponseType(typeof(List<GameScore>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<GameScore>>> GetScoresForDay(int day)
    {
        try
        {
            var scores = await _gameScoreService.GetScoresForDayAsync(day);
            return Ok(scores);
        }
        catch (Exception ex)
        {
            return BadRequest($"Feil ved henting av poengsummer for dagen: {ex.Message}");
        }
    }

    /// <summary>
    /// Checks if a user has played a specific game on a specific day
    /// </summary>
    /// <param name="userId">The user ID</param>
    /// <param name="day">The day number (1-24)</param>
    /// <param name="gameType">The game type identifier (e.g., "blurGuessGame", "colorMatchGame")</param>
    /// <returns>True if the user has played, false otherwise</returns>
    /// <response code="200">Returns true or false</response>
    /// <response code="401">If the user is not authenticated</response>
    /// <response code="403">If trying to check another user's status</response>
    /// <response code="404">If the user is not found</response>
    [HttpGet("user/{userId}/day/{day}/game/{gameType}/played")]
    [Authorize]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<bool>> HasUserPlayedGame(int userId, int day, string gameType)
    {
        try
        {
            var clerkId = GetCurrentUserId();
            if (clerkId == null)
            {
                return Unauthorized("Bruker ikke funnet");
            }

            var user = await _userService.GetUserByClerkIdAsync(clerkId);
            if (user == null)
            {
                return NotFound("Bruker ikke funnet");
            }

            // Ensure the user can only check their own game status
            if (user.Id != userId)
            {
                return Forbid("Du kan bare sjekke din egen spillstatus");
            }

            var hasPlayed = await _gameScoreService.HasUserPlayedGameTodayAsync(userId, day, gameType);
            return Ok(hasPlayed);
        }
        catch (Exception ex)
        {
            return BadRequest($"Feil ved sjekk om bruker har spilt spillet: {ex.Message}");
        }
    }

    /// <summary>
    /// Gets the leaderboard for a specific day and game type
    /// </summary>
    /// <param name="day">The day number (1-24)</param>
    /// <param name="gameType">The game type identifier (e.g., "blurGuessGame", "colorMatchGame")</param>
    /// <returns>A list of game scores sorted by score (highest first)</returns>
    /// <remarks>
    /// The leaderboard shows all players who have completed the specified game on the specified day,
    /// sorted by their score in descending order. Only the first score submission per user is included.
    /// </remarks>
    /// <response code="200">Returns the leaderboard</response>
    /// <response code="401">If the user is not authenticated</response>
    [HttpGet("leaderboard/day/{day}/game/{gameType}")]
    [Authorize]
    [ProducesResponseType(typeof(List<GameScore>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<GameScore>>> GetLeaderboard(int day, string gameType)
    {
        try
        {
            var scores = await _gameScoreService.GetLeaderboardAsync(day, gameType);
            return Ok(scores);
        }
        catch (Exception ex)
        {
            return BadRequest($"Feil ved henting av toppliste: {ex.Message}");
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

/// <summary>
/// Request model for saving a game score
/// </summary>
public class SaveGameScoreRequest
{
    /// <summary>
    /// The day number (1-24)
    /// </summary>
    /// <example>1</example>
    public int Day { get; set; }
    
    /// <summary>
    /// The game type identifier
    /// </summary>
    /// <example>blurGuessGame</example>
    public string GameType { get; set; } = string.Empty;
    
    /// <summary>
    /// The score achieved by the player
    /// </summary>
    /// <example>1250</example>
    public int Score { get; set; }
}
