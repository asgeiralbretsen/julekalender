using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using BackendApi.Services;
using BackendApi.Models;

namespace BackendApi.Controllers;

/// <summary>
/// Manages user accounts and authentication
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Gets the currently authenticated user's information
    /// </summary>
    /// <returns>The current user's details</returns>
    /// <response code="200">Returns the user information</response>
    /// <response code="401">If the user is not authenticated</response>
    /// <response code="404">If the user is not found in the database</response>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(User), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
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

    /// <summary>
    /// Gets a user by their Clerk ID
    /// </summary>
    /// <param name="clerkId">The Clerk user identifier</param>
    /// <returns>The user's details</returns>
    /// <response code="200">Returns the user information</response>
    /// <response code="404">If the user is not found</response>
    [HttpGet("{clerkId}")]
    [ProducesResponseType(typeof(User), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<User>> GetUser(string clerkId)
    {
        var user = await _userService.GetUserByClerkIdAsync(clerkId);
        if (user == null)
        {
            return NotFound();
        }
        return Ok(user);
    }

    /// <summary>
    /// Gets all registered users
    /// </summary>
    /// <returns>A list of all users</returns>
    /// <response code="200">Returns the list of users</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<User>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<User>>> GetAllUsers()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }

    /// <summary>
    /// Creates a new user account
    /// </summary>
    /// <param name="request">The user creation data</param>
    /// <returns>The created user</returns>
    /// <response code="200">Returns the created user</response>
    /// <response code="500">If there's an error creating the user</response>
    [HttpPost("create")]
    [ProducesResponseType(typeof(User), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
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

    /// <summary>
    /// Syncs a user from Clerk authentication system
    /// </summary>
    /// <param name="request">The user sync data</param>
    /// <returns>The created or updated user</returns>
    /// <remarks>
    /// This endpoint is used by the frontend to automatically sync users from Clerk.
    /// If the user doesn't exist, they will be created. If they exist, their information will be updated.
    /// </remarks>
    /// <response code="200">Returns the synced user</response>
    /// <response code="500">If there's an error syncing the user</response>
    [HttpPost("sync")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(User), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
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

/// <summary>
/// Request model for creating a new user
/// </summary>
public class CreateUserRequest
{
    /// <summary>
    /// The Clerk authentication system user ID
    /// </summary>
    public string ClerkId { get; set; } = string.Empty;
    
    /// <summary>
    /// The user's email address
    /// </summary>
    public string Email { get; set; } = string.Empty;
    
    /// <summary>
    /// The user's first name (optional)
    /// </summary>
    public string? FirstName { get; set; }
    
    /// <summary>
    /// The user's last name (optional)
    /// </summary>
    public string? LastName { get; set; }
    
    /// <summary>
    /// URL to the user's profile image (optional)
    /// </summary>
    public string? ImageUrl { get; set; }
}

/// <summary>
/// Request model for syncing a user from Clerk
/// </summary>
public class SyncUserRequest
{
    /// <summary>
    /// The Clerk authentication system user ID
    /// </summary>
    public string ClerkId { get; set; } = string.Empty;
    
    /// <summary>
    /// The user's email address
    /// </summary>
    public string Email { get; set; } = string.Empty;
    
    /// <summary>
    /// The user's first name (optional)
    /// </summary>
    public string? FirstName { get; set; }
    
    /// <summary>
    /// The user's last name (optional)
    /// </summary>
    public string? LastName { get; set; }
    
    /// <summary>
    /// URL to the user's profile image (optional)
    /// </summary>
    public string? ImageUrl { get; set; }
}
