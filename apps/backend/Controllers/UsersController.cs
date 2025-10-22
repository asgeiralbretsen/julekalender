using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using BackendApi.Services;
using BackendApi.Models;

namespace BackendApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<User>> GetCurrentUser()
    {
        try
        {
            // Log all claims for debugging
            var claims = User.Claims.Select(c => $"{c.Type}: {c.Value}").ToList();
            _logger.LogInformation("JWT Claims: {Claims}", string.Join(", ", claims));
            
            // Get the Clerk user ID from the JWT token
            // ASP.NET Core maps "sub" claim to ClaimTypes.NameIdentifier
            var clerkId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                         User.FindFirst("sub")?.Value ?? 
                         User.FindFirst("user_id")?.Value;
            
            if (string.IsNullOrEmpty(clerkId))
            {
                _logger.LogWarning("Missing user ID in token. Available claims: {Claims}", string.Join(", ", claims));
                return Unauthorized("Invalid token: missing user ID");
            }

            // Get or create the user in our database
            var user = await _userService.GetUserByClerkIdAsync(clerkId);
            
            if (user == null)
            {
                // If user doesn't exist in our database, we need to create them
                // This shouldn't happen if the frontend is properly syncing users
                return NotFound("User not found in database. Please ensure user sync is working.");
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, "Error getting current user");
        }
    }

    [HttpGet("{clerkId}")]
    public async Task<ActionResult<User>> GetUser(string clerkId)
    {
        var user = await _userService.GetUserByClerkIdAsync(clerkId);
        if (user == null)
        {
            return NotFound();
        }
        return Ok(user);
    }

    [HttpGet]
    public async Task<ActionResult<List<User>>> GetAllUsers()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }

    [HttpPost("create")]
    public async Task<ActionResult<User>> CreateUser([FromBody] CreateUserRequest request)
    {
        try
        {
            var user = await _userService.CreateUserAsync(
                request.ClerkId,
                request.Email,
                request.FirstName,
                request.LastName,
                request.ImageUrl
            );
            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, "Error creating user");
        }
    }

    [HttpPost("sync")]
    [AllowAnonymous]
    public async Task<ActionResult<User>> SyncUser([FromBody] SyncUserRequest request)
    {
        try
        {
            var existingUser = await _userService.GetUserByClerkIdAsync(request.ClerkId);
            
            if (existingUser == null)
            {
                var newUser = await _userService.CreateUserAsync(
                    request.ClerkId,
                    request.Email,
                    request.FirstName,
                    request.LastName,
                    request.ImageUrl
                );
                _logger.LogInformation("Created new user: {ClerkId}", request.ClerkId);
                return Ok(newUser);
            }
            else
            {
                var updatedUser = await _userService.UpdateUserAsync(
                    request.ClerkId,
                    request.FirstName,
                    request.LastName,
                    request.ImageUrl
                );
                _logger.LogInformation("Updated existing user: {ClerkId}", request.ClerkId);
                return Ok(updatedUser);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing user");
            return StatusCode(500, "Error syncing user");
        }
    }
}

public class CreateUserRequest
{
    public string ClerkId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? ImageUrl { get; set; }
}

public class SyncUserRequest
{
    public string ClerkId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? ImageUrl { get; set; }
}
