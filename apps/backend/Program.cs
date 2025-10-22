using Microsoft.EntityFrameworkCore;
using BackendApi.Data;
using BackendApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("https://julekalender.albretsen.no", "http://localhost:3001", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Add Entity Framework
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add services
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IGameScoreService, GameScoreService>();

// Add JWT Authentication for Clerk (temporarily disabled for development)
// builder.Services.AddAuthentication("Bearer")
//     .AddJwtBearer("Bearer", options =>
//     {
//         options.Authority = "https://clerk.julekalender.albretsen.no";
//         options.Audience = "https://clerk.julekalender.albretsen.no";
//         options.RequireHttpsMetadata = false; // Set to true in production
//     });

var app = builder.Build();

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();

// Temporarily disable authentication for development
// app.UseAuthentication();
// app.UseAuthorization();

// Add global route prefix for julekalender API
app.MapControllers();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/api/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
