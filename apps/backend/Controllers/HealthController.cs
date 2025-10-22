using Microsoft.AspNetCore.Mvc;

namespace BackendApi.Controllers;

/// <summary>
/// Health check endpoint for monitoring API availability
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class HealthController : ControllerBase
{
    /// <summary>
    /// Returns the health status of the API
    /// </summary>
    /// <returns>Health status information</returns>
    /// <response code="200">API is healthy and operational</response>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Get()
    {
        var healthStatus = new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        };

        return Ok(healthStatus);
    }
}
