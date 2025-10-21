using Microsoft.EntityFrameworkCore;
using BackendApi.Data;
using BackendApi.Models;

namespace BackendApi.Services;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;

    public UserService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetUserByClerkIdAsync(string clerkId)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.UnimicroId == clerkId);
    }

    public async Task<List<User>> GetAllUsersAsync()
    {
        return await _context.Users.ToListAsync();
    }

    public async Task<User> CreateUserAsync(string clerkId, string email, string? firstName = null, string? lastName = null, string? imageUrl = null)
    {
        var user = new User
        {
            UnimicroId = clerkId,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            CompanyKey = null,
            CreatedAt = DateTime.UtcNow,
            LastLoginAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User> UpdateUserAsync(string clerkId, string? firstName = null, string? lastName = null, string? imageUrl = null)
    {
        var user = await GetUserByClerkIdAsync(clerkId);
        if (user == null)
        {
            throw new InvalidOperationException($"User with ClerkId {clerkId} not found");
        }

        if (firstName != null) user.FirstName = firstName;
        if (lastName != null) user.LastName = lastName;
        user.LastLoginAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<bool> UserExistsAsync(string clerkId)
    {
        return await _context.Users
            .AnyAsync(u => u.UnimicroId == clerkId);
    }
}
