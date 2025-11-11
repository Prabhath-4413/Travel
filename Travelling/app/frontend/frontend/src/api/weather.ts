// Weather API service for Open-Meteo integration (free, no API key required)

export interface WeatherData {
  city: string;
  temperature: number;
  description: string;
  windSpeed: number;
  icon: string;
}

export interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
  };
  current_units: {
    temperature_2m: string;
    wind_speed_10m: string;
  };
}

class WeatherService {
  private baseUrl = "https://api.open-meteo.com/v1/forecast";

  constructor() {
    // Open-Meteo is free and doesn't require an API key
  }

  async getWeatherByCoordinates(
    latitude: number,
    longitude: number,
    cityName: string,
  ): Promise<WeatherData> {
    try {
      const response = await fetch(
        `${this.baseUrl}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m&timezone=auto`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const data: OpenMeteoResponse = await response.json();

      // Open-Meteo doesn't provide weather descriptions or icons like OpenWeatherMap
      // We'll use generic descriptions based on temperature and wind speed
      const temperature = data.current.temperature_2m;
      const windSpeed = data.current.wind_speed_10m;

      let description = "Clear sky";
      let icon = "01d"; // Default clear sky icon

      if (temperature < 0) {
        description = "Freezing cold";
        icon = "13d"; // Snow
      } else if (temperature < 10) {
        description = "Cold weather";
        icon = "02d"; // Few clouds
      } else if (temperature < 20) {
        description = "Mild weather";
        icon = "03d"; // Scattered clouds
      } else if (temperature < 30) {
        description = "Warm weather";
        icon = "01d"; // Clear sky
      } else {
        description = "Hot weather";
        icon = "01d"; // Clear sky
      }

      if (windSpeed > 20) {
        description += ", windy";
        icon = "50d"; // Mist (representing wind)
      }

      return {
        city: cityName,
        temperature: Math.round(temperature),
        description: description,
        windSpeed: Math.round(windSpeed), // Already in km/h
        icon: icon,
      };
    } catch (error) {
      console.error("Weather API error:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Unable to connect to weather service");
      }
      throw error;
    }
  }
}

export const weatherService = new WeatherService();
