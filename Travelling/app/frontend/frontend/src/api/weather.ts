// Weather API service for OpenWeatherMap integration

export interface WeatherData {
  city: string;
  temperature: number;
  description: string;
  windSpeed: number;
  humidity: number;
  icon: string;
}

export interface OpenWeatherMapResponse {
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  name: string;
}

class WeatherService {
  private baseUrl = "https://api.openweathermap.org/data/2.5/weather";
  private apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  constructor() {
    if (!this.apiKey) {
      throw new Error("OpenWeatherMap API key not found. Please set VITE_OPENWEATHER_API_KEY in your .env file.");
    }
  }

  async getWeatherByCity(cityName: string): Promise<WeatherData> {
    try {
      const response = await fetch(
        `${this.baseUrl}?q=${encodeURIComponent(cityName)}&appid=${this.apiKey}&units=metric`,
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid API key");
        } else if (response.status === 404) {
          throw new Error("City not found");
        } else {
          throw new Error("Failed to fetch weather data");
        }
      }

      const data: OpenWeatherMapResponse = await response.json();

      return {
        city: data.name,
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        humidity: data.main.humidity,
        icon: data.weather[0].icon,
      };
    } catch (error) {
      console.error("Weather API error:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Unable to connect to weather service");
      }
      throw error;
    }
  }

  async getWeatherByCoordinates(
    latitude: number,
    longitude: number,
    cityName?: string,
  ): Promise<WeatherData> {
    try {
      const response = await fetch(
        `${this.baseUrl}?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`,
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid API key");
        } else {
          throw new Error("Failed to fetch weather data");
        }
      }

      const data: OpenWeatherMapResponse = await response.json();

      return {
        city: cityName || data.name,
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        humidity: data.main.humidity,
        icon: data.weather[0].icon,
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
