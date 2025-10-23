using System.ComponentModel.DataAnnotations;

namespace BackendApi.Models;

/// <summary>
/// Represents a user account in the system
/// </summary>
public class User
{
    /// <summary>
    /// Unique identifier for the user
    /// </summary>
    public int Id { get; set; }
    
    /// <summary>
    /// The Clerk authentication system user ID
    /// </summary>
    [Required]
    public string UnimicroId { get; set; } = string.Empty;
    
    /// <summary>
    /// The user's email address
    /// </summary>
    [Required]
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
    /// Company identifier key (optional)
    /// </summary>
    public string? CompanyKey { get; set; }
    
    /// <summary>
    /// The timestamp when the user account was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// The timestamp of the user's last login
    /// </summary>
    public DateTime LastLoginAt { get; set; } = DateTime.UtcNow;
}
