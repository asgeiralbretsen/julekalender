using System.ComponentModel.DataAnnotations;

namespace BackendApi.Models;

public class User
{
    public int Id { get; set; }
    
    [Required]
    public string UnimicroId { get; set; } = string.Empty;
    
    [Required]
    public string Email { get; set; } = string.Empty;
    
    public string? FirstName { get; set; }
    
    public string? LastName { get; set; }
    
    public string? CompanyKey { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime LastLoginAt { get; set; } = DateTime.UtcNow;
}
