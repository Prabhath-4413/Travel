import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
} from "framer-motion";
import {
  Search,
  Calendar,
  Plane,
  MapPin,
  Star,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Section,
} from "lucide-react";
import { destinationsAPI, type Destination } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import React from "react";
import PackageList from "../components/packages/PackageList";
import WeatherWidget from "../components/WeatherWidget";
import { DestinationCardSkeleton } from "../components/Skeleton";
import { useLocation as useUserLocation } from "../hooks/useLocation";

interface NavLink {
  id: string;
  label: string;
}

interface HeroSectionProps {
  onExploreClick: () => void;
}

interface HeroDestination {
  name: string;
  tagline: string;
  image: string;
  accent: string;
}

// Destination rotation data for the hero section
const HERO_DESTINATIONS: HeroDestination[] = [
  {
    name: "Goa",
    tagline: "Sun-kissed beaches and vibrant nightlife await you.",
    image:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=2000&h=1200&fit=crop",
    accent: "from-orange-300 via-pink-400 to-pink-600",
  },
  {
    name: "Kerala",
    tagline: "Serene backwaters and lush greenery to unwind.",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=2000&h=1200&fit=crop",
    accent: "from-teal-200 via-pink-300 to-pink-500",
  },
  {
    name: "Rajasthan",
    tagline: "Royal palaces and golden deserts full of heritage.",
    image:
      "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=2000&h=1200&fit=crop",
    accent: "from-amber-300 via-rose-400 to-pink-600",
  },
];

const FloatingParticle = ({
  delay = 0,
  x = 0,
  y = 0,
  size = 16,
  color = "white/10",
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{
      y: [y, y - 30, y],
      x: [x, x + 15, x],
      opacity: [0.3, 0.6, 0.3],
      rotate: [0, 180, 360],
    }}
    transition={{
      duration: 8 + delay * 2,
      repeat: Infinity,
      ease: "easeInOut",
      delay: delay,
    }}
    className="absolute rounded-full border border-white/20"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      width: size,
      height: size,
      backgroundColor: color,
    }}
  />
);

const NavBar = ({ activeSection, onScrollToSection, navLinks }: any) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#0e1512]/95 backdrop-blur-xl border-b border-white/10 shadow-lg"
          : "bg-[#0e1512]/40 backdrop-blur-md border-b border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <motion.div className="flex items-center gap-3 group">
            <motion.div
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              ✈
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              SuiteSavvy
            </span>
          </motion.div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link: NavLink) => (
              <button
                key={link.id}
                onClick={() => onScrollToSection(link.id)}
                className={`relative py-2 text-sm font-medium transition-colors ${
                  activeSection === link.id
                    ? "text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {link.label}
                {activeSection === link.id && (
                  <motion.div
                    layoutId="activeSection"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <a
              href="/login"
              className="px-6 py-2.5 text-white/80 hover:text-white transition-colors font-medium text-sm"
            >
              Login
            </a>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <a
                href="/register"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all text-sm"
              >
                Sign Up
              </a>
            </motion.div>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white/80 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </motion.button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden border-t border-white/10 bg-gradient-to-b from-white/5 to-transparent"
            >
              <div className="py-4 space-y-2">
                {navLinks.map((link: NavLink) => (
                  <motion.button
                    key={link.id}
                    onClick={() => {
                      onScrollToSection(link.id);
                      setMobileMenuOpen(false);
                    }}
                    whileHover={{ x: 5 }}
                    className={`block w-full text-left px-4 py-3 rounded-lg transition-all ${
                      activeSection === link.id
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

const HeroSection = ({ onExploreClick }: HeroSectionProps) => {
  // Parallax ref that feeds motion values for subtle depth
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 1.08]);

  // User location for weather widget
  const { location: userLocation } = useUserLocation();

  // Time-based greeting that refreshes every minute
  const [greeting, setGreeting] = useState("Welcome");

  // User city resolved from IP lookup
  const [city, setCity] = useState<string | null>(null);

  // Index that drives the rotating destination carousel
  const [currentDestinationIndex, setCurrentDestinationIndex] = useState(0);

  const currentDestination = HERO_DESTINATIONS[currentDestinationIndex];

  useEffect(() => {
    const computeGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good Morning";
      if (hour < 17) return "Good Afternoon";
      if (hour < 21) return "Good Evening";
      return "Good Night";
    };

    setGreeting(computeGreeting());
    const intervalId = window.setInterval(
      () => setGreeting(computeGreeting()),
      60 * 1000,
    );

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCity = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/", {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data?.city) setCity(data.city);
      } catch (error) {
        const isAbort = (error as Error).name === "AbortError";
        if (!isAbort) setCity(null);
      }
    };

    fetchCity();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const rotationInterval = window.setInterval(() => {
      setCurrentDestinationIndex(
        (prev) => (prev + 1) % HERO_DESTINATIONS.length,
      );
    }, 5000);

    return () => window.clearInterval(rotationInterval);
  }, []);

  return (
    <section id="home" ref={heroRef} className="relative overflow-hidden pt-20">
      {/* Fixed scenic background with parallax scale */}
      <motion.div className="absolute inset-0" style={{ scale: heroScale }}>
        <div
          className="w-full h-[100vh] bg-cover bg-center bg-no-repeat relative overflow-hidden"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=2000&h=1200&fit=crop")',
            backgroundAttachment: "fixed",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-900/55 to-slate-950/75" />
          <div className="absolute inset-0">
            <div className="absolute top-24 left-16 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-24 right-16 w-80 h-80 bg-pink-400/20 rounded-full blur-3xl" />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/45 to-slate-900/25" />
      </motion.div>

      {/* Floating particles for subtle motion accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <FloatingParticle
            key={i}
            delay={i * 0.5}
            x={Math.random() * 100}
            y={Math.random() * 100}
            size={12 + Math.random() * 20}
            color={
              ["white/10", "blue-500/20", "purple-500/20", "pink-500/20"][
                Math.floor(Math.random() * 4)
              ]
            }
          />
        ))}
      </div>

      {/* Hero copy and call-to-action stack */}
      <motion.div
        className="relative z-10 max-w-6xl mx-auto px-6 flex flex-col justify-center h-[100vh]"
        style={{ opacity: heroOpacity }}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Greeting chip with city context */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium text-slate-900 dark:text-white border border-white/40 dark:border-white/20 mb-6"
          >
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {greeting}
            {city ? `, ${city}` : "!"}
          </motion.div>

          {/* Headline with rotating destination focus */}
          <motion.h1
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 text-center"
          >
            <span className="block text-white drop-shadow-[0_12px_30px_rgba(30,41,59,0.55)]">
              Explore the World
            </span>
            <span className="block bg-gradient-to-r from-fuchsia-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
              with Us.
            </span>
          </motion.h1>

          {/* Destination name (removed background & shadow, clean text only) */}
          <AnimatePresence mode="wait">
            <motion.span
              key={currentDestination.name}
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -18, opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="mt-6 inline-flex"
            >
              <span
                className={`inline-flex items-center justify-center px-4 py-1 text-xl md:text-2xl lg:text-3xl font-semibold text-white`}
              >
                {currentDestination.name}
              </span>
            </motion.span>
          </AnimatePresence>

          {/* Destination tagline (removed background box & borders) */}
          <AnimatePresence mode="wait">
            <motion.p
              key={currentDestination.tagline}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.92, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-lg md:text-2xl text-white/90 mb-9 max-w-3xl mx-auto leading-relaxed"
            >
              {currentDestination.tagline}
            </motion.p>
          </AnimatePresence>

          {/* Action buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onExploreClick}
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg px-8 py-4 font-semibold text-white ring-2 ring-white/40 hover:ring-pink-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/70 transition-[transform,box-shadow]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-transform duration-300 group-hover:scale-110" />
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/20 transition-opacity duration-300" />
              <span className="relative flex items-center gap-2">
                Plan My Trip
                <Plane className="w-5 h-5" />
              </span>
            </motion.button>
            <a
              href="#about"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/75 dark:bg-white/10 text-slate-900 dark:text-white font-semibold rounded-lg border border-white/40 dark:border-white/20 hover:bg-white/90 dark:hover:bg-white/15 ring-1 ring-white/40 hover:ring-pink-200/60 transition-colors"
            >
              Explore Our Story
            </a>
          </motion.div>

          {/* Social proof badges */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-white/80"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span>10,000+ Happy Travelers</span>
            </div>
            <div className="w-px h-4 bg-white/30 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>Rated 4.9/5 by globe trotters</span>
            </div>
          </motion.div>

          {/* Weather Widget */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="mt-12"
          >
            <WeatherWidget
              location={userLocation}
              className="w-full max-w-sm mx-auto"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

const AboutSection = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.2 });

  return (
    <section
      id="about"
      className="relative py-20 md:py-32 px-6 overflow-hidden"
      style={{
        backgroundImage:
          'url("https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=2000&h=1200&fit=crop")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "scroll",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#0e1512]/85 via-[#0e1512]/75 to-[#0e1512]/85 pointer-events-none" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
        >
          {/* Left Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                  About SuiteSavvy
                </span>
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="space-y-4 text-lg text-white/80 leading-relaxed"
            >
              <p>
                SuiteSavvy is your ultimate travel companion, dedicated to
                transforming the way you explore the world. We believe that
                travel should be effortless, memorable, and enriching for
                everyone.
              </p>
              <p>
                With over a decade of experience in the travel industry, our
                team has crafted a platform that combines cutting-edge
                technology with personalized service to deliver unforgettable
                experiences.
              </p>
              <p>
                From discovering hidden gems to booking seamless accommodations,
                we're committed to making your journey extraordinary.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="grid grid-cols-3 gap-4 mt-8"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:border-white/30 transition-all">
                <div className="text-2xl font-bold text-blue-400">50K+</div>
                <div className="text-sm text-white/60">Destinations</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:border-white/30 transition-all">
                <div className="text-2xl font-bold text-purple-400">100K+</div>
                <div className="text-sm text-white/60">Happy Travelers</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:border-white/30 transition-all">
                <div className="text-2xl font-bold text-pink-400">24/7</div>
                <div className="text-sm text-white/60">Support</div>
              </div>
            </motion.div>
          </div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-2xl blur-2xl" />
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=600&fit=crop"
              alt="About SuiteSavvy"
              className="relative rounded-2xl w-full h-auto shadow-2xl border border-white/10"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const StepsSection = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.2 });
  const id = "how-it-works";

  const steps = [
    {
      icon: Search,
      title: "Choose Your Destination",
      description:
        "Browse through our curated collection of breathtaking destinations with real-time images and detailed information.",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Calendar,
      title: "Book Your Trip",
      description:
        "Select your preferred dates and complete your booking with secure payment and instant confirmation.",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: Plane,
      title: "Enjoy Your Journey",
      description:
        "Receive confirmation and travel support. Your adventure awaits with unforgettable experiences!",
      color: "from-pink-500 to-pink-600",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative py-20 md:py-32 px-6 overflow-hidden"
      style={{
        backgroundImage:
          'url("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=2000&h=1200&fit=crop")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "scroll",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e1512]/70 via-[#0e1512]/80 to-[#0e1512]/70 pointer-events-none" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              How It Works
            </span>
          </motion.h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Start your journey in three simple steps with our intuitive booking
            process
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                }
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="group relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000" />

                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>

                  <div className="absolute -left-6 top-8 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg font-bold text-white/50">
                    {index + 1}
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4">
                    {step.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    {step.description}
                  </p>

                  {index < steps.length - 1 && (
                    <motion.div
                      className="hidden md:block absolute -right-10 top-1/2 -translate-y-1/2"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <svg
                        className="w-6 h-6 text-white/30"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const DestinationCard = ({ destination, onCardClick, index }: any) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={onCardClick}
      className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#0e1512] via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-500/10 to-purple-600/10">
        <img
          src={
            destination.imageUrl ||
            "https://via.placeholder.com/400x300?text=Destination"
          }
          alt={destination.name}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
        />
        {!imageLoaded && (
          <div className="absolute inset-0 bg-white/5 animate-pulse" />
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1 }}
          className="absolute top-4 right-4 bg-blue-500/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 z-20"
        >
          <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
          4.8
        </motion.div>
      </div>

      <div className="p-6 relative z-10">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
          {destination.name}
        </h3>

        <p className="text-white/70 text-sm mb-4 line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
          {destination.description || "Discover this amazing destination"}
        </p>

        <div className="flex items-start gap-2 mb-4 text-white/60 text-sm">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
          <span>
            {destination.city
              ? `${destination.city}, ${destination.country}`
              : destination.country || "Popular destination"}
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex flex-col">
            <span className="text-white/60 text-xs">From</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ₹{destination.price.toLocaleString("en-IN")}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, x: 3 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all text-sm"
          >
            View →
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const FeaturedDestinationsPreview: React.FC<{ onViewAll: () => void }> = ({
  onViewAll,
}) => {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.2 });

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const data = await destinationsAPI.getAll();
        setDestinations(data.slice(0, 6));
      } catch (err) {
        console.error("Error loading destinations:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDestinations();
  }, []);

  const handleDestinationClick = (destination: Destination) => {
    const userToken = localStorage.getItem("token");
    if (!userToken) {
      navigate("/login", {
        state: {
          redirectTo: "/booking",
          selectedDestination: destination,
        },
      });
    } else {
      navigate("/booking", {
        state: { selectedDestination: destination },
      });
    }
  };

  return (
    <section
      id="featured-preview"
      ref={containerRef}
      className="relative py-20 md:py-32 px-6 overflow-hidden"
      style={{
        backgroundImage:
          'url("https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=2000&h=1200&fit=crop")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "scroll",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#0e1512]/90 via-[#0e1512]/85 to-[#0e1512]/90 pointer-events-none" />
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={
              isInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }
            }
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium text-white border border-white/20 mb-6"
          >
            ✨ Trending Now
          </motion.div>

          <motion.h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              Discover Top Destinations
            </span>
          </motion.h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Explore breathtaking locations handpicked for unforgettable
            experiences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <DestinationCardSkeleton key={i} />
            ))
          ) : destinations.length > 0 ? (
            destinations.map((dest, index) => (
              <DestinationCard
                key={dest.destinationId}
                destination={dest}
                onCardClick={() => handleDestinationClick(dest)}
                index={index}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-white/60">No destinations available</p>
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          <motion.button
            onClick={onViewAll}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all"
            type="button"
          >
            View All Destinations →
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

const DestinationsSection = () => {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState<
    "all" | "budget" | "mid" | "luxury"
  >("all");
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.2 });

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        setLoading(true);
        const data = await destinationsAPI.getAll();
        setDestinations(data);
        setError(null);
      } catch (err) {
        console.error("Error loading destinations:", err);
        setError("Failed to load destinations");
        setDestinations([]);
      } finally {
        setLoading(false);
      }
    };
    loadDestinations();
  }, []);

  const filteredDestinations = destinations.filter((dest) => {
    const matchesSearch =
      dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dest.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPrice =
      priceFilter === "all"
        ? true
        : priceFilter === "budget"
          ? dest.price < 5000
          : priceFilter === "mid"
            ? dest.price >= 5000 && dest.price < 15000
            : dest.price >= 15000;

    return matchesSearch && matchesPrice;
  });

  const handleDestinationClick = (destination: Destination) => {
    const userToken = localStorage.getItem("token");

    if (!userToken) {
      navigate("/login", {
        state: {
          redirectTo: "/booking",
          selectedDestination: destination,
        },
      });
    } else {
      navigate("/booking", {
        state: { selectedDestination: destination },
      });
    }
  };

  return (
    <section
      id="featured-destinations"
      ref={containerRef}
      className="relative py-20 md:py-32 px-6 overflow-hidden"
      style={{
        backgroundImage:
          'url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=2400&h=1400&fit=crop")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e1512]/80 via-[#0e1512]/85 to-[#0e1512]/80 pointer-events-none" />
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              Featured Destinations
            </span>
          </motion.h2>
          <p className="text-lg text-white/70 max-w-3xl mx-auto leading-relaxed">
            Explore India’s best beaches, mountains, and city escapes carefully
            curated for unforgettable trips. Every place is handpicked for great
            value, authentic experiences, and stunning views. Find your next
            adventure and book it in minutes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search destinations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500/50 focus:bg-white/15 transition-all"
            />
          </div>

          <select
            value={priceFilter}
            onChange={(e) =>
              setPriceFilter(e.target.value as typeof priceFilter)
            }
            className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/15 transition-all"
          >
            <option value="all">All Prices</option>
            <option value="budget">Budget (₹ &lt; 5000)</option>
            <option value="mid">Mid-Range (₹ 5000–15000)</option>
            <option value="luxury">Luxury (₹ &gt; 15000)</option>
          </select>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 mb-8 text-center"
          >
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <DestinationCardSkeleton key={i} />
            ))
          ) : filteredDestinations.length > 0 ? (
            filteredDestinations.map((destination, index) => (
              <DestinationCard
                key={destination.destinationId}
                destination={destination}
                onCardClick={() => handleDestinationClick(destination)}
                index={index}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-12"
            >
              <p className="text-white/60 text-lg">
                No destinations found matching your filters
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

const TestimonialsSection = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.2 });
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: "Priya Sharma",
      avatar: "https://i.pravatar.cc/150?img=1",
      feedback:
        "Amazing experience! The booking process was seamless and the destinations were breathtaking. Highly recommended!",
      rating: 5,
    },
    {
      id: 2,
      name: "Rajesh Kumar",
      avatar: "https://i.pravatar.cc/150?img=3",
      feedback:
        "Best travel platform I've used. Real-time images and instant bookings made planning so easy!",
      rating: 5,
    },
    {
      id: 3,
      name: "Ananya Patel",
      avatar: "https://i.pravatar.cc/150?img=5",
      feedback:
        "Discovered hidden gems across India. The variety and competitive pricing is unbeatable!",
      rating: 5,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="testimonials"
      ref={containerRef}
      className="relative py-20 md:py-32 px-6 overflow-hidden"
      style={{
        backgroundImage:
          'url("https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=2000&h=1200&fit=crop")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "scroll",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e1512]/85 via-[#0e1512]/80 to-[#0e1512]/85 pointer-events-none" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              What Travelers Say
            </span>
          </motion.h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Join thousands of satisfied travelers who discovered amazing
            experiences with us
          </p>
        </motion.div>

        <div className="hidden md:grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ scale: 1.03, y: -5 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-6 hover:border-white/20 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-4 right-4 text-white/10 text-5xl font-serif">
                "
              </div>

              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>

              <p className="text-white/80 mb-6 leading-relaxed relative z-10">
                {testimonial.feedback}
              </p>

              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full border-2 border-white/20"
                  loading="lazy"
                />
                <div>
                  <div className="font-semibold text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-white/60 flex items-center gap-1">
                    <svg
                      className="w-4 h-4 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified Traveler
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="md:hidden relative">
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonialIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-6">
                  <div className="absolute top-4 right-4 text-white/10 text-5xl font-serif">
                    "
                  </div>
                  <div className="flex gap-1 mb-4">
                    {[
                      ...Array(testimonials[currentTestimonialIndex].rating),
                    ].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-yellow-400 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-white/80 mb-6 leading-relaxed">
                    {testimonials[currentTestimonialIndex].feedback}
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonials[currentTestimonialIndex].avatar}
                      alt={testimonials[currentTestimonialIndex].name}
                      className="w-12 h-12 rounded-full border-2 border-white/20"
                      loading="lazy"
                    />
                    <div>
                      <div className="font-semibold text-white">
                        {testimonials[currentTestimonialIndex].name}
                      </div>
                      <div className="text-sm text-white/60">
                        Verified Traveler
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonialIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentTestimonialIndex
                    ? "bg-blue-500 w-8"
                    : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const CTASection = ({ onExploreClick }: any) => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.3 });

  return (
    <section
      id="cta"
      ref={containerRef}
      className="relative py-20 md:py-32 px-6 overflow-hidden"
      style={{
        backgroundImage:
          'url("https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=2000&h=1200&fit=crop")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "scroll",
      }}
    >
      <div className="absolute inset-0 bg-[#0e1512]/85 pointer-events-none" />
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative overflow-hidden bg-gradient-to-br from-blue-500/20 via-purple-600/20 to-pink-500/20 backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-16"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
          </div>

          <div className="relative z-10 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={
                isInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }
              }
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-6"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              <span>10,000+ travelers already joined</span>
            </motion.div>

            <motion.h3
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight"
            >
              Ready to Start Your{" "}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Journey?
              </span>
            </motion.h3>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/70 text-lg mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Create your account and start planning your next adventure today.
              Instant bookings, secure payments, and 24/7 support await you.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <a
                  href="/register"
                  className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg relative overflow-hidden transition-all transform hover:shadow-2xl hover:shadow-blue-500/50 inline-flex items-center justify-center gap-2"
                >
                  <span className="relative z-10">Sign Up Now</span>
                  <svg
                    className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </a>
              </motion.div>

              <motion.button
                onClick={onExploreClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-medium rounded-lg border border-white/20 hover:bg-white/20 transition-all transform"
              >
                Explore Destinations
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm text-white/50 pt-8 border-t border-white/10"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Secure Booking</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Instant Confirmation</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-purple-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>24/7 Support</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const FooterSection = () => {
  const footerRef = useRef(null);
  const isInView = useInView(footerRef, { once: false, amount: 0.2 });

  const footerLinks = {
    company: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Blog", href: "#" },
    ],
    support: [
      { label: "Help Center", href: "#" },
      { label: "Contact Us", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
    destinations: [
      { label: "Popular Places", href: "#" },
      { label: "New Destinations", href: "#" },
      { label: "Guides", href: "#" },
      { label: "Travel Tips", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  return (
    <footer
      ref={footerRef}
      className="relative bg-[#0a0f0c] border-t border-white/10 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
              },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-16"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
            className="lg:col-span-2"
          >
            <p className="text-white/70 mb-6 leading-relaxed">
              Discover and book amazing travel experiences across India. From
              beaches to mountains, your next adventure awaits.
            </p>

            <div className="space-y-3">
              <motion.div
                whileHover={{ x: 5 }}
                className="flex items-center gap-3 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <Mail className="w-5 h-5 text-blue-400" />
                <span>hello@suitsavvy.com</span>
              </motion.div>
              <motion.div
                whileHover={{ x: 5 }}
                className="flex items-center gap-3 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <Phone className="w-5 h-5 text-blue-400" />
                <span>+91 9876543210 TRAVEL</span>
              </motion.div>
              <motion.div
                whileHover={{ x: 5 }}
                className="flex items-center gap-3 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <MapPin className="w-5 h-5 text-blue-400" />
                <span>Mumbai, India</span>
              </motion.div>
            </div>
          </motion.div>

          {Object.entries(footerLinks).map(([key, links]) => (
            <motion.div
              key={key}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
              }}
              className="space-y-4"
            >
              <h3 className="text-lg font-bold text-white mb-6 capitalize">
                {key}
              </h3>
              {links.map((link) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  whileHover={{ x: 5 }}
                  className="block text-white/70 hover:text-white transition-colors text-sm"
                >
                  {link.label}
                </motion.a>
              ))}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, delay: 0.5 },
            },
          }}
          className="border-t border-white/10 pt-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">
                Subscribe to Our Newsletter
              </h3>
              <p className="text-white/70 text-sm mb-4">
                Get the latest travel deals and destination guides
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500/50 transition-all text-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all text-sm"
                >
                  Subscribe
                </motion.button>
              </div>
            </div>

            <div className="md:text-right">
              <h3 className="text-lg font-bold text-white mb-4">Follow Us</h3>
              <p className="text-white/70 text-sm mb-4">
                Connect with us on social media
              </p>
              <div className="flex gap-4 md:justify-end">
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <motion.a
                    key={label}
                    href={href}
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-blue-500/20 hover:border-blue-500/50 transition-all"
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white/60 text-sm">
            <div className="flex items-center gap-4">
              <span>© 2024 SuiteSavvy. All rights reserved.</span>
            </div>

            <div className="flex items-center gap-6">
              <motion.a
                href="#"
                whileHover={{ color: "#fff" }}
                className="text-white/60 hover:text-white transition-colors"
              >
                Privacy Policy
              </motion.a>
              <div className="w-px h-4 bg-white/20" />
              <motion.a
                href="#"
                whileHover={{ color: "#fff" }}
                className="text-white/60 hover:text-white transition-colors"
              >
                Terms of Service
              </motion.a>
              <div className="w-px h-4 bg-white/20" />
              <motion.a
                href="#"
                whileHover={{ color: "#fff" }}
                className="text-white/60 hover:text-white transition-colors"
              >
                Cookie Settings
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default function LandingPage() {
  const { state } = useLocation() as {
    state?: { notification?: { type: "user" | "admin"; message: string } };
  };
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location: userLocation } = useUserLocation();
  const [activeSection, setActiveSection] = useState("home");
  const [notification, setNotification] = useState<{
    type: "user" | "admin";
    message: string;
  } | null>(null);

  const navLinks: NavLink[] = [
    { id: "home", label: "Home" },
    { id: "about", label: "About Us" },
    { id: "how-it-works", label: "How It Works" },
    { id: "featured-preview", label: "Featured" },
    { id: "featured-packages", label: "Packages" },
    { id: "featured-destinations", label: "Destinations" },
    { id: "testimonials", label: "Testimonials" },
    { id: "cta", label: "Get Started" },
  ];

  useEffect(() => {
    if (state?.notification) {
      setNotification(state.notification);
      navigate(".", { replace: true });
    }
  }, [state?.notification, navigate]);

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(() => setNotification(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const sections = [
          "home",
          "about",
          "how-it-works",
          "featured-preview",
          "featured-packages",
          "featured-destinations",
          "testimonials",
          "cta",
        ];
        const scrollPosition = window.scrollY + 100;
        for (const section of sections) {
          const element = document.getElementById(section);
          if (element) {
            const { offsetTop, offsetHeight } = element;
            if (
              scrollPosition >= offsetTop &&
              scrollPosition < offsetTop + offsetHeight
            ) {
              setActiveSection(section);
              break;
            }
          }
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handleExploreClick = () => {
    const targetState = { scrollTo: "destinations" };
    if (user) {
      navigate("/dashboard", { state: targetState });
    } else {
      navigate("/login", {
        state: { redirectTo: "/dashboard", redirectState: targetState },
      });
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0e1512] text-white overflow-x-hidden relative"
      style={{
        backgroundImage:
          'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2000&h=1200&fit=crop")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "scroll",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Background overlay for the entire page */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0e1512]/40 via-[#0e1512]/60 to-[#0e1512]/80 pointer-events-none" />

      <div className="relative z-10">
        <NavBar
          activeSection={activeSection}
          onScrollToSection={scrollToSection}
          navLinks={navLinks}
        />

        <HeroSection onExploreClick={handleExploreClick} />

        <AboutSection />

        <StepsSection />

        <FeaturedDestinationsPreview onViewAll={handleExploreClick} />

        <section
          id="featured-packages"
          className="relative py-20 md:py-28 px-6"
          style={{
            backgroundImage:
              'linear-gradient(rgba(14,21,18,0.7), rgba(14,21,18,0.7)), url("https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=2000&q=80")',
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "scroll",
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm text-white/70"
              >
                ✨ Curated Experiences
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl md:text-5xl font-bold"
              >
                <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                  Travel Packages for Every Explorer
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg text-white/70 max-w-2xl mx-auto"
              >
                Browse thoughtfully crafted journeys combining stunning
                destinations, effortless planning, and exclusive perks.
              </motion.p>
            </div>

            <div className="relative z-10">
              <PackageList readOnly />
            </div>
          </div>
        </section>

        <DestinationsSection />

        <TestimonialsSection />

        <CTASection onExploreClick={handleExploreClick} />

        <FooterSection />
      </div>

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 right-4 z-40"
        >
          <div
            className={`px-6 py-4 rounded-lg text-white shadow-lg ${
              notification.type === "user" ? "bg-green-500" : "bg-blue-500"
            }`}
          >
            {notification.message}
          </div>
        </motion.div>
      )}
    </div>
  );
}
