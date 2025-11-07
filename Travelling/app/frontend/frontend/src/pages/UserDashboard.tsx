import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import {
  bookingsAPI,
  shortestPathAPI,
  tripCancellationAPI,
  type Destination,
  type Booking,
  type ShortestPathResponse
} from '../lib/api'
import { useDestinations } from '../contexts/DestinationsContext'
import BookingForm from '../components/booking/BookingForm'
import EmailConfirmationModal from '../components/booking/EmailConfirmationModal'
import { CancellationBadge, CancellationDetails, CancellationCenter } from '../components/cancellations'
import RouteMap from '../components/maps/RouteMap'
import Feedback from '../components/Feedback'
import PackageList from '../components/packages/PackageList'
import type { TravelPackage } from '../api/packages'

const FALLBACK_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80'
]

const NATURE_HERO_IMAGE = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80'

const SECTION_BACKGROUND_IMAGES = {
  destinations: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
  metrics: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
  stories: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80',
  packages: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80',
  planner: 'https://images.unsplash.com/photo-1523786040450-1efba3c496d8?auto=format&fit=crop&w=1600&q=80'
} as const

const DASHBOARD_BACKGROUND_IMAGE = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=80'

const FloatingParticle: React.FC<{ delay?: number; x?: number; y?: number; size?: number; color?: string }> = ({ delay = 0, x = 0, y = 0, size = 16, color = 'white/10' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{
      y: [y, y - 30, y],
      x: [x, x + 15, x],
      opacity: [0.3, 0.6, 0.3],
      rotate: [0, 180, 360]
    }}
    transition={{
      duration: 8 + delay * 2,
      repeat: Infinity,
      ease: 'easeInOut',
      delay
    }}
    className="absolute rounded-full border border-white/20"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      width: size,
      height: size,
      backgroundColor: color
    }}
  />
)

const NAV_LINKS = [
  { id: 'overview', label: 'Overview' },
  { id: 'destinations', label: 'Destinations' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'stories', label: 'Stories' },
  { id: 'packages', label: 'Packages' },
  { id: 'planner', label: 'Planner' }
]

const DashboardNav: React.FC<{
  activeSection: string
  onScrollToSection: (id: string) => void
  onOpenCancellations: () => void
  onLogout: () => void
  userName?: string | null
}> = ({ activeSection, onScrollToSection, onOpenCancellations, onLogout, userName }) => (
  <motion.nav
    initial={{ y: -100 }}
    animate={{ y: 0 }}
    className="fixed top-0 left-0 right-0 z-50 bg-[#0e1512]/85 backdrop-blur-lg border-b border-white/10"
  >
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex items-center justify-between h-20">
        <motion.div className="flex items-center gap-3 group">
          <motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold transition-all group-hover:shadow-[0_0_25px_rgba(59,130,246,0.45)]"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            ✈
          </motion.div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">SuiteSavvy</span>
        </motion.div>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => onScrollToSection(link.id)}
              className={`relative py-2 text-sm font-medium transition-colors ${
                activeSection === link.id ? 'text-white' : 'text-white/70 hover:text-white'
              }`}
              type="button"
            >
              {link.label}
              {activeSection === link.id && (
                <motion.div
                  layoutId="dashboardNavActive"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {userName && <span className="text-sm text-white/70">Hi, {userName}</span>}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenCancellations}
            className="px-4 py-2.5 rounded-lg border border-white/20 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            type="button"
          >
            Cancellations
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-lg shadow-blue-500/30"
            type="button"
          >
            Logout
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onScrollToSection('menu')}
          className="md:hidden p-2 text-white/80 hover:text-white transition-colors"
          aria-label="Toggle menu"
          type="button"
        >
          ☰
        </motion.button>
      </div>
    </div>
  </motion.nav>
)

const SearchFilterBar: React.FC<{
  query: string
  setQuery: (q: string) => void
  country: string
  setCountry: (c: string) => void
  priceMin: number | undefined
  setPriceMin: (v?: number) => void
  priceMax: number | undefined
  setPriceMax: (v?: number) => void
  clearFilters: () => void
  countries: string[]
  dark: boolean
}> = ({ query, setQuery, country, setCountry, priceMin, setPriceMin, priceMax, setPriceMax, clearFilters, countries, dark }) => {
  const inputClass = dark
    ? 'bg-white/10 border-white/10 text-white placeholder-white/60'
    : 'bg-[#f4f7f2] border-[#2b5f49]/25 text-[#103b2c] placeholder-[#2b5f49]/70'
  const selectClass = dark ? 'bg-white/10 border-white/10 text-white' : 'bg-[#f4f7f2] border-[#2b5f49]/25 text-[#103b2c]'
  const buttonClass = dark ? 'border-white/20 text-white hover:bg-white/10' : 'border-[#2b5f49]/25 text-[#1f5b46] hover:text-[#0f3a2c]'
  return (
    <div
      className={`rounded-3xl border backdrop-blur-sm flex flex-col md:flex-row gap-3 items-center px-5 py-4 w-full ${
        dark ? 'bg-white/5 border-white/10 text-white' : 'bg-[#f4f7f2]/90 border-[#2b5f49]/20 text-[#103b2c]'
      }`}
    >
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search wild escapes..."
        className={`flex-1 min-w-[160px] rounded-2xl px-4 py-3 focus:outline-none transition ${inputClass}`}
      />
      <select value={country} onChange={(e) => setCountry(e.target.value)} className={`rounded-2xl px-4 py-3 focus:outline-none ${selectClass}`}>
        <option value="">All lands</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        type="number"
        value={priceMin ?? ''}
        onChange={(e) => setPriceMin(e.target.value === '' ? undefined : Number(e.target.value))}
        placeholder="Min"
        className={`w-24 rounded-2xl px-4 py-3 focus:outline-none ${inputClass}`}
      />
      <input
        type="number"
        value={priceMax ?? ''}
        onChange={(e) => setPriceMax(e.target.value === '' ? undefined : Number(e.target.value))}
        placeholder="Max"
        className={`w-24 rounded-2xl px-4 py-3 focus:outline-none ${inputClass}`}
      />
      <button onClick={clearFilters} className={`px-4 py-3 rounded-2xl border transition ${buttonClass}`} type="button">
        Clear
      </button>
    </div>
  )
}

const FAB: React.FC<{ onOpenBooking: () => void; onOpenCancellations: () => void; onOpenFeedback: () => void }> = ({
  onOpenBooking,
  onOpenCancellations,
  onOpenFeedback
}) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="fixed right-6 bottom-6 z-50">
      <div className="flex flex-col items-end gap-3">
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} className="flex flex-col gap-3">
              <button
                onClick={() => {
                  onOpenFeedback()
                  setOpen(false)
                }}
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:bg-white/15 transition"
                type="button"
                title="Send feedback"
              >
                💬 Feedback
              </button>
              <button
                onClick={() => {
                  onOpenCancellations()
                  setOpen(false)
                }}
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:bg-white/15 transition"
                type="button"
                title="Cancellation center"
              >
                ❌ Cancellations
              </button>
              <button
                onClick={() => {
                  onOpenBooking()
                  setOpen(false)
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold shadow-[0_15px_35px_rgba(59,130,246,0.35)]"
                type="button"
                title="Book adventure"
              >
                ✈️ Book Trip
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setOpen((s) => !s)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_18px_45px_rgba(59,130,246,0.35)] border border-white/20 flex items-center justify-center text-white text-3xl"
          type="button"
          title="Quick actions"
        >
          {open ? '✕' : '+'}
        </button>
      </div>
    </div>
  )
}

export default function UserDashboard(): JSX.Element {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { destinations, refresh: refreshDestinations } = useDestinations()
  
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDestinations, setSelectedDestinations] = useState<Destination[]>([])
  const [shortestPath, setShortestPath] = useState<ShortestPathResponse | null>(null)
  const [optimizedDestinations, setOptimizedDestinations] = useState<Destination[]>([])
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationContext, setConfirmationContext] = useState<'booking' | 'cancellation' | null>(null)
  const [bookingResult, setBookingResult] = useState<any>(null)
  const [showCancellationModal, setShowCancellationModal] = useState(false)
  const [pendingBookingId, setPendingBookingId] = useState<number | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancellationError, setCancellationError] = useState<string | null>(null)
  const [showCancellationCenter, setShowCancellationCenter] = useState(false)
  const [selectedBookingForDestinations, setSelectedBookingForDestinations] = useState<Booking | null>(null)
  const [showDestinationDetailsModal, setShowDestinationDetailsModal] = useState(false)
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false)
  const [query, setQuery] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [priceMin, setPriceMin] = useState<number | undefined>(undefined)
  const [priceMax, setPriceMax] = useState<number | undefined>(undefined)
  const [heroIndex, setHeroIndex] = useState(0)

  const floatingParticles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        delay: i * 0.5,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 12 + Math.random() * 20,
        color: ['rgba(255,255,255,0.1)', 'rgba(96,165,250,0.2)', 'rgba(168,85,247,0.2)', 'rgba(236,72,153,0.2)'][Math.floor(Math.random() * 4)]
      })),
    []
  )

  const navLinks = useMemo(() => NAV_LINKS, [])
  const [activeSection, setActiveSection] = useState('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const routeSectionRef = useRef<HTMLDivElement | null>(null)

  const isDark = true
  const sectionBorderClass = isDark ? 'border-white/10' : 'border-[#1d4d39]/20'
  const sectionOverlayClass = isDark ? 'bg-[#0e1512]/60' : 'bg-[#f5f1e8]/80'

  const bookedDestinationNames = useMemo(() => new Set(bookings.flatMap((b) => b.destinations)), [bookings])

  const availableDestinations = useMemo(
    () => destinations.filter((d) => !bookedDestinationNames.has(d.name)),
    [destinations, bookedDestinationNames]
  )

  useEffect(() => {
    setShortestPath(null)
    setOptimizedDestinations([])
  }, [selectedDestinations])

  const countriesList = useMemo(() => {
    const set = new Set<string>()
    destinations.forEach((d) => {
      if (d.country) set.add(d.country)
    })
    return Array.from(set).sort()
  }, [destinations])

  const filteredAvailable = useMemo(() => {
    const q = (query || '').trim().toLowerCase()
    return availableDestinations.filter((d) => {
      if (countryFilter && d.country !== countryFilter) return false
      if (priceMin != null && d.price < priceMin) return false
      if (priceMax != null && d.price > priceMax) return false
      if (!q) return true
      const inName = (d.name || '').toLowerCase().includes(q)
      const inDesc = (d.description || '').toLowerCase().includes(q)
      return inName || inDesc
    })
  }, [availableDestinations, query, countryFilter, priceMin, priceMax])

  const highlightedDestinations = useMemo(() => filteredAvailable.slice(0, 9), [filteredAvailable])

  const heroImages = useMemo(() => {
    const destinationImages = destinations
      .map((d) => d.imageUrl)
      .filter((url): url is string => Boolean(url))
    const unique = Array.from(new Set([NATURE_HERO_IMAGE, ...destinationImages, ...FALLBACK_HERO_IMAGES]))
    return unique.slice(0, 8)
  }, [destinations])

  useEffect(() => {
    if (!heroImages.length) return
    const interval = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroImages.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [heroImages])

  const activeHeroImage = heroImages[heroIndex % heroImages.length] || NATURE_HERO_IMAGE

  const travelStories = useMemo(() => {
    return bookings.slice(0, 3).map((booking) => {
      const primaryName = booking.destinations[0] ?? 'Hidden Haven'
      const destination = destinations.find((d) => d.name === primaryName)
      const storyImage = destination?.imageUrl || `https://images.unsplash.com/photo-${1500000000000 + booking.bookingId}?auto=format&fit=crop&w=1200&q=80`
      const excerpt = `${booking.guests} explorer${booking.guests > 1 ? 's' : ''} • ${booking.nights} night${booking.nights > 1 ? 's' : ''} • booked ${new Date(booking.bookingDate).toLocaleDateString()}`
      return {
        id: booking.bookingId,
        title: primaryName,
        excerpt,
        status: booking.cancellationStatus,
        image: storyImage
      }
    })
  }, [bookings, destinations])

  const totalBookings = bookings.length
  const activeTrips = bookings.filter((b) => b.cancellationStatus === 'None' || b.cancellationStatus === 'Requested').length
  const cancellationCount = bookings.filter((b) => b.cancellationStatus === 'Approved').length
  const pendingCancellations = bookings.filter((b) => b.cancellationStatus === 'Requested').length

  const adventureMetrics = useMemo(
    () => [
      {
        title: 'Journeys Planned',
        value: totalBookings.toString(),
        description: 'Bookings crafted for your profile'
      },
      {
        title: 'Active Expeditions',
        value: activeTrips.toString(),
        description: 'Trips currently unfolding'
      },
      {
        title: 'Destinations Curated',
        value: destinations.length.toString(),
        description: 'Nature escapes awaiting discovery'
      },
      {
        title: 'Care & Cancellations',
        value: `${cancellationCount}/${pendingCancellations || 0}`,
        description: 'Approved vs pending requests'
      }
    ],
    [totalBookings, activeTrips, destinations.length, cancellationCount, pendingCancellations]
  )

  const selectedPreview = selectedDestinations.map((d) => d.name).join(' • ')

  const loadData = async () => {
    try {
      setLoading(true)
      const bookingsData = await bookingsAPI.getUserBookings(user!.userId)
      setBookings(bookingsData)
    } catch (error) {
      console.error('Error loading bookings', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160
      let current = navLinks[0]?.id || 'overview'
      navLinks.forEach((link) => {
        const section = document.getElementById(link.id)
        if (section && section.offsetTop <= scrollPosition) {
          current = link.id
        }
      })
      setActiveSection(current)
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [navLinks])

  useEffect(() => {
    if (!cancellationError) return
    const t = window.setTimeout(() => setCancellationError(null), 4000)
    return () => clearTimeout(t)
  }, [cancellationError])

  const handleScrollToSection = (id: string) => {
    const section = document.getElementById(id)
    if (section) {
      const offsetTop = section.getBoundingClientRect().top + window.scrollY - 120
      window.scrollTo({ top: offsetTop > 0 ? offsetTop : 0, behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    setShowLogoutSuccess(true)
    setTimeout(() => navigate('/landing', { replace: true }), 1200)
  }

  const handleDestinationSelect = (destination: Destination) => {
    setSelectedDestinations((prev) => {
      const exists = prev.some((p) => p.destinationId === destination.destinationId)
      return exists ? prev.filter((p) => p.destinationId !== destination.destinationId) : [...prev, destination]
    })
  }

  const calculateShortestPath = async () => {
    const hasValidCoordinates = (destination: Destination) =>
      typeof destination.latitude === 'number' &&
      typeof destination.longitude === 'number' &&
      !Number.isNaN(destination.latitude) &&
      !Number.isNaN(destination.longitude)

    const validDestinations = selectedDestinations.filter(hasValidCoordinates)

    if (selectedDestinations.length < 2) {
      toast.error('Select at least two destinations with location details')
      return
    }

    if (validDestinations.length !== selectedDestinations.length) {
      toast.error('Missing location details for one or more destinations')
      return
    }

    if (validDestinations.length < 2) {
      toast.error('Select at least two destinations with location details')
      return
    }

    try {
      const points = validDestinations.map((destination) => ({
        latitude: destination.latitude as number,
        longitude: destination.longitude as number
      }))
      const result = await shortestPathAPI.calculate({ points })
      const orderedDestinations = result.order
        .map((index) => validDestinations[index])
        .filter((destination): destination is Destination => Boolean(destination))

      setShortestPath(result)
      setOptimizedDestinations(orderedDestinations)

      requestAnimationFrame(() => {
        routeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } catch (error) {
      console.error('Error calculating shortest path', error)
      toast.error('Failed to build route. Please try again later.')
    }
  }

  const handleBookPackage = (travelPackage: TravelPackage) => {
    setSelectedDestinations(travelPackage.destinations)
    setShortestPath(null)
    setShowBookingForm(true)
  }

  const handleBookingSuccess = async (result: any) => {
    setConfirmationContext('booking')
    setBookingResult(result)
    setShowConfirmation(true)
    setShowBookingForm(false)
    await Promise.all([loadData(), refreshDestinations()])
  }

  const handleRequestCancellation = (bookingId: number) => {
    setPendingBookingId(bookingId)
    setCancellationReason('')
    setCancellationError(null)
    setShowCancellationModal(true)
  }

  const handleSubmitCancellation = async () => {
    if (!pendingBookingId || !user) return
    try {
      const response = await tripCancellationAPI.requestCancellation({
        bookingId: pendingBookingId,
        userId: user.userId,
        reason: cancellationReason.trim() || undefined
      })
      setShowCancellationModal(false)
      setPendingBookingId(null)
      setCancellationReason('')
      await loadData()
      setConfirmationContext('cancellation')
      setBookingResult({
        bookingId: pendingBookingId,
        message: response?.message || 'Cancellation requested'
      })
      setShowConfirmation(true)
    } catch (err: any) {
      console.error('Cancellation error', err)
      const message = err?.response?.data?.message || 'Failed to request cancellation'
      setCancellationError(message)
    }
  }

  const handleExploreDestinations = (booking: Booking) => {
    setSelectedBookingForDestinations(booking)
    setShowDestinationDetailsModal(true)
  }

  const clearFilters = () => {
    setQuery('')
    setCountryFilter('')
    setPriceMin(undefined)
    setPriceMax(undefined)
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0e1512] text-white' : 'bg-[#f2f4f1] text-[#0f1a13]'}`}>
        Loading...
      </div>
    )
  }

  return (
    <div
      className={`relative isolate min-h-screen overflow-hidden bg-no-repeat bg-center bg-fixed bg-cover  ${
        isDark ? 'text-white' : 'text-[#133d2c]'
      } before:absolute before:inset-0 before:bg-black/45 before:content-[''] before:z-0 before:pointer-events-none`}
      style={{ backgroundImage: `url(${activeHeroImage})` }}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-transparent" />

      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`fixed top-0 left-0 right-0 z-40 border-b transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0e1512]/95 backdrop-blur-xl border-white/10 shadow-lg shadow-blue-500/10'
            : 'bg-[#0e1512]/40 backdrop-blur-md border-white/5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <motion.div className="flex items-center gap-3 group">
              <motion.div
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white transition-all group-hover:shadow-[0_0_25px_rgba(59,130,246,0.45)]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ✈
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                SuiteSavvy
              </span>
            </motion.div>
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleScrollToSection(link.id)}
                  className={`relative py-2 text-sm font-medium transition-colors ${
                    activeSection === link.id ? 'text-white' : 'text-white/60 hover:text-white'
                  }`}
                  type="button"
                >
                  {link.label}
                  {activeSection === link.id && (
                    <motion.div
                      layoutId="dashboardActiveSection"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => setShowCancellationCenter(true)}
                className="h-12 px-5 rounded-full border border-white/20 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                type="button"
                title="Cancellation center"
              >
                Manage cancellations
              </button>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-lg shadow-blue-500/30"
                  type="button"
                >
                  Logout
                </button>
              </motion.div>
            </div>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen((state) => !state)}
              className="md:hidden p-2 text-white/80 hover:text-white transition-colors"
              aria-label="Toggle menu"
              type="button"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </motion.button>
          </div>
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden overflow-hidden border-t border-white/10 bg-[#0e1512]/95 backdrop-blur-xl"
              >
                <div className="py-4 space-y-2">
                  {navLinks.map((link) => (
                    <motion.button
                      key={link.id}
                      onClick={() => {
                        handleScrollToSection(link.id)
                        setMobileMenuOpen(false)
                      }}
                      whileHover={{ x: 4 }}
                      className={`block w-full text-left px-4 py-3 rounded-lg transition ${
                        activeSection === link.id ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                      type="button"
                    >
                      {link.label}
                    </motion.button>
                  ))}
                </div>
                <div className="border-t border-white/10 px-4 py-4 flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setShowCancellationCenter(true)
                      setMobileMenuOpen(false)
                    }}
                    className="px-4 py-3 rounded-lg border border-white/20 text-white/80 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
                    type="button"
                  >
                    Manage cancellations
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleLogout()
                    }}
                    className="px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold"
                    type="button"
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      <main className="relative z-10 pt-28 md:pt-36 pb-28 space-y-24">
        <motion.section
          id="overview"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-7xl mx-auto px-6"
        >
          <div className="grid gap-10 md:grid-cols-[1.2fr,0.8fr] items-end">
            <div className="space-y-8">
              <div
                className={`inline-block px-4 py-2 rounded-full border text-sm font-medium backdrop-blur-sm ${
                  isDark ? 'bg-white/10 border-white/10 text-white/90' : 'bg-[#0e1512]/5 border-[#0e1512]/10 text-[#0e1512]'
                }`}
              >
                Your SuiteSavvy Dashboard
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                  Welcome back,
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {user?.name || 'Explorer'}
                </span>
              </h1>
              <p className={`text-lg md:text-xl ${isDark ? 'text-white/70' : 'text-[#0e1512]/70'}`}>
                Craft your next escape across {destinations.length} cinematic landscapes. Navigate bookings, cancellations, and curated routes with SuiteSavvy precision.
              </p>
              <div className="flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowBookingForm(true)}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold shadow-[0_20px_45px_rgba(59,130,246,0.35)]"
                  type="button"
                >
                  Start booking
                </motion.button>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={calculateShortestPath}
                  disabled={selectedDestinations.length < 2}
                  className={`px-8 py-3 rounded-full border font-semibold transition-colors ${
                    selectedDestinations.length < 2
                      ? isDark
                        ? 'border-white/10 text-white/40 cursor-not-allowed'
                        : 'border-[#0e1512]/20 text-[#0e1512]/40 cursor-not-allowed'
                      : isDark
                      ? 'border-white/30 text-white hover:bg-white/10'
                      : 'border-[#0e1512]/30 text-[#0e1512] hover:bg-[#0e1512]/5'
                  }`}
                  type="button"
                >
                  Build route
                </motion.button>
              </div>
              <div className={`rounded-2xl border px-5 py-4 max-w-xl ${isDark ? 'border-white/10 bg-white/5 text-white/90' : 'border-[#0e1512]/10 bg-white/70'}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className={isDark ? 'text-white/70' : 'text-[#0e1512]/70'}>Selections</span>
                  <span className="font-semibold text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text">
                    {selectedDestinations.length}
                  </span>
                </div>
                <div className="mt-2 text-sm line-clamp-2">{selectedPreview || 'Tap a destination below to begin curating your journey.'}</div>
              </div>
            </div>
            <div className="space-y-6">
              <div className={`rounded-3xl p-6 border ${isDark ? 'border-white/10 bg-white/5 text-white/90' : 'border-[#0e1512]/10 bg-white/70'}`}>
                <div className="text-sm uppercase tracking-[0.3em] text-blue-300">Today</div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold">{activeTrips}</div>
                    <div className={isDark ? 'text-white/60' : 'text-[#0f1a13]/60'}>Active expeditions</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold">{cancellationCount}</div>
                    <div className={isDark ? 'text-white/60' : 'text-[#0f1a13]/60'}>Cancellations resolved</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {heroImages.map((_, index) => (
                  <div key={index} className={`h-1 flex-1 rounded-full ${index === heroIndex ? 'bg-[#d9b26f]' : 'bg-white/20'}`} />
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          id="destinations"
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-7xl mx-auto px-6"
        >
          <div className={`relative overflow-hidden rounded-[40px] border ${sectionBorderClass} px-6 sm:px-10 py-10 backdrop-blur-sm`}>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${SECTION_BACKGROUND_IMAGES.destinations})` }} />
            <div className={`absolute inset-0 ${sectionOverlayClass}`} />
            <div className="relative z-10 flex flex-col gap-8">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div className="max-w-2xl space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">The Wonders of Nature</h2>
                  <p className={`text-lg ${isDark ? 'text-[#d7e7da]' : 'text-[#0f1a13]/70'}`}>
                    Immerse yourself in bioluminescent bays, alpine ridges, and rainforest canopies. Filter the catalog to sculpt your perfect expedition.
                  </p>
                </div>
                <div className="w-full lg:w-[480px]">
                  <SearchFilterBar
                    query={query}
                    setQuery={setQuery}
                    country={countryFilter}
                    setCountry={setCountryFilter}
                    priceMin={priceMin}
                    setPriceMin={setPriceMin}
                    priceMax={priceMax}
                    setPriceMax={setPriceMax}
                    clearFilters={clearFilters}
                    countries={countriesList}
                    dark={isDark}
                  />
                </div>
              </div>

              {highlightedDestinations.length === 0 ? (
                <div className={`rounded-3xl border px-8 py-16 text-center text-lg ${isDark ? 'border-[#2b5f49]/25 bg-[#f5f1e8]/75 text-[#f5e9d4]' : 'border-[#0e1512]/10 bg-white/70 text-[#0f1a13]/70'}`}>
                  No destinations match your filters. Reset to rediscover the wild.
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {highlightedDestinations.map((destination) => {
                    const selected = selectedDestinations.some((d) => d.destinationId === destination.destinationId)
                    return (
                      <motion.button
                        key={destination.destinationId}
                        onClick={() => handleDestinationSelect(destination)}
                        whileHover={{ y: -8 }}
                        className={`group relative overflow-hidden rounded-3xl border text-left transition-all ${
                          selected
                            ? 'border-[#d9b26f] shadow-[0_25px_45px_rgba(248,209,108,0.25)]'
                            : isDark
                            ? 'border-[#2b5f49]/25 hover:border-[#d9b26f]/40'
                            : 'border-[#0f1a13]/15 hover:border-[#0f1a13]/40'
                        }`}
                        type="button"
                      >
                        <div className="relative h-64 overflow-hidden">
                          <motion.img
                            src={destination.imageUrl || `https://images.unsplash.com/photo-${1500000000000 + destination.destinationId}?auto=format&fit=crop&w=1200&q=80`}
                            alt={destination.name}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                          {selected && (
                            <motion.div
                              initial={{ scale: 0.6, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute top-4 right-4 w-12 h-12 rounded-full bg-[#d9b26f] text-[#0f1a13] font-bold flex items-center justify-center shadow-lg"
                            >
                              ✓
                            </motion.div>
                          )}
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-semibold">{destination.name}</h3>
                            <span className="text-sm uppercase tracking-[0.3em] text-blue-300">{destination.country}</span>
                          </div>
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-[#d7e7da]' : 'text-[#0f1a13]/70'}`}>
                            {destination.description || 'Untamed landscapes and hidden stories.'}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="text-3xl font-bold text-blue-300">₹{destination.price.toLocaleString()}</div>
                            <div className={`text-xs uppercase tracking-[0.4em] ${isDark ? 'text-[#f5e9d4]/60' : 'text-[#0f1a13]/50'}`}>Per night</div>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}
          </div>
        </div>
        </motion.section>

        <motion.section
          id="metrics"
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto px-6"
        >
          <div className={`relative overflow-hidden rounded-[40px] border ${sectionBorderClass} p-10 md:p-16 ${!isDark ? 'shadow-2xl' : ''}`}>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${SECTION_BACKGROUND_IMAGES.metrics})` }} />
            <div className={`absolute inset-0 ${sectionOverlayClass}`} />
            <div className="relative z-10">
              <div className="flex flex-col gap-6 md:flex-row md:justify-between md:items-center">
                <div className="space-y-4 max-w-xl">
                  <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">SuiteSavvy Metrics</h2>
                  <p className={`text-lg ${isDark ? 'text-[#d7e7da]' : 'text-[#0f1a13]/70'}`}>
                    Your dashboard stays in sync with live bookings, cancellation care, and curated destinations. Every refresh keeps your expedition tailored.
                  </p>
                </div>
                <div className="text-sm uppercase tracking-[0.4em] text-blue-300">Adventure fidelity</div>
              </div>
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {adventureMetrics.map((metric) => (
                  <motion.div
                    key={metric.title}
                    whileHover={{ y: -6 }}
                    className={`rounded-3xl border p-6 transition-colors ${
                      isDark ? 'border-white/10 bg-white/5 text-white/90' : 'border-[#0e1512]/10 bg-white/85'
                    }`}
                  >
                    <div className="text-sm uppercase tracking-[0.4em] text-blue-300">{metric.title}</div>
                    <div className="mt-4 text-4xl font-bold">{metric.value}</div>
                    <p className={`mt-3 text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-[#0f1a13]/60'}`}>{metric.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          id="stories"
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-6xl mx-auto px-6"
        >
          <div className={`relative overflow-hidden rounded-[36px] border ${sectionBorderClass} px-6 sm:px-10 py-10 backdrop-blur-sm`}>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${SECTION_BACKGROUND_IMAGES.stories})` }} />
            <div className={`absolute inset-0 ${sectionOverlayClass}`} />
            <div className="relative z-10 space-y-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">From Your Travel Journal</h2>
                  <p className={`text-lg mt-3 ${isDark ? 'text-[#d7e7da]' : 'text-[#0f1a13]/70'}`}>
                    Latest stories are woven from your confirmed bookings. Relive highlights or dive into the details for the next tale.
                  </p>
                </div>
                <div className={`text-sm uppercase tracking-[0.3em] ${isDark ? 'text-white/60' : 'text-[#0f1a13]/60'}`}>Inspired by bookings</div>
              </div>
              {travelStories.length === 0 ? (
                <div className={`rounded-3xl border px-8 py-16 text-center text-lg ${isDark ? 'border-[#2b5f49]/25 bg-[#f5f1e8]/75 text-[#f5e9d4]' : 'border-[#0e1512]/10 bg-white/70 text-[#0f1a13]/70'}`}>
                  Start booking to unlock your travel journal.
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {travelStories.map((story) => (
                    <motion.article
                      key={story.id}
                      whileHover={{ y: -6 }}
                      className={`relative overflow-hidden rounded-3xl border ${isDark ? 'border-white/10 bg-white/5 text-white/90' : 'border-[#0e1512]/10 bg-white/85'}`}
                    >
                      <div className="relative h-56 overflow-hidden">
                        <img src={story.image} alt={story.title} className="h-full w-full object-cover transition-transform duration-700 hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                          <div className="text-sm uppercase tracking-[0.4em] text-blue-300">{story.status}</div>
                          <h3 className="text-2xl font-semibold mt-2">{story.title}</h3>
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        <p className={`text-sm leading-relaxed ${isDark ? 'text-[#d7e7da]' : 'text-[#0f1a13]/70'}`}>{story.excerpt}</p>
                        <button
                          onClick={() => {
                            const booking = bookings.find((b) => b.bookingId === story.id)
                            if (booking) handleExploreDestinations(booking)
                          }}
                          className="text-sm font-semibold text-blue-300 hover:text-[#f1a208]"
                          type="button"
                        >
                          View itinerary →
                        </button>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.section>

        <motion.section
          id="packages"
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-7xl mx-auto px-6"
        >
          <div className={`relative overflow-hidden rounded-[40px] border ${sectionBorderClass} px-6 sm:px-10 py-10 backdrop-blur-sm`}>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(rgba(17,33,27,0.78), rgba(17,33,27,0.78)), url(${SECTION_BACKGROUND_IMAGES.packages})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className={`absolute inset-0 ${sectionOverlayClass}`} />
            <div className="relative z-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-3">
                  <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                    Curated Travel Packages
                  </h2>
                  <p className={`text-lg ${isDark ? 'text-[#d7e7da]' : 'text-[#0f1a13]/70'}`}>
                    Explore ready-made adventures tailored for effortless planning and immersive experiences.
                  </p>
                </div>
              </div>
              <div className="mt-10">
                <PackageList onBookPackage={handleBookPackage} />
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          id="planner"
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-7xl mx-auto px-6"
        >
          <div className={`relative overflow-hidden rounded-[40px] border ${sectionBorderClass} px-6 sm:px-10 py-10 backdrop-blur-sm`}>
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${SECTION_BACKGROUND_IMAGES.planner})` }} />
            <div className={`absolute inset-0 ${sectionOverlayClass}`} />
            <div className="relative z-10 flex flex-col gap-10">
              <div className={`flex-1 rounded-3xl border p-8 ${isDark ? 'border-white/10 bg-white/5 text-white/90' : 'border-[#0e1512]/10 bg-white/85'}`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-blue-300">My Expeditions</h2>
                  <div className={`text-sm uppercase tracking-[0.3em] ${isDark ? 'text-white/60' : 'text-[#0f1a13]/60'}`}>{totalBookings} booked</div>
                </div>
                {bookings.length === 0 ? (
                  <div className="mt-10 rounded-2xl border border-dashed border-[#2b5f49]/25 px-6 py-12 text-center text-[#d7e7da]">
                    No bookings yet. Start your first adventure above.
                  </div>
                ) : (
                  <div className="mt-8 space-y-6">
                    {bookings.slice(0, 4).map((booking) => (
                      <motion.div
                        key={booking.bookingId}
                        whileHover={{ y: -4 }}
                        className={`rounded-2xl border p-6 transition-colors ${
                          booking.cancellationStatus === 'Approved'
                            ? 'border-[#d93654]/40 bg-[#d93654]/10'
                            : isDark
                            ? 'border-[#2b5f49]/25 bg-black/30'
                            : 'border-[#0f1a13]/15 bg-white/80'
                        }`}
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="text-sm uppercase tracking-[0.4em] text-blue-300">Booking #{booking.bookingId}</div>
                            <div className="mt-2 text-xl font-semibold">{booking.destinations.join(', ')}</div>
                            <div className={isDark ? 'text-white/60 text-sm' : 'text-[#0f1a13]/60 text-sm'}>
                              {booking.guests} guests • {booking.nights} nights • {new Date(booking.bookingDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex flex-col gap-3 items-end">
                            <CancellationBadge cancellationStatus={booking.cancellationStatus} />
                            <div className="text-2xl font-bold text-blue-300">₹{booking.totalPrice.toLocaleString()}</div>
                          </div>
                        </div>
                        {booking.latestCancellation && (
                          <div className="mt-4">
                            <CancellationDetails latestCancellation={booking.latestCancellation} />
                          </div>
                        )}
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <button
                            onClick={() => handleRequestCancellation(booking.bookingId)}
                            className="px-4 py-3 rounded-xl border border-red-400/40 text-red-300 hover:bg-red-400/10"
                            type="button"
                          >
                            Request cancellation
                          </button>
                          <button
                            onClick={() => handleExploreDestinations(booking)}
                            className="px-4 py-3 rounded-xl border border-[#d9b26f]/40 text-blue-300 hover:bg-[#d9b26f]/10"
                            type="button"
                          >
                            View itinerary
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    {bookings.length > 4 && (
                      <button
                        onClick={() => setShowCancellationCenter(true)}
                        className="w-full px-4 py-3 rounded-xl border border-[#2b5f49]/25 text-[#1f5b46]/85 hover:text-[#0f3a2c]"
                        type="button"
                      >
                        View all activity
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className={`flex-1 rounded-3xl border p-8 ${isDark ? 'border-white/10 bg-white/5 text-white/90' : 'border-[#0e1512]/10 bg-white/85'}`} ref={routeSectionRef}>
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-blue-300">Route Planner</h2>
                  <div className={`text-sm uppercase tracking-[0.3em] ${isDark ? 'text-white/60' : 'text-[#0f1a13]/60'}`}>
                    {selectedDestinations.length} selected
                  </div>
                </div>
                {shortestPath ? (
                  <div className="mt-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <span className={isDark ? 'text-white/60' : 'text-[#0f1a13]/60'}>Total distance</span>
                      <span className="text-3xl font-bold">{shortestPath.distanceKm.toFixed(1)} km</span>
                    </div>
                    <div className="space-y-3">
                      <span className={isDark ? 'text-white/60 text-sm' : 'text-[#0f1a13]/60 text-sm'}>Recommended order:</span>
                      <div className="flex flex-wrap gap-2">
                        {optimizedDestinations.map((destination, index) => (
                          <motion.span
                            key={destination.destinationId ?? index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="px-3 py-2 rounded-full bg-[#d9b26f]/15 text-blue-300 text-sm"
                          >
                            {index + 1}. {destination.name}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-[#2b5f49]/25">
                      <RouteMap destinations = {optimizedDestinations} />
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
  <p className={isDark ? 'text-[#d7e7da]' : 'text-[#0f1a13]/70'}>
    Select at least two destinations to visualize the optimal path and bring your journey to life on the cinematic map.
  </p>
  <button
    onClick={calculateShortestPath}
    disabled={selectedDestinations.length < 2}
    className={`px-4 py-3 rounded-xl border font-semibold ${
      selectedDestinations.length < 2
        ? 'border-white/10 text-white/40 cursor-not-allowed'
        : 'border-[#d9b26f] text-blue-300 hover:bg-[#d9b26f]/10'
    }`}
    type="button"
  >
    Generate route
  </button>
</div>
)} {/* closing conditional rendering */}

</div>
</div>

<motion.section
  initial={{ opacity: 0, y: 48 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ duration: 0.8 }}
  className="relative max-w-7xl mx-auto px-6"
>
  <main>
    <div
      className={`relative overflow-hidden rounded-[40px] border ${sectionBorderClass} px-6 sm:px-10 py-10 backdrop-blur-sm`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${SECTION_BACKGROUND_IMAGES.planner})` }}
      />
      <div className={`absolute inset-0 ${sectionOverlayClass}`} />
      <div className="relative z-10 flex flex-col gap-10">
        <div
          className={`flex-1 rounded-3xl border p-8 ${
            isDark
              ? 'border-white/10 bg-white/5 text-white/90'
              : 'border-[#0e1512]/10 bg-white/85'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-blue-300">My Expeditions</h2>
            <div
              className={`text-sm uppercase tracking-[0.3em] ${
                isDark ? 'text-white/60' : 'text-[#0f1a13]/60'
              }`}
            >
              {totalBookings} booked
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-[#2b5f49]/25 px-6 py-12 text-center text-[#d7e7da]">
              No bookings yet. Start your first adventure above.
            </div>
          ) : (
            /* your bookings list here */
            <></>
          )}
        </div>
      </div>
    </div>
  </main>
</motion.section>

                  <div className="mt-8 space-y-6">
                    {bookings.slice(0, 4).map((booking) => (
                      <motion.div
                        key={booking.bookingId}
                        whileHover={{ y: -4 }}
                        className={`rounded-2xl border p-6 transition-colors ${
                          booking.cancellationStatus === 'Approved'
                            ? 'border-[#d93654]/40 bg-[#d93654]/10'
                            : isDark
                            ? 'border-[#2b5f49]/25 bg-black/30'
                            : 'border-[#0f1a13]/15 bg-white/80'
                        }`}
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="text-sm uppercase tracking-[0.4em] text-blue-300">Booking #{booking.bookingId}</div>
                            <div className="mt-2 text-xl font-semibold">{booking.destinations.join(', ')}</div>
                            <div className={isDark ? 'text-white/60 text-sm' : 'text-[#0f1a13]/60 text-sm'}>
                              {booking.guests} guests • {booking.nights} nights • {new Date(booking.bookingDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex flex-col gap-3 items-end">
                            <CancellationBadge cancellationStatus={booking.cancellationStatus} />
                            <div className="text-2xl font-bold text-blue-300">₹{booking.totalPrice.toLocaleString()}</div>
                          </div>
                        </div>
                        {booking.latestCancellation && (
                          <div className="mt-4">
                            <CancellationDetails latestCancellation={booking.latestCancellation} />
                          </div>
                        )}
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <button
                            onClick={() => handleRequestCancellation(booking.bookingId)}
                            className="px-4 py-3 rounded-xl border border-red-400/40 text-red-300 hover:bg-red-400/10"
                            type="button"
                          >
                            Request cancellation
                          </button>
                          <button
                            onClick={() => handleExploreDestinations(booking)}
                            className="px-4 py-3 rounded-xl border border-[#d9b26f]/40 text-blue-300 hover:bg-[#d9b26f]/10"
                            type="button"
                          >
                            View itinerary
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    {bookings.length > 4 && (
                      <button
                        onClick={() => setShowCancellationCenter(true)}
                        className="w-full px-4 py-3 rounded-xl border border-[#2b5f49]/25 text-[#1f5b46]/85 hover:text-[#0f3a2c]"
                        type="button"
                      >
                        View all activity
                      </button>
                    )}
                  </div>
              </div>
             <div
  className={`flex-1 rounded-3xl border p-8 ${
    isDark
      ? 'border-white/10 bg-white/5 text-white/90'
      : 'border-[#0e1512]/10 bg-white/85'
  }`}
  ref={routeSectionRef}
>
  <div className="flex items-center justify-between">
    <h2 className="text-3xl font-bold text-blue-300">Route Planner</h2>
    <div
      className={`text-sm uppercase tracking-[0.3em] ${
        isDark ? 'text-white/60' : 'text-[#0f1a13]/60'
      }`}
    >
      {selectedDestinations.length} selected
    </div>
  </div>

  {shortestPath ? (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <span className={isDark ? 'text-white/60' : 'text-[#0f1a13]/60'}>
          Total distance
        </span>
        <span className="text-3xl font-bold">
          {shortestPath.distanceKm.toFixed(1)} km
        </span>
      </div>

      <div className="space-y-3">
        <span
          className={
            isDark
              ? 'text-white/60 text-sm'
              : 'text-[#0f1a13]/60 text-sm'
          }
        >
          Recommended order:
        </span>
        <div className="flex flex-wrap gap-2">
          {optimizedDestinations.map((destination, index) => (
            <motion.span
              key={destination.destinationId ?? index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="px-3 py-2 rounded-full bg-[#d9b26f]/15 text-blue-300 text-sm"
            >
              {index + 1}. {destination.name}
            </motion.span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-[#2b5f49]/25">
        <RouteMap destinations ={optimizedDestinations} />
      </div>
    </div>
  ) : (
    <div className="mt-6 text-center space-y-6">
      <p
        className={
          isDark ? 'text-white/60' : 'text-[#0f1a13]/60'
        }
      >
        Select at least two destinations to generate your optimal route.
      </p>
      <button
        onClick={calculateShortestPath}
        disabled={selectedDestinations.length < 2}
        className={`px-4 py-3 rounded-xl border font-semibold ${
          selectedDestinations.length < 2
            ? 'border-white/10 text-white/40 cursor-not-allowed'
            : 'border-[#d9b26f] text-blue-300 hover:bg-[#d9b26f]/10'
        }`}
        type="button"
      >
        Generate route
      </button>
    </div>
  )}
</div>

        </motion.section>
        
        <motion.section
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto px-6"
        >
          <div className={`rounded-3xl border p-8 ${isDark ? 'border-white/10 bg-white/5 text-white/90' : 'border-[#0e1512]/10 bg-white/85'}`}>
            <Feedback />
          </div>
        </motion.section>
      </main>

      <FAB
        onOpenBooking={() => setShowBookingForm(true)}
        onOpenCancellations={() => setShowCancellationCenter(true)}
        onOpenFeedback={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
      />

      <AnimatePresence>
        {showBookingForm && (
          <BookingForm destinations={selectedDestinations} onClose={() => setShowBookingForm(false)} onSuccess={handleBookingSuccess} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmation && bookingResult && (
          <EmailConfirmationModal
            booking={bookingResult}
            context={confirmationContext || 'booking'}
            onClose={() => {
              setShowConfirmation(false)
              setConfirmationContext(null)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCancellationModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[#0e1512] rounded-2xl border border-[#2b5f49]/25 p-6 max-w-md w-full">
              <h3 className="text-2xl font-semibold text-[#f5e9d4] mb-2">Request Cancellation</h3>
              <p className="text-[#d7e7da] mb-3">Confirm cancellation for booking #{pendingBookingId}</p>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full min-h-[120px] rounded-lg bg-[#f5f1e8]/75 border border-[#2b5f49]/25 text-[#f5e9d4] p-3"
                placeholder="Reason (optional)"
              />
              {cancellationError && <div className="mt-3 text-sm text-red-300 bg-red-500/10 p-2 rounded">{cancellationError}</div>}
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCancellationModal(false)
                    setPendingBookingId(null)
                    setCancellationReason('')
                  }}
                  className="px-4 py-2 rounded-lg border border-[#2b5f49]/25 text-[#1f5b46]/85 hover:text-[#0f3a2c]"
                  type="button"
                >
                  Keep booking
                </button>
                <button onClick={handleSubmitCancellation} className="px-4 py-2 rounded-lg bg-red-500/80 text-[#f5e9d4]" type="button">
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCancellationCenter && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[420px] md:w-[480px] bg-[#0e1512] border-l border-[#2b5f49]/25 z-50"
          >
            <CancellationCenter bookings={bookings} onClose={() => setShowCancellationCenter(false)} onRequestCancellation={handleRequestCancellation} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDestinationDetailsModal && selectedBookingForDestinations && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }} className="bg-[#0e1512] rounded-2xl border border-[#2b5f49]/25 p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-bold">Your Destinations</h3>
                <button onClick={() => setShowDestinationDetailsModal(false)} className="text-[#d7e7da] text-2xl" type="button">
                  ✕
                </button>
              </div>
              <div className="mb-6 p-4 bg-[#f5f1e8]/75 rounded-lg border border-[#2b5f49]/25">
                <h4 className="text-lg font-semibold mb-2">Booking Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-[#d7e7da]">Booking ID:</span>
                    <div className="text-[#f5e9d4] font-semibold">#{selectedBookingForDestinations.bookingId}</div>
                  </div>
                  <div>
                    <span className="text-[#d7e7da]">Guests:</span>
                    <div className="text-[#f5e9d4]">{selectedBookingForDestinations.guests}</div>
                  </div>
                  <div>
                    <span className="text-[#d7e7da]">Nights:</span>
                    <div className="text-[#f5e9d4]">{selectedBookingForDestinations.nights}</div>
                  </div>
                  <div>
                    <span className="text-[#d7e7da]">Total:</span>
                    <div className="text-green-400 font-bold">₹{selectedBookingForDestinations.totalPrice.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {selectedBookingForDestinations.destinations.map((destName, index) => {
                  const destination = destinations.find((d) => d.name === destName)
                  return (
                    <motion.div key={index} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="bg-[#f5f1e8]/75 p-4 rounded-xl border border-[#2b5f49]/25">
                      <div className="md:flex gap-6">
                        <div className="md:w-1/3">
                          <div className="aspect-[4/3] overflow-hidden rounded-lg">
                            <img
                              src={destination?.imageUrl || `https://images.unsplash.com/photo-${1500000000000 + index}?auto=format&fit=crop&w=1200&q=80`}
                              alt={destName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="md:w-2/3 mt-3 md:mt-0">
                          <h5 className="text-2xl font-bold mb-2">{destName}</h5>
                          <p className="text-[#d7e7da] mb-3">{destination?.description || 'A wonderful place to visit.'}</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-white/60 text-sm">Price per night:</span>
                              <div className="text-2xl font-bold">₹{destination?.price?.toLocaleString() ?? 'N/A'}</div>
                            </div>
                            {destination?.latitude && destination?.longitude && (
                              <div className="text-right">
                                <span className="text-white/60 text-sm">Coordinates</span>
                                <div className="text-[#f5e9d4] text-sm">
                                  {destination.latitude.toFixed(4)}, {destination.longitude.toFixed(4)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setShowDestinationDetailsModal(false)} className="px-6 py-3 rounded-lg bg-blue-600/80 text-[#f5e9d4]" type="button">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogoutSuccess && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="bg-[#0e1512] rounded-2xl border border-[#2b5f49]/25 p-6">
              <div className="text-4xl mb-2">👋</div>
              <div className="text-[#f5e9d4] font-semibold">Logout successful — redirecting...</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
