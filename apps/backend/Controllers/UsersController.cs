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
    public async Task<ActionResult<User>> GetCurrentUser()
    {
        // For development, return a mock user or handle this differently
        return BadRequest("Authentication not implemented yet");
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
