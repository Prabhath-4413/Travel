using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace Travel.Api.Controllers;

[ApiController]
[Route("api/weather")]
public class WeatherController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;

    public WeatherController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    [HttpGet]
    public async Task<IActionResult> GetWeather([FromQuery] double latitude, [FromQuery] double longitude, [FromQuery] string cityName)
    {
        try
        {
            // Open-Meteo is free and doesn't require an API key
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync(
                $"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current=temperature_2m,wind_speed_10m&timezone=auto"
            );

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode(500, new { message = "Failed to fetch weather data" });
            }

            var content = await response.Content.ReadAsStringAsync();

            // Parse and validate the response
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            if (root.TryGetProperty("current", out var currentProp))
            {
                var temperature = currentProp.GetProperty("temperature_2m").GetDouble();
                var windSpeed = currentProp.GetProperty("wind_speed_10m").GetDouble();

                // Generate description and icon based on temperature and wind speed
                var description = "Clear sky";
                var icon = "01d"; // Default clear sky icon

                if (temperature < 0)
                {
                    description = "Freezing cold";
                    icon = "13d"; // Snow
                }
                else if (temperature < 10)
                {
                    description = "Cold weather";
                    icon = "02d"; // Few clouds
                }
                else if (temperature < 20)
                {
                    description = "Mild weather";
                    icon = "03d"; // Scattered clouds
                }
                else if (temperature < 30)
                {
                    description = "Warm weather";
                    icon = "01d"; // Clear sky
                }
                else
                {
                    description = "Hot weather";
                    icon = "01d"; // Clear sky
                }

                if (windSpeed > 20)
                {
                    description += ", windy";
                    icon = "50d"; // Mist (representing wind)
                }

                var weatherData = new
                {
                    city = cityName,
                    temperature = Math.Round(temperature),
                    description = description,
                    windSpeed = Math.Round(windSpeed), // Already in km/h
                    icon = icon
                };

                return Ok(weatherData);
            }

            return StatusCode(500, new { message = "Invalid weather data format" });
        }
        catch (HttpRequestException)
        {
            return StatusCode(503, new { message = "Weather service unavailable" });
        }
        catch (JsonException)
        {
            return StatusCode(500, new { message = "Failed to parse weather data" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        }
    }
}