using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BackendApi.Models;

/// <summary>
/// Represents a player's score for a specific game on a specific day
/// </summary>
public class GameScore
{
    /// <summary>
    /// Unique identifier for the game score
    /// </summary>
    public int Id { get; set; }
    
    /// <summary>
    /// The ID of the user who achieved this score
    /// </summary>
    [Required]
    public int UserId { get; set; }
    
    /// <summary>
    /// The day number in the advent calendar (1-24)
    /// </summary>
    [Required]
    public int Day { get; set; }
    
    /// <summary>
    /// The type of game (e.g., "blurGuessGame", "colorMatchGame")
    /// </summary>
    [Required]
    public string GameType { get; set; } = string.Empty;
    
    /// <summary>
    /// The score achieved by the player
    /// </summary>
    [Required]
    public int Score { get; set; }
    
    /// <summary>
    /// The timestamp when the game was played
    /// </summary>
    public DateTime PlayedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Navigation property to the user who achieved this score
    /// </summary>
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}
