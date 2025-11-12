import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Thermometer,
  Loader2,
  Droplets,
} from "lucide-react";
import { weatherService, WeatherData } from "../api/weather";
import { LocationData } from "../lib/location";

// Helper function to extract city name from descriptive destination names
const extractCityName = (destinationName: string): string => {
  // Normalize the input for case-insensitive matching
  const normalizedName = destinationName.trim().toLowerCase();

  // Common patterns for destination names
  const cityMappings: { [key: string]: string } = {
    "machu picchu trek": "Cusco",
    "munnar tea highlands": "Munnar",
    "paris city lights": "Paris",
    "santorini sunset escape": "Santorini",
    "swiss alps adventure": "Zermatt",
    "gandipet mandal": "Hyderabad",
    "tokyo nightlife": "Tokyo",
    "bali beach paradise": "Denpasar",
    "new york city": "New York",
    "london explorer": "London",
    "rome ancient wonders": "Rome",
    "barcelona gaudi trail": "Barcelona",
    "amsterdam canals": "Amsterdam",
    "berlin wall tour": "Berlin",
    "prague castle": "Prague",
    "vienna classical": "Vienna",
    "budapest thermal baths": "Budapest",
    "istanbul bazaars": "Istanbul",
    "dubai luxury": "Dubai",
    "singapore gardens": "Singapore",
    "sydney opera": "Sydney",
    "rio carnival": "Rio de Janeiro",
    "cape town table": "Cape Town",
    "marrakech medina": "Marrakech",
    "cairo pyramids": "Cairo",
    "athens acropolis": "Athens",
    "venice canals": "Venice",
    "florence renaissance": "Florence",
    "milan fashion": "Milan",
    "munich beer gardens": "Munich",
    "edinburgh castle": "Edinburgh",
    "dublin pubs": "Dublin",
    "lisbon tram": "Lisbon",
    "madrid royal": "Madrid",
    "seville flamenco": "Seville",
    "granada alhambra": "Granada",
    "porto wine": "Porto",
    "zurich lakes": "Zurich",
    "geneva luxury": "Geneva",
    "interlaken views": "Interlaken",
    "lucerne mountains": "Lucerne",
    "queenstown adventure": "Queenstown",
    "auckland sky": "Auckland",
    "wellington culture": "Wellington",
    "vancouver mountains": "Vancouver",
    "toronto skyscrapers": "Toronto",
    "montreal old town": "Montreal",
    "buenos aires tango": "Buenos Aires",
    "santiago andes": "Santiago",
    "lima colonial": "Lima",
    "bogota culture": "Bogota",
    "mexico city ancient": "Mexico City",
    "cancun beaches": "Cancun",
    "havana classic": "Havana",
    "kingston music": "Kingston",
    "bangkok temples": "Bangkok",
    "phuket islands": "Phuket",
    "chiang mai culture": "Chiang Mai",
    "hanoi old quarter": "Hanoi",
    "ho chi minh city": "Ho Chi Minh City",
    "seoul palaces": "Seoul",
    "busan beaches": "Busan",
    "kyoto temples": "Kyoto",
    "osaka food": "Osaka",
    "taipei night markets": "Taipei",
    "hong kong harbor": "Hong Kong",
    "shanghai bund": "Shanghai",
    "beijing wall": "Beijing",
    "delhi monuments": "Delhi",
    "mumbai bollywood": "Mumbai",
    "jaipur palaces": "Jaipur",
    "agra taj": "Agra",
    "varanasi ghats": "Varanasi",
    "goa beaches": "Goa",
    "kerala backwaters": "Kochi",
    "rajasthan desert": "Jodhpur",
    "himachal mountains": "Shimla",
    "kashmir valley": "Srinagar",
    "darjeeling tea": "Darjeeling",
    "sikkim monasteries": "Gangtok",
    "assam tea gardens": "Guwahati",
    "meghalaya falls": "Shillong",
    "nagaland tribes": "Kohima",
    "manipur lakes": "Imphal",
    "tripura temples": "Agartala",
    "mizoram hills": "Aizawl",
    "arunachal pradesh": "Itanagar",
    "andhra pradesh": "Visakhapatnam",
    "telangana": "Hyderabad",
    "karnataka": "Bangalore",
    "tamil nadu": "Chennai",
    "kerala": "Thiruvananthapuram",
    "goa": "Panaji",
    "maharashtra": "Mumbai",
    "gujarat": "Ahmedabad",
    "rajasthan": "Jaipur",
    "madhya pradesh": "Bhopal",
    "uttar pradesh": "Lucknow",
    "bihar": "Patna",
    "west bengal": "Kolkata",
    "odisha": "Bhubaneswar",
    "chhattisgarh": "Raipur",
    "jharkhand": "Ranchi",
    "uttarakhand": "Dehradun",
    "himachal pradesh": "Shimla",
    "punjab": "Chandigarh",
    "haryana": "Chandigarh",
    "delhi": "Delhi",
    "jammu kashmir": "Srinagar",
    "ladakh": "Leh",
    "puducherry": "Puducherry",
    "chandigarh": "Chandigarh",
    "daman diu": "Daman",
    "dadra nagar haveli": "Silvassa",
    "lakshadweep": "Kavaratti",
    "andaman nicobar": "Port Blair",
  };

  // Check if destination name is directly in mappings (case-insensitive)
  if (cityMappings[normalizedName]) {
    return cityMappings[normalizedName];
  }

  // Also check the original case
  if (cityMappings[destinationName]) {
    return cityMappings[destinationName];
  }

  // Try to extract city name from common patterns
  // Pattern 1: "City Name Description" -> "City Name"
  const cityPattern = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/;
  const match = destinationName.match(cityPattern);
  if (match) {
    return match[1];
  }

  // Pattern 2: Split by spaces and take first 1-2 words that look like city names
  const words = destinationName.split(' ');
  if (words.length >= 1) {
    // If first word ends with common city suffixes or is capitalized
    if (words[0].match(/^(?:[A-Z][a-z]+|Delhi|Mumbai|Bangalore|Chennai|Hyderabad|Pune|Ahmedabad|Jaipur|Kolkata|Surat|Kanpur|Nagpur|Indore|Thane|Bhubaneswar|Visakhapatnam|Vijayawada|Guntur|Nellore|Rajahmundry|Kakinada|Tirupati|Anantapur|Kadapa|Chittoor|Eluru|Ongole|Nandyal|Machilipatnam|Adoni|Tenali|Proddatur|Chirala|Bapatla|Jaggayyapeta|Pedana|Tadepalligudem|Mangalagiri|Sattenapalle|Vinukonda|Narasaraopet|Siddipet|Miryalaguda|Suryapet|Jangaon|Bhuvanagiri|Warangal|Nizamabad|Karimnagar|Ramagundam|Khammam|Mahbubnagar|Nalgonda|Wanaparthy|Gadwal|Sadasivpet|Sangareddy|Medak|Siddipet|Nizamabad|Adilabad|Nirmal|Mancherial|Bellampalli|Bhainsa|Mandamarri|Asifabad|Kagaznagar|Sircilla|Jagtial|Koratla|Metpalli|Dharmapuri|Warangal|Hanamkonda|Kothagudem|Bhadrachalam|Palwancha|Sathupalli|Dammapeta|Manuguru|Yellandu|Khammam|Kothagudem|Sattupalli|Bhadrachalam|Palwancha|Dammapeta|Manuguru|Yellandu|Khammam|Kothagudem|Sattupalli|Bhadrachalam|Palwancha|Dammapeta|Manuguru|Yellandu)$/)) {
      return words[0];
    }
    // If first two words together look like a city
    if (words.length >= 2 && words[0].match(/^[A-Z][a-z]+$/) && words[1].match(/^[A-Z][a-z]+$/)) {
      return `${words[0]} ${words[1]}`;
    }
  }

  // Default fallback - return the original name and hope for the best
  return destinationName;
};

interface WeatherWidgetProps {
  location?: LocationData | null;
  latitude?: number; // Keep for backward compatibility
  longitude?: number; // Keep for backward compatibility
  cityName?: string; // Primary method for fetching weather
  city?: string; // Direct city field from destination
  className?: string;
}

export default function WeatherWidget({
  location,
  latitude,
  longitude,
  cityName,
  city,
  className = "",
}: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      // Priority: city prop > cityName prop > location.city > extracted city from cityName
      const lat = location?.latitude || latitude;
      const lon = location?.longitude || longitude;

      // Determine the city to use for weather fetching
      let cityToUse: string | undefined;

      if (city) {
        // Extract city from city prop if it's a descriptive name
        cityToUse = extractCityName(city);
      } else if (cityName) {
        // Extract city from cityName if it's a descriptive name
        cityToUse = extractCityName(cityName);
      } else if (location?.city) {
        // Use location city as fallback, cleaned
        cityToUse = location.city.split(',')[0].trim();
      }

      if (!cityToUse && (!lat || !lon)) return;

      setLoading(true);
      setError(null);

      try {
        let weatherData: WeatherData;

        // Try to fetch by city name first (primary method)
        if (cityToUse) {
          weatherData = await weatherService.getWeatherByCity(cityToUse);
        } else {
          // Fallback to coordinates
          weatherData = await weatherService.getWeatherByCoordinates(lat!, lon!);
        }

        setWeather(weatherData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Weather unavailable");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location, latitude, longitude, cityName, city]);

  const getWeatherIcon = (iconCode: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      "01d": <Sun className="w-8 h-8 text-yellow-400" />, // Clear sky day
      "01n": <Sun className="w-8 h-8 text-yellow-300" />, // Clear sky night
      "02d": <Cloud className="w-8 h-8 text-gray-400" />, // Few clouds day
      "02n": <Cloud className="w-8 h-8 text-gray-400" />, // Few clouds night
      "03d": <Cloud className="w-8 h-8 text-gray-500" />, // Scattered clouds
      "03n": <Cloud className="w-8 h-8 text-gray-500" />, // Scattered clouds
      "04d": <Cloud className="w-8 h-8 text-gray-600" />, // Broken clouds
      "04n": <Cloud className="w-8 h-8 text-gray-600" />, // Broken clouds
      "09d": <CloudRain className="w-8 h-8 text-blue-400" />, // Shower rain
      "09n": <CloudRain className="w-8 h-8 text-blue-400" />, // Shower rain
      "10d": <CloudRain className="w-8 h-8 text-blue-500" />, // Rain
      "10n": <CloudRain className="w-8 h-8 text-blue-500" />, // Rain
      "11d": <CloudRain className="w-8 h-8 text-purple-500" />, // Thunderstorm
      "11n": <CloudRain className="w-8 h-8 text-purple-500" />, // Thunderstorm
      "13d": <Cloud className="w-8 h-8 text-blue-200" />, // Snow
      "13n": <Cloud className="w-8 h-8 text-blue-200" />, // Snow
      "50d": <Cloud className="w-8 h-8 text-gray-300" />, // Mist
      "50n": <Cloud className="w-8 h-8 text-gray-300" />, // Mist
    };

    return iconMap[iconCode] || <Cloud className="w-8 h-8 text-gray-400" />;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 ${className}`}
      >
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-white/70 animate-spin mr-2" />
          <span className="text-white/70">Loading...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-xl p-6 ${className}`}
      >
        <div className="flex items-center justify-center text-red-400">
          <Cloud className="w-6 h-6 mr-2" />
          <span>{error}</span>
        </div>
      </motion.div>
    );
  }

  if (!weather) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {getWeatherIcon(weather.icon)}
          <div>
            <h3 className="text-lg font-semibold text-white">{weather.city}</h3>
            <p className="text-white/70 capitalize">{weather.description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center text-white">
            <Thermometer className="w-4 h-4 mr-1" />
            <span className="text-2xl font-bold">{weather.temperature}°C</span>
          </div>
          <div className="flex items-center text-white/70 mt-1 space-x-3">
            <div className="flex items-center">
              <Wind className="w-4 h-4 mr-1" />
              <span className="text-sm">{weather.windSpeed} km/h</span>
            </div>
            <div className="flex items-center">
              <Droplets className="w-4 h-4 mr-1" />
              <span className="text-sm">{weather.humidity}%</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
