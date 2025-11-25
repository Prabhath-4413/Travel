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
  private apiKey: string | undefined = (import.meta.env as any)
    .VITE_OPENWEATHER_API_KEY;

  // City fallback mapping for locations not recognized by OpenWeather API
  private cityFallbacks: Record<string, string> = {
    // Indian locations
    "gandipet mandal": "Hyderabad",
    gandipet: "Hyderabad",
    rajahmundry: "Rajahmundry",
    vizag: "Visakhapatnam",
    "bangalore rural": "Bangalore",
    "mysore district": "Mysore",
    coorg: "Madikeri",
    alleppey: "Alappuzha",
    munnar: "Munnar",
    kovalam: "Kovalam",
    "goa beaches": "Panaji",
    "udaipur city": "Udaipur",
    "jaipur district": "Jaipur",
    "agra fort": "Agra",
    "varanasi ghats": "Varanasi",
    kolkata: "Kolkata",
    "delhi ncr": "New Delhi",
    "mumbai suburbs": "Mumbai",

    // International locations
    "machu picchu trek": "Cusco",
    "machu picchu": "Cusco",
    "sacred valley": "Cusco",
    "inca trail": "Cusco",
    "eiffel tower": "Paris",
    "louvre museum": "Paris",
    "paris city": "Paris",
    "london bridge": "London",
    "big ben": "London",
    "london city": "London",
    "times square": "New York",
    "central park": "New York",
    "new york city": "New York",
    "tokyo tower": "Tokyo",
    "tokyo city": "Tokyo",
    shibuya: "Tokyo",
    "sydney opera": "Sydney",
    "sydney harbour": "Sydney",
    "great barrier reef": "Cairns",
    "bali beaches": "Denpasar",
    "bali island": "Denpasar",
    "dubai mall": "Dubai",
    "burj khalifa": "Dubai",
    "dubai city": "Dubai",
    "singapore gardens": "Singapore",
    "marina bay": "Singapore",
    "singapore city": "Singapore",

    // Mountain/Adventure locations
    "everest base camp": "Kathmandu",
    annapurna: "Pokhara",
    "kathmandu valley": "Kathmandu",
    "bhutan monasteries": "Thimphu",
    "nepal himalayas": "Kathmandu",
    "swiss alps": "Zurich",
    "alps mountains": "Zurich",
    "rocky mountains": "Denver",
    "andes mountains": "Cusco",
    himalayas: "Kathmandu",

    // Island/Beach locations
    "maldives resorts": "Malé",
    "seychelles islands": "Victoria",
    "mauritius beaches": "Port Louis",
    "hawaii islands": "Honolulu",
    "caribbean islands": "Kingston",
    "phuket beaches": "Phuket",
    "boracay island": "Boracay",
    "bora bora": "Papeete",

    // Safari/Wildlife locations
    "safari kenya": "Nairobi",
    serengeti: "Arusha",
    "masai mara": "Nairobi",
    "kruger national": "Johannesburg",
    "amazon rainforest": "Manaus",
    "galapagos islands": "Quito",

    // European locations
    "rome colosseum": "Rome",
    "venice canals": "Venice",
    "amsterdam canals": "Amsterdam",
    "barcelona beaches": "Barcelona",
    "madrid royal": "Madrid",
    "berlin wall": "Berlin",
    "prague castle": "Prague",
    "vienna opera": "Vienna",

    // Asian locations
    "great wall": "Beijing",
    "forbidden city": "Beijing",
    "kyoto temples": "Kyoto",
    "angkor wat": "Siem Reap",
    "taj mahal": "Agra",
    "petra ruins": "Amman",
    "pyramids giza": "Cairo",
  };

  constructor() {
    if (!this.apiKey) {
      throw new Error(
        "OpenWeatherMap API key not found. Please set VITE_OPENWEATHER_API_KEY in your .env file.",
      );
    }
  }

  /**
   * Get the best city name to use for weather API, with fallbacks
   */
  private getCityForWeather(cityName: string): string {
    const normalizedCity = cityName.toLowerCase().trim();

    // First, try to find an exact match in our fallback mapping
    if (this.cityFallbacks[normalizedCity]) {
      return this.cityFallbacks[normalizedCity];
    }

    // Try partial matches (e.g., "machu picchu" should match "machu picchu trek")
    for (const [key, value] of Object.entries(this.cityFallbacks)) {
      if (normalizedCity.includes(key) || key.includes(normalizedCity)) {
        return value;
      }
    }

    // If no mapping found, default to Hyderabad as requested
    return "Hyderabad";
  }

  async getWeatherByCity(cityName: string): Promise<WeatherData> {
    const fallbackCity = this.getCityForWeather(cityName);
    const citiesToTry = [
      fallbackCity !== cityName ? fallbackCity : cityName, // Try fallback first if different
      cityName, // Original city name as fallback
    ];

    // Remove duplicates
    const uniqueCities = [...new Set(citiesToTry)];

    let lastError: Error | null = null;

    for (const city of uniqueCities) {
      try {
        const response = await fetch(
          `${this.baseUrl}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`,
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Invalid API key");
          } else if (response.status === 404) {
            // City not found, try next fallback
            lastError = new Error(`City "${city}" not found`);
            continue;
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
        lastError = error instanceof Error ? error : new Error("Unknown error");
        // Continue to next fallback city
      }
    }

    // If all cities failed, throw a user-friendly error
    throw new Error(
      `Weather data unavailable for "${cityName}". Please check your location or try again later.`,
    );
  }

  /**
   * Get the fallback city for a given location (exposed for testing)
   */
  getFallbackCity(cityName: string): string {
    return this.getCityForWeather(cityName);
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
