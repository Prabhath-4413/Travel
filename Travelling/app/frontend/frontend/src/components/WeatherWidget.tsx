import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Thermometer,
  Loader2,
} from "lucide-react";
import { weatherService, WeatherData } from "../api/weather";
import { LocationData } from "../lib/location";

interface WeatherWidgetProps {
  location?: LocationData | null;
  latitude?: number; // Keep for backward compatibility
  longitude?: number; // Keep for backward compatibility
  cityName?: string; // Keep for backward compatibility
  className?: string;
}

export default function WeatherWidget({
  location,
  latitude,
  longitude,
  cityName,
  className = "",
}: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      // Use location prop if provided, otherwise fall back to individual props
      const lat = location?.latitude || latitude;
      const lon = location?.longitude || longitude;
      const city = location?.city || cityName;

      if (!lat || !lon || !city) return;

      setLoading(true);
      setError(null);

      try {
        const weatherData = await weatherService.getWeatherByCoordinates(
          lat,
          lon,
          city,
        );
        setWeather(weatherData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load weather");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location, latitude, longitude, cityName]);

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
          <span className="text-white/70">Loading weather...</span>
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
          <div className="flex items-center text-white/70 mt-1">
            <Wind className="w-4 h-4 mr-1" />
            <span className="text-sm">{weather.windSpeed} km/h</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
