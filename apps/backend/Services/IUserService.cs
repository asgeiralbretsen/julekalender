using BackendApi.Models;

namespace BackendApi.Services;

public interface IUserService
{
    Task<User?> GetUserByClerkIdAsync(string clerkId);
    Task<List<User>> GetAllUsersAsync();
    Task<User> CreateUserAsync(string clerkId, string email, string? firstName = null, string? lastName = null, string? imageUrl = null);
    Task<User> UpdateUserAsync(string clerkId, string? firstName = null, string? lastName = null, string? imageUrl = null);
    Task<bool> UserExistsAsync(string clerkId);
}
