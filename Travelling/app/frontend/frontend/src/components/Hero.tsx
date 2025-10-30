import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface HeroProps {
  onExploreClick: () => void
}

const FloatingParticle = ({ delay = 0, x = 0, y = 0, size = 16, color = 'white/10' }: any) => (
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
      ease: 'easeInOut',
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
)

export default function Hero({ onExploreClick }: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])
  const heroScale = useTransform(scrollY, [0, 300], [1, 1.1])

  return (
    <section id="home" ref={heroRef} className="relative overflow-hidden pt-20">
      {/* Background layers */}
      <motion.div className="absolute inset-0" style={{ scale: heroScale }}>
        <div
          className="w-full h-[100vh] bg-cover bg-center bg-no-repeat relative overflow-hidden"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2000&h=1200&fit=crop")',
          }}
        >
          <div className="absolute inset-0 opacity-50 bg-gradient-to-br from-blue-900/60 via-purple-900/50 to-[#0e1512]/80" />
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1512] via-[#0e1512]/70 to-[#0e1512]/30" />
      </motion.div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <FloatingParticle
            key={i}
            delay={i * 0.5}
            x={Math.random() * 100}
            y={Math.random() * 100}
            size={12 + Math.random() * 20}
            color={
              ['white/10', 'blue-500/20', 'purple-500/20', 'pink-500/20'][Math.floor(Math.random() * 4)]
            }
          />
        ))}
      </div>

      {/* Main Content */}
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
          {/* Tagline */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium text-white border border-white/20 mb-6"
          >
            ✨ Discover Amazing Destinations
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6"
          >
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              Explore the World
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              with Us
            </span>

            {/* Animated Earth 🌍 with glow */}
            <motion.span
              className="ml-3 inline-block relative align-middle"
              animate={{
                rotate: [0, 360],
                y: [0, -8, 0],
              }}
              transition={{
                rotate: {
                  repeat: Infinity,
                  duration: 10,
                  ease: 'linear',
                },
                y: {
                  repeat: Infinity,
                  duration: 3,
                  ease: 'easeInOut',
                },
              }}
              style={{
                fontFamily: 'system-ui, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji',
                filter: 'none',
              }}
            >
              🌍
              {/* Glowing ring effect */}
              <motion.span
                className="absolute inset-0 rounded-full blur-md"
                style={{
                  background:
                    'radial-gradient(circle, rgba(80,180,255,0.6) 0%, rgba(160,100,255,0.3) 40%, transparent 80%)',
                  zIndex: -1,
                  width: '160%',
                  height: '160%',
                  top: '-30%',
                  left: '-30%',
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.6, 0.9, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Discover breathtaking destinations, book amazing trips, and create unforgettable memories
            with seamless booking and instant confirmations.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={onExploreClick}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-105"
            >
              Get Started
            </button>
            <a
              href="#about"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-all"
            >
              About Us
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-white/60"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>10,000+ Happy Travelers</span>
            </div>
            <div className="w-px h-4 bg-white/20 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span>⭐ 4.9/5 Rating</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
