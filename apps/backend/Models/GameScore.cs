using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackendApi.Models;

public class GameScore
{
    public int Id { get; set; }
    
    [Required]
    public int UserId { get; set; }
    
    [Required]
    public int Day { get; set; }
    
    [Required]
    public string GameType { get; set; } = string.Empty;
    
    [Required]
    public int Score { get; set; }
    
    public DateTime PlayedAt { get; set; } = DateTime.UtcNow;
    
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}
