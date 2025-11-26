import { useState, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Thermometer, Droplets, Cloud, MapPin, Users } from "lucide-react";
import toast from "react-hot-toast";
import { type Destination } from "../lib/api";
import { weatherService, type WeatherData } from "../api/weather";

interface DestinationModalProps {
  destination: Destination | null;
  isOpen: boolean;
  onClose: () => void;
}

interface StaticReview {
  name: string;
  rating: number;
  comment: string;
}

const SectionCard = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) => (
  <div className={`rounded-2xl bg-white/5 border border-white/10 p-6 ${className}`}>
    <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-3">{title}</p>
    {children}
  </div>
);

const getReviewsForDestination = (destinationId: number): StaticReview[] => {
  const allReviews: { [key: number]: StaticReview[] } = {
    1: [
      {
        name: "Sarah Johnson",
        rating: 5,
        comment:
          "Absolutely breathtaking! The views were stunning and the experience was unforgettable.",
      },
    ],
    2: [
      {
        name: "Mike Chen",
        rating: 4,
        comment:
          "Great destination with amazing local culture. Highly recommend for nature lovers.",
      },
      {
        name: "Emma Davis",
        rating: 5,
        comment:
          "Perfect getaway spot. The scenery and hospitality made our trip memorable.",
      },
    ],
    3: [
      {
        name: "Alex Rodriguez",
        rating: 5,
        comment:
          "Exceeded all expectations! The hospitality and natural beauty were incredible.",
      },
      {
        name: "Lisa Wang",
        rating: 4,
        comment:
          "Wonderful experience with rich cultural insights. A must-visit destination.",
      },
      {
        name: "David Thompson",
        rating: 5,
        comment:
          "Truly magical place. Every moment was filled with wonder and discovery.",
      },
    ],
  };

  return allReviews[destinationId] || allReviews[2];
};

export default function DestinationModal({
  destination,
  isOpen,
  onClose,
}: DestinationModalProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && destination) {
      fetchWeather();
    }
  }, [isOpen, destination]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const originalPadding = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPadding;
    };
  }, [isOpen]);

  const fetchWeather = async () => {
    if (!destination) return;

    setWeatherLoading(true);
    setWeatherError(null);

    try {
      const cityName = destination.city || destination.name;
      const weatherData = await weatherService.getWeatherByCity(cityName);
      setWeather(weatherData);
    } catch (error) {
      setWeatherError(
        error instanceof Error ? error.message : "Failed to load weather",
      );
    } finally {
      setWeatherLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 transition-colors duration-200 ${
          i < rating ? "text-yellow-400 fill-current" : "text-white/30"
        }`}
      />
    ));
  };

  if (!destination) return null;

  const reviews = getReviewsForDestination(destination.destinationId);

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(destination.price);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4 py-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="relative w-full max-w-6xl bg-[#0b1110]/95 text-white rounded-3xl border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 z-20 p-3 rounded-full bg-black/40 hover:bg-black/60 transition-all duration-200"
            >
              <X size={18} />
            </button>

            <div className="relative w-full h-56 sm:h-64 lg:h-72 overflow-hidden">
              <img
                src={
                  destination.imageUrl ||
                  `https://via.placeholder.com/800x400?text=${destination.name}`
                }
                alt={destination.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                  {destination.country && (
                    <span className="inline-flex items-center gap-2">
                      <MapPin size={16} />
                      {destination.country}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2">
                    <Users size={16} />
                    From {formattedPrice}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                    {destination.name}
                  </h1>
                  {destination.city && destination.country && (
                    <p className="text-white/70">
                      {destination.city}, {destination.country}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    toast.success(
                      `Your trip to ${destination.name} has been booked successfully!`,
                    );
                    onClose();
                  }}
                  className="w-full lg:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition"
                >
                  Book Now
                </button>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <SectionCard title="Destination Insight">
                  <p className="text-white/80 leading-relaxed">
                    {destination.description ||
                      "Experience breathtaking views and create unforgettable memories at this amazing destination."}
                  </p>
                </SectionCard>

                <SectionCard title="Current Weather" className="min-h-[220px]">
                  {weatherLoading ? (
                    <div className="flex items-center justify-center py-6 text-white/80">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white" />
                      <span className="ml-3">Loading weather...</span>
                    </div>
                  ) : weatherError ? (
                    <div className="flex items-center gap-3 text-red-300">
                      <Cloud className="w-5 h-5" />
                      <span>{weatherError}</span>
                    </div>
                  ) : weather ? (
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-5xl">
                          {weather.icon.includes("01") || weather.icon.includes("02")
                            ? "☀️"
                            : weather.icon.includes("03") || weather.icon.includes("04")
                              ? "☁️"
                              : weather.icon.includes("09") || weather.icon.includes("10")
                                ? "🌧️"
                                : weather.icon.includes("11")
                                  ? "⛈️"
                                  : weather.icon.includes("13")
                                    ? "❄️"
                                    : "☁️"}
                        </div>
                        <div>
                          <p className="font-semibold text-white capitalize text-xl">
                            {weather.description}
                          </p>
                          <p className="text-white/70 text-sm">{weather.city}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-4xl font-bold text-white mb-2">
                          <Thermometer className="w-7 h-7 mr-2" />
                          {weather.temperature}°C
                        </div>
                        <div className="flex items-center text-white/70">
                          <Droplets className="w-4 h-4 mr-2" />
                          {weather.humidity}% humidity
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-white/70">Weather data unavailable right now.</p>
                  )}
                </SectionCard>
              </div>

              <SectionCard title={`Guest Reviews (${reviews.length})`}>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                  {reviews.map((review, index) => (
                    <motion.div
                      key={`${review.name}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-white">
                          {review.name}
                        </span>
                        <div className="flex items-center space-x-1">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {review.comment}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
