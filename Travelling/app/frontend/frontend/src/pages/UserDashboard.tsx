import React from 'react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { bookingsAPI, shortestPathAPI, tripCancellationAPI, type Destination, type Booking, type ShortestPathResponse, type TripCancellationStatus } from '../lib/api'
import { useDestinations } from '../contexts/DestinationsContext'
import BookingForm from '../components/booking/BookingForm'
import EmailConfirmationModal from '../components/booking/EmailConfirmationModal'
import { CancellationBadge, CancellationDetails, CancellationCenter } from '../components/cancellations'
import RouteMap from '../components/maps/RouteMap'
import Feedback from '../components/Feedback'

const cancellationStatusMap: Record<string, { label: string; color: string }> = {
  None: { label: 'Active', color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
  Requested: { label: 'Cancellation Requested', color: 'bg-amber-500/20 text-amber-200 border border-amber-500/30' },
  Approved: { label: 'Cancelled', color: 'bg-red-500/20 text-red-300 border border-red-500/30' },
  Rejected: { label: 'Cancellation Rejected', color: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' }
}

// Remove custom ImportMeta and ImportMetaEnv declarations, Vite provides these types automatically.

export default function UserDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { destinations, isLoading: destinationsLoading, refresh: refreshDestinations } = useDestinations()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedDestinations, setSelectedDestinations] = useState<Destination[]>([])
  const [shortestPath, setShortestPath] = useState<ShortestPathResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationContext, setConfirmationContext] = useState<'booking' | 'cancellation' | null>(null)
  const [bookingResult, setBookingResult] = useState<any>(null)
  const [showCancellationModal, setShowCancellationModal] = useState(false)
  const [pendingBookingId, setPendingBookingId] = useState<number | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancellationError, setCancellationError] = useState<string | null>(null)
  const [cancellationSuccess, setCancellationSuccess] = useState<string | null>(null)
  const [showCancellationCenter, setShowCancellationCenter] = useState(false)
  const [selectedBookingForDestinations, setSelectedBookingForDestinations] = useState<Booking | null>(null)
  const [showDestinationDetailsModal, setShowDestinationDetailsModal] = useState(false)
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<'explore' | 'national' | 'international' | 'bookings'>('explore')
  const [isScrolled, setIsScrolled] = useState(false)
  const [showTripSelector, setShowTripSelector] = useState(false)
  const bookedDestinationNames = useMemo(() => {
    return new Set(bookings.flatMap(b => b.destinations))
  }, [bookings])
  
  const availableDestinations = useMemo(() => destinations, [destinations])

  const nationalDestinations = useMemo(
    () => destinations.filter((dest) => (dest.country || '').toLowerCase() === 'india'),
    [destinations]
  )
  const internationalDestinations = useMemo(
    () => destinations.filter((dest) => (dest.country || '').toLowerCase() !== 'india'),
    [destinations]
  )
  const tripOptions = useMemo(
    () => [
      {
        id: 'national' as const,
        title: 'National escapes',
        description: 'Curated journeys across India with cultural flair and boutique comfort.',
        count: nationalDestinations.length,
        accent: 'from-amber-500/20 via-orange-500/20 to-rose-500/20'
      },
      {
        id: 'international' as const,
        title: 'International adventures',
        description: 'Global experiences woven with cosmopolitan charm and exclusive stays.',
        count: internationalDestinations.length,
        accent: 'from-blue-500/20 via-indigo-500/20 to-purple-500/20'
      },
      {
        id: 'explore' as const,
        title: 'All destinations',
        description: 'Browse the full SuiteSavvy collection and craft your signature escape.',
        count: availableDestinations.length,
        accent: 'from-blue-500/20 via-purple-500/20 to-pink-500/20'
      }
    ],
    [nationalDestinations.length, internationalDestinations.length, availableDestinations.length]
  )
  const devotionalDestinations = useMemo(
    () =>
      nationalDestinations.filter((dest) => {
        const name = (dest.name || '').toLowerCase()
        const description = (dest.description || '').toLowerCase()
        return ['temple', 'spiritual', 'pilgr', 'darshan', 'ashram', 'holy'].some(
          (keyword) => name.includes(keyword) || description.includes(keyword)
        )
      }),
    [nationalDestinations]
  )
  const otherNationalDestinations = useMemo(
    () =>
      nationalDestinations.filter(
        (dest) => !devotionalDestinations.some((dev) => dev.destinationId === dest.destinationId)
      ),
    [nationalDestinations, devotionalDestinations]
  )
  const remainingNationalDestinations =
    otherNationalDestinations.length > 0 ? otherNationalDestinations : nationalDestinations

  const cancellationsCount = useMemo(
    () => bookings.filter((booking) => booking.cancellationStatus && booking.cancellationStatus !== 'None').length,
    [bookings]
  )
  const quickStats = useMemo(
    () => [
      {
        label: 'Active bookings',
        value: bookings.filter((booking) => booking.cancellationStatus !== 'Approved').length,
        icon: '🧳',
        accent: 'from-blue-500/20 via-indigo-500/20 to-purple-500/20'
      },
      {
        label: 'Destinations discovered',
        value: bookedDestinationNames.size,
        icon: '🗺️',
        accent: 'from-cyan-500/20 via-blue-500/20 to-emerald-500/20'
      },
      {
        label: 'Cancellation requests',
        value: cancellationsCount,
        icon: '⚠️',
        accent: 'from-amber-500/20 via-orange-500/20 to-rose-500/20'
      }
    ],
    [bookings, bookedDestinationNames, cancellationsCount]
  )

  // Debug logging
  useEffect(() => {
    console.log('UserDashboard mounted, user:', user)
    return () => {
      console.log('UserDashboard unmounting')
    }
  }, [])

  useEffect(() => {
    console.log('UserDashboard user changed:', user)
  }, [user])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!cancellationSuccess) return
    const timer = window.setTimeout(() => setCancellationSuccess(null), 4000)
    return () => window.clearTimeout(timer)
  }, [cancellationSuccess])

  const loadData = async () => {
    try {
      setLoading(true)
      const bookingsData = await bookingsAPI.getUserBookings(user!.userId)
      setBookings(bookingsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    setShowLogoutSuccess(true)
    setTimeout(() => {
      navigate('/landing', { replace: true })
    }, 2000)
  }




  const handleExploreDestinations = (booking: Booking) => {
    setSelectedBookingForDestinations(booking)
    setShowDestinationDetailsModal(true)
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
        reason: cancellationReason.trim() || undefined,
      })
      setCancellationError(null)
      setShowCancellationModal(false)
      setPendingBookingId(null)
      setCancellationReason('')
      await loadData()
      setConfirmationContext('cancellation')
      setBookingResult({
        bookingId: pendingBookingId,
        message: response?.message || 'Cancellation request submitted successfully.'
      })
      setShowConfirmation(true)
    } catch (error: any) {
      console.error('Error requesting cancellation:', error)
      const message = error.response?.data?.message || 'Failed to request cancellation. Please try again later.'
      setCancellationError(message)
    }
  }

  const handleDestinationSelect = (destination: Destination) => {
    setSelectedDestinations(prev => {
      const isSelected = prev.some(d => d.destinationId === destination.destinationId)
      if (isSelected) {
        return prev.filter(d => d.destinationId !== destination.destinationId)
      } else {
        return [...prev, destination]
      }
    })
  }

  const routeSectionRef = useRef<HTMLDivElement>(null)

  const calculateShortestPath = async () => {
    if (selectedDestinations.length < 2) return

    try {
      const points = selectedDestinations.map(d => ({
        latitude: d.latitude || 0,
        longitude: d.longitude || 0
      }))
      
      const result = await shortestPathAPI.calculate({ points })
      setShortestPath(result)
      // Scroll to route section
      setTimeout(() => routeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    } catch (error) {
      console.error('Error calculating shortest path:', error)
    }
  }

  const handleBookingSuccess = async (result: any) => {
    setConfirmationContext('booking')
    setBookingResult(result)
    setShowConfirmation(true)
    setShowBookingForm(false)
    await Promise.all([loadData(), refreshDestinations()])
  }

  const handlePlanTripOption = (tab: 'national' | 'international') => {
    setActiveTab(tab)
    setShowTripSelector(false)
    setTimeout(() => {
      document.getElementById(tab)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  }

  const handleShowAllDestinations = () => {
    setActiveTab('explore')
    setShowTripSelector(false)
    setTimeout(() => {
      document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  }

  if (loading || destinationsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#040718] via-[#0b1224] to-[#0f172a] text-white">
        <div className="text-white/80">Loading...</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040718] text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-[#080f1e] to-[#070b16]" />
      <div className="absolute -left-1/2 top-[-20%] h-[120%] w-[80%] bg-gradient-to-br from-cyan-500/25 via-blue-500/20 to-indigo-500/20 blur-3xl opacity-70" />
      <div className="absolute -right-1/3 bottom-[-25%] h-[130%] w-[70%] bg-gradient-to-br from-fuchsia-500/20 via-purple-500/20 to-rose-500/20 blur-3xl opacity-60" />
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <motion.nav
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
            isScrolled
              ? 'bg-[#0e1512]/95 backdrop-blur-xl border-b border-white/10 shadow-lg'
              : 'bg-[#0e1512]/60 backdrop-blur-lg border-b border-white/5'
          }`}
        >
          <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
            <motion.div whileHover={{ scale: 1.03 }} className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_0_35px_rgba(99,102,241,0.4)]"
              >
                <div className="absolute inset-0 rounded-full border border-white/30" />
                <span className="text-xl">✈</span>
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                SuiteSavvy
              </span>
            </motion.div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-white/70">Hi, {user?.name}</span>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCancellationCenter(true)}
                className="relative inline-flex items-center justify-center overflow-hidden rounded-lg border border-amber-400/40 px-5 py-2 text-sm font-medium text-amber-100 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/30"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                <span className="relative">Manage cancellations</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleLogout}
                className="relative inline-flex items-center justify-center overflow-hidden rounded-lg border border-rose-400/40 px-5 py-2 text-sm font-medium text-rose-100 transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/30"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-red-500/20 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                <span className="relative">Logout</span>
              </motion.button>
            </div>
          </div>
        </motion.nav>

        {cancellationSuccess && (
          <div className="fixed right-6 top-24 z-40">
            <div className="rounded-2xl border border-emerald-400/50 bg-emerald-500/15 px-5 py-3 text-sm font-medium text-emerald-200 shadow-[0_20px_45px_rgba(16,185,129,0.35)]">
              {cancellationSuccess}
            </div>
          </div>
        )}

        {/* Logout Success Popup */}
        <AnimatePresence>
          {showLogoutSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md rounded-3xl border border-white/20 bg-white/[0.04] p-10 text-center backdrop-blur-xl shadow-[0_35px_120px_rgba(8,12,24,0.65)]"
              >
                <div className="mb-4 text-6xl drop-shadow-[0_10px_35px_rgba(59,130,246,0.35)]">👋</div>
                <h3 className="mb-4 text-2xl font-semibold text-white">Logout Successful!</h3>
                <p className="text-white/70">Thank you for using SuiteSavvy. See you soon!</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 pt-28">
          <div className="mx-auto w-full max-w-7xl px-6 py-10">
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="relative mb-14 overflow-hidden rounded-[36px] border border-white/10 bg-[#0e1512]/80 px-8 py-16 shadow-[0_45px_120px_rgba(8,12,24,0.65)] backdrop-blur-3xl"
            >
              <div className="absolute inset-0">
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{
                    backgroundImage:
                      'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2000&h=1200&fit=crop")'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#0e1512]/95 via-[#0e1512]/70 to-[#0e1512]/85" />
                <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
              </div>
              <div className="relative z-10 grid gap-12 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:items-center">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="space-y-8"
                >
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/80"
                  >
                    ✨ Tailored journeys for modern explorers
                  </motion.span>
                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="text-5xl font-bold leading-tight md:text-6xl"
                  >
                    <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                      {user?.name ? `${user.name},` : 'Welcome,'}
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      let&apos;s explore the world
                    </span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="max-w-2xl text-lg text-white/70"
                  >
                    Seamlessly manage bookings, unlock curated itineraries, and stay inspired with destinations that mirror the magic of our landing experience.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="flex flex-wrap gap-4"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowTripSelector(true)}
                      type="button"
                      className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50"
                    >
                      Plan a trip
                      <motion.span animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}>
                        ➜
                      </motion.span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => {
                        setActiveTab('explore')
                        setTimeout(() => {
                          document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }, 150)
                      }}
                      className="rounded-lg border border-white/15 bg-white/10 px-8 py-3 text-sm font-semibold text-white/80 transition-all hover:bg-white/15"
                    >
                      Browse destinations
                    </motion.button>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="flex flex-wrap items-center gap-6 text-sm text-white/70"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      10,000+ happy travelers
                    </div>
                    <div className="hidden h-4 w-px bg-white/20 sm:block" />
                    <div className="flex items-center gap-2">
                      ⭐ 4.9/5 satisfaction score
                    </div>
                  </motion.div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: 40 }}
                  whileInView={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="relative w-full max-w-sm justify-self-center rounded-[32px] border border-white/15 bg-white/5 p-1 backdrop-blur-2xl"
                >
                  <div className="rounded-[28px] border border-white/10 bg-[#0b1224]/70 p-8">
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm text-white/60">This week&apos;s vibe</p>
                        <p className="mt-2 text-3xl font-semibold text-white">Adventure ready</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                          <p className="text-2xl font-semibold text-blue-200">{bookings.length}</p>
                          <p className="text-xs text-white/60">Active trips</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                          <p className="text-2xl font-semibold text-purple-200">{bookedDestinationNames.size}</p>
                          <p className="text-xs text-white/60">Destinations</p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 p-4 text-sm text-white/75">
                        Keep discovering tailored escapes, curated to match the glow of our landing page experience.
                      </div>
                    </div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0.4, scale: 0.9 }}
                    animate={{ opacity: 0.7, scale: 1 }}
                    transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror' }}
                    className="pointer-events-none absolute -bottom-14 right-8 h-36 w-36 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 blur-3xl"
                  />
                </motion.div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="mb-12"
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {quickStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.08 }}
                    whileHover={{ scale: 1.04 }}
                    className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/8 p-6 shadow-[0_35px_120px_rgba(8,12,24,0.6)] backdrop-blur-2xl transition-transform duration-500"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.accent} opacity-70 transition-opacity duration-500 group-hover:opacity-90`} />
                    <div className="relative flex h-full flex-col justify-between gap-6">
                      <div className="flex items-center justify-between">
                        <span className="text-3xl">{stat.icon}</span>
                        <span className="rounded-full border border-white/25 px-3 py-1 text-xs font-medium text-white/75">
                          Overview
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">{stat.label}</p>
                        <p className="mt-3 text-4xl font-semibold text-white drop-shadow-[0_12px_35px_rgba(129,140,248,0.45)]">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            <motion.nav
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mb-12"
            >
              <div className="flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-2xl">
                {[
                  { id: 'explore', label: 'Explore Destinations', icon: '🗺️' },
                  { id: 'national', label: 'National Trips', icon: '🇮🇳' },
                  { id: 'international', label: 'International Trips', icon: '🌍' },
                  { id: 'bookings', label: 'My Bookings', icon: '🧳' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-all duration-300 ${
                      activeTab === tab.id ? 'text-white' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <span className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-blue-500/40 via-purple-500/35 to-pink-500/35" />
                    )}
                  </button>
                ))}
              </div>
            </motion.nav>

            {/* Tab Content */}
        {activeTab === 'explore' && (
          <motion.section
            id="explore"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-16 space-y-10"
          >
            <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <div>
                <h2 className="text-3xl font-semibold leading-tight text-white drop-shadow-[0_10px_35px_rgba(59,130,246,0.35)]">
                  Explore Destinations
                </h2>
                <p className="mt-2 text-sm text-white/70">
                  Browse {availableDestinations.length} luminous escapes ready for your next adventure.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/70">
                  {selectedDestinations.length} selected
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setShowTripSelector(true)}
                  className="rounded-full border border-white/20 px-6 py-2 text-xs font-medium text-white/80 transition-all hover:bg-white/10"
                >
                  Choose trip type
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleShowAllDestinations}
                  className="rounded-full border border-white/20 px-6 py-2 text-xs font-medium text-white/80 transition-all hover:bg-white/10"
                >
                  Show all
                </motion.button>
                {selectedDestinations.length >= 2 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={calculateShortestPath}
                    className="relative overflow-hidden rounded-full border border-cyan-300/60 px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-100 transition-all duration-300"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-cyan-500/40 via-blue-500/30 to-indigo-500/40 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                    <span className="relative">Calculate Route</span>
                  </motion.button>
                )}
                {selectedDestinations.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowBookingForm(true)}
                    className="relative overflow-hidden rounded-full border border-emerald-300/60 px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-100 transition-all duration-300"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-emerald-500/40 via-green-500/30 to-teal-500/40 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                    <span className="relative">Book Selected</span>
                  </motion.button>
                )}
              </div>
            </div>

            {availableDestinations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="flex flex-col items-center justify-center rounded-[32px] border border-white/10 bg-white/8 px-8 py-16 text-center text-white/80 backdrop-blur-2xl"
              >
                <div className="mb-4 text-5xl drop-shadow-[0_15px_45px_rgba(251,191,36,0.35)]">🎉</div>
                <h3 className="text-2xl font-semibold text-white">All Destinations Booked!</h3>
                <p className="mt-3 max-w-xl text-sm text-white/70">
                  You have explored every getaway in our catalogue. Dive into your bookings to relive the magic or craft fresh adventures.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {availableDestinations.map((destination, index) => {
                  const isSelected = selectedDestinations.some((d) => d.destinationId === destination.destinationId)
                  return (
                    <motion.div
                      key={destination.destinationId}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.04 }}
                      whileHover={{ y: -8, scale: 1.015 }}
                      className={`group relative overflow-hidden rounded-[28px] border p-1 transition-all duration-500 ${
                        isSelected
                          ? 'border-blue-400/70 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 shadow-[0_35px_90px_rgba(59,130,246,0.45)]'
                          : 'border-white/10 bg-white/8 shadow-[0_25px_70px_rgba(8,12,24,0.55)] hover:border-white/20 hover:shadow-[0_40px_120px_rgba(59,130,246,0.35)]'
                      }`}
                      onClick={() => handleDestinationSelect(destination)}
                    >
                      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent" />
                      </div>
                      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1224]/65 backdrop-blur-2xl">
                        <div className="aspect-[4/3] overflow-hidden">
                          <img
                            src={destination.imageUrl || `https://images.unsplash.com/photo-${1500000000000 + destination.destinationId}?q=80&w=800&auto=format&fit=crop`}
                            alt={destination.name}
                            className="h-full w-full object-cover transition-transform duration-[650ms] group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-80" />
                        </div>
                        <div className="relative space-y-4 p-6">
                          <div className="flex items-center justify-between text-xs font-medium text-white/70">
                            <span>Signature escape</span>
                            {isSelected && <span className="text-xs font-medium text-cyan-200">Selected</span>}
                          </div>
                          <h3 className="text-xl font-semibold text-white drop-shadow-[0_12px_35px_rgba(59,130,246,0.45)] group-hover:text-cyan-200">
                            {destination.name}
                          </h3>
                          <p className="text-sm text-white/70 line-clamp-2">
                            {destination.description || 'Beautiful destination waiting to be explored'}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-semibold bg-gradient-to-r from-cyan-200 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                              ₹{destination.price.toLocaleString()}
                            </span>
                            <span className="text-xs text-white/60">Per night</span>
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                          className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_45px_rgba(59,130,246,0.45)]"
                        >
                          <span className="text-lg font-bold text-white">✓</span>
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.section>
        )}

        {/* National Trips Tab */}
        {activeTab === 'national' && (
          <motion.section
            id="national"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-16 space-y-12"
          >
            <div className="flex flex-col gap-6 rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 p-6 backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl space-y-3">
                <h2 className="text-3xl font-semibold text-white drop-shadow-[0_12px_35px_rgba(251,191,36,0.35)]">
                  National Trips
                </h2>
                <p className="text-white/70">
                  Discover curated journeys across India with immersive cultural getaways and boutique stays infused with heritage charm.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/70">
                  {selectedDestinations.length} selected
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setShowTripSelector(true)}
                  className="rounded-full border border-white/20 px-6 py-2 text-xs font-medium text-white/80 transition-all hover:bg-white/10"
                >
                  Choose trip type
                </motion.button>
                {selectedDestinations.length >= 2 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={calculateShortestPath}
                    className="rounded-full border border-amber-300/50 px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.3em] text-amber-100 transition-all duration-300 hover:shadow-[0_0_45px_rgba(251,191,36,0.35)]"
                  >
                    Calculate Route
                  </motion.button>
                )}
                {selectedDestinations.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowBookingForm(true)}
                    className="rounded-full border border-white/25 px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.3em] text-white/80 transition-all duration-300 hover:bg-white/10"
                  >
                    Book Selected
                  </motion.button>
                )}
              </div>
            </div>

            {devotionalDestinations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-amber-200 drop-shadow-[0_12px_35px_rgba(251,191,36,0.35)]">
                    Devotional Retreats
                  </h3>
                  <p className="max-w-2xl text-white/70">
                    Seek serene pilgrimages, temple circuits, and soulful escapes curated for spiritual rejuvenation.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {devotionalDestinations.map((destination, index) => {
                    const isSelected = selectedDestinations.some((d) => d.destinationId === destination.destinationId)
                    return (
                      <motion.div
                        key={destination.destinationId}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.05 }}
                        whileHover={{ y: -8, scale: 1.015 }}
                        className={`group relative overflow-hidden rounded-[28px] border p-1 transition-all duration-500 ${
                          isSelected
                            ? 'border-amber-300/70 bg-gradient-to-br from-amber-500/25 via-orange-500/20 to-rose-500/20 shadow-[0_35px_90px_rgba(251,191,36,0.4)]'
                            : 'border-amber-200/20 bg-amber-500/10 shadow-[0_25px_70px_rgba(88,28,135,0.4)] hover:border-amber-200/40 hover:shadow-[0_40px_120px_rgba(251,191,36,0.35)]'
                        }`}
                        onClick={() => handleDestinationSelect(destination)}
                      >
                        <div className="absolute left-5 top-5 rounded-full border border-amber-200/60 bg-amber-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-100">
                          Devotional
                        </div>
                        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#120807]/70 backdrop-blur-2xl">
                          <div className="aspect-[4/3] overflow-hidden">
                            <img
                              src={destination.imageUrl || `https://images.unsplash.com/photo-${1500000000000 + destination.destinationId}?q=80&w=800&auto=format&fit=crop`}
                              alt={destination.name}
                              className="h-full w-full object-cover transition-transform duration-[650ms] group-hover:scale-110"
                              loading="lazy"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#120807]/85 via-[#120807]/20 to-transparent" />
                          </div>
                          <div className="relative space-y-4 p-6">
                            <h3 className="text-xl font-semibold text-white drop-shadow-[0_12px_35px_rgba(251,191,36,0.45)] group-hover:text-amber-200">
                              {destination.name}
                            </h3>
                            <p className="text-sm text-amber-100/80 line-clamp-2">
                              {destination.description || 'Sacred experiences across India'}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-semibold bg-gradient-to-r from-amber-200 via-orange-200 to-rose-200 bg-clip-text text-transparent">
                                ₹{destination.price.toLocaleString()}
                              </span>
                              <span className="text-xs uppercase tracking-[0.3em] text-white/60">Per Night</span>
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-[0_0_45px_rgba(251,191,36,0.45)]"
                          >
                            <span className="text-lg font-bold text-[#120807]">✓</span>
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {remainingNationalDestinations.map((destination, index) => {
                const isSelected = selectedDestinations.some((d) => d.destinationId === destination.destinationId)
                return (
                  <motion.div
                    key={destination.destinationId}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.05 }}
                    whileHover={{ y: -8, scale: 1.015 }}
                    className={`group relative overflow-hidden rounded-[28px] border p-1 transition-all duration-500 ${
                      isSelected
                        ? 'border-cyan-300/70 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 shadow-[0_35px_90px_rgba(59,130,246,0.45)]'
                        : 'border-white/10 bg-white/5 shadow-[0_25px_70px_rgba(8,12,24,0.55)] hover:border-white/20 hover:shadow-[0_40px_120px_rgba(59,130,246,0.35)]'
                    }`}
                    onClick={() => handleDestinationSelect(destination)}
                  >
                    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#050b19]/60 backdrop-blur-2xl">
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={destination.imageUrl || `https://images.unsplash.com/photo-${1500000000000 + destination.destinationId}?q=80&w=800&auto=format&fit=crop`}
                          alt={destination.name}
                          className="h-full w-full object-cover transition-transform duration-[650ms] group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-80" />
                      </div>
                      <div className="relative space-y-4 p-6">
                        <h3 className="text-xl font-semibold text-white drop-shadow-[0_12px_35px_rgba(59,130,246,0.45)] group-hover:text-cyan-200">
                          {destination.name}
                        </h3>
                        <p className="text-sm text-white/70 line-clamp-2">
                          {destination.description || 'Beautiful destination waiting to be explored'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-semibold bg-gradient-to-r from-cyan-200 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                            ₹{destination.price.toLocaleString()}
                          </span>
                          <span className="text-xs uppercase tracking-[0.3em] text-white/60">Per Night</span>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_45px_rgba(59,130,246,0.45)]"
                      >
                        <span className="text-lg font-bold text-white">✓</span>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.section>
        )}

        {/* International Trips Tab */}
        {activeTab === 'international' && (
          <motion.section
            id="international"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-16 space-y-12"
          >
            <div className="flex flex-col gap-6 rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/10 via-blue-600/10 to-purple-600/10 p-6 backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl space-y-3">
                <h2 className="text-3xl font-semibold text-white drop-shadow-[0_12px_35px_rgba(129,140,248,0.35)]">
                  International Trips
                </h2>
                <p className="text-white/70">
                  Traverse global escapes crafted with cosmopolitan flair, exclusive stays, and once-in-a-lifetime experiences.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/70">
                  {selectedDestinations.length} selected
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowTripSelector(true)}
                  className="rounded-full border border-white/20 px-6 py-2 text-xs font-medium text-white/80 transition-all hover:bg-white/10"
                >
                  Choose trip type
                </motion.button>
                {selectedDestinations.length >= 2 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={calculateShortestPath}
                    className="rounded-full border border-cyan-300/60 px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-100 transition-all duration-300 hover:shadow-[0_0_45px_rgba(59,130,246,0.35)]"
                  >
                    Calculate Route
                  </motion.button>
                )}
                {selectedDestinations.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowBookingForm(true)}
                    className="rounded-full border border-white/25 px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.3em] text-white/80 transition-all duration-300 hover:bg-white/10"
                  >
                    Book Selected
                  </motion.button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {internationalDestinations.map((destination, index) => {
                  const isSelected = selectedDestinations.some((d) => d.destinationId === destination.destinationId)
                  return (
                    <motion.div
                      key={destination.destinationId}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.05 }}
                      whileHover={{ y: -8, scale: 1.015 }}
                      className={`group relative overflow-hidden rounded-[28px] border p-1 transition-all duration-500 ${
                        isSelected
                          ? 'border-indigo-300/70 bg-gradient-to-br from-cyan-400/20 via-blue-500/20 to-purple-500/20 shadow-[0_35px_90px_rgba(79,70,229,0.45)]'
                          : 'border-white/10 bg-white/5 shadow-[0_25px_70px_rgba(8,12,24,0.55)] hover:border-white/20 hover:shadow-[0_40px_120px_rgba(99,102,241,0.35)]'
                      }`}
                      onClick={() => handleDestinationSelect(destination)}
                    >
                      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
                      </div>
                      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#050b19]/60 backdrop-blur-2xl">
                        <div className="aspect-[4/3] overflow-hidden">
                          <img
                            src={destination.imageUrl || `https://images.unsplash.com/photo-${1500000000000 + destination.destinationId}?q=80&w=800&auto=format&fit=crop`}
                            alt={destination.name}
                            className="h-full w-full object-cover transition-transform duration-[650ms] group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-80" />
                        </div>
                        <div className="relative space-y-4 p-6">
                          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
                            <span>Global Signature</span>
                            {isSelected && <span className="text-cyan-200">Selected</span>}
                          </div>
                          <h3 className="text-xl font-semibold text-white drop-shadow-[0_12px_35px_rgba(79,70,229,0.45)] group-hover:text-cyan-200">
                            {destination.name}
                          </h3>
                          <p className="text-sm text-white/70 line-clamp-2">
                            {destination.description || 'Beautiful destination waiting to be explored'}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-semibold bg-gradient-to-r from-cyan-200 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                              ₹{destination.price.toLocaleString()}
                            </span>
                            <span className="text-xs text-white/60">Per night</span>
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                          className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_45px_rgba(99,102,241,0.45)]"
                        >
                          <span className="text-lg font-bold text-white">✓</span>
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}
            </div>
          </motion.section>
        )}

        {/* My Bookings Tab */}
        {activeTab === 'bookings' && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="space-y-14"
          >
            <div className="space-y-3">
              <h3 className="text-3xl font-semibold text-white drop-shadow-[0_12px_35px_rgba(59,130,246,0.45)]">
                My Bookings
              </h3>
              <p className="text-sm text-white/70">
                Review ongoing journeys, manage cancellations, and relive past escapes with luminous timelines.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-semibold text-white">Current Bookings</h4>
                <span className="rounded-full border border-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                  Active
                </span>
              </div>
              {bookings.filter((b) => b.cancellationStatus === 'None' || b.cancellationStatus === 'Requested').length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center rounded-[28px] border border-white/10 bg-white/5 px-8 py-12 text-center text-white/70 backdrop-blur-2xl"
                >
                  <div className="mb-3 text-4xl">📅</div>
                  <p>No current bookings</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {bookings
                    .filter((b) => b.cancellationStatus === 'None' || b.cancellationStatus === 'Requested')
                    .map((booking, index) => (
                      <motion.div
                        key={booking.bookingId}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.05 }}
                        className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-[0_35px_120px_rgba(8,12,24,0.65)]"
                      >
                        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20" />
                        </div>
                        <div className="relative space-y-6">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="space-y-2">
                              <h4 className="text-xl font-semibold text-white drop-shadow-[0_12px_35px_rgba(59,130,246,0.45)]">
                                Booking #{booking.bookingId}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2">
                                <CancellationBadge cancellationStatus={booking.cancellationStatus} />
                                {booking.latestCancellation?.status === 'Pending' && (
                                  <CancellationBadge cancellationStatus="Requested" emphasis />
                                )}
                              </div>
                            </div>
                            <span className="rounded-full border border-emerald-300/40 px-4 py-2 text-lg font-semibold text-emerald-200 shadow-[0_0_35px_rgba(34,197,94,0.35)]">
                              ₹{booking.totalPrice.toLocaleString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-5 text-sm md:grid-cols-4">
                            <div className="space-y-1">
                              <span className="text-white/60">Guests</span>
                              <div className="text-white/90">{booking.guests}</div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-white/60">Nights</span>
                              <div className="text-white/90">{booking.nights}</div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-white/60">Date</span>
                              <div className="text-white/90">
                                {new Date(booking.bookingDate).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-white/60">Destinations</span>
                              <div className="text-white/90">{booking.destinations.join(', ')}</div>
                            </div>
                          </div>

                          {booking.latestCancellation && (
                            <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4">
                              <CancellationDetails latestCancellation={booking.latestCancellation} />
                            </div>
                          )}

                          <div className="flex flex-col gap-3 pt-2 md:flex-row">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleRequestCancellation(booking.bookingId)}
                              className="relative flex-1 overflow-hidden rounded-full border border-rose-400/40 px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-rose-200 transition-all duration-300"
                            >
                              <span className="absolute inset-0 bg-gradient-to-r from-rose-500/25 via-pink-500/25 to-red-500/25 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                              <span className="relative">Request Cancellation</span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleExploreDestinations(booking)}
                              className="relative flex-1 overflow-hidden rounded-full border border-blue-400/40 px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-blue-200 transition-all duration-300"
                            >
                              <span className="absolute inset-0 bg-gradient-to-r from-blue-500/25 via-indigo-500/25 to-purple-500/25 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                              <span className="relative flex items-center justify-center gap-2">
                                🗺️ Explore Destinations
                              </span>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-semibold text-white">Cancelled Bookings</h4>
                <span className="rounded-full border border-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                  Archive
                </span>
              </div>
              {bookings.filter((b) => b.cancellationStatus === 'Approved').length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center rounded-[28px] border border-white/10 bg-white/5 px-8 py-12 text-center text-white/70 backdrop-blur-2xl"
                >
                  <div className="mb-3 text-4xl">✅</div>
                  <p>No cancelled bookings</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {bookings
                    .filter((b) => b.cancellationStatus === 'Approved')
                    .map((booking, index) => (
                      <motion.div
                        key={booking.bookingId}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.05 }}
                        className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-8 opacity-80 backdrop-blur-2xl shadow-[0_35px_120px_rgba(8,12,24,0.45)]"
                      >
                        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-500/20 via-slate-600/20 to-slate-700/20" />
                        </div>
                        <div className="relative space-y-6">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="space-y-2">
                              <h4 className="text-xl font-semibold text-white">
                                Booking #{booking.bookingId}
                              </h4>
                              <CancellationBadge cancellationStatus={booking.cancellationStatus} />
                            </div>
                            <span className="rounded-full border border-white/20 px-4 py-2 text-lg font-semibold text-white/60">
                              ₹{booking.totalPrice.toLocaleString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-5 text-sm md:grid-cols-4">
                            <div className="space-y-1">
                              <span className="text-white/60">Guests</span>
                              <div className="text-white/90">{booking.guests}</div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-white/60">Nights</span>
                              <div className="text-white/90">{booking.nights}</div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-white/60">Date</span>
                              <div className="text-white/90">
                                {new Date(booking.bookingDate).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-white/60">Destinations</span>
                              <div className="text-white/90">{booking.destinations.join(', ')}</div>
                            </div>
                          </div>

                          {booking.latestCancellation && (
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                              <CancellationDetails latestCancellation={booking.latestCancellation} />
                            </div>
                          )}

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleExploreDestinations(booking)}
                            className="relative w-full overflow-hidden rounded-full border border-white/20 px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white/70 transition-all duration-300"
                          >
                            <span className="absolute inset-0 bg-gradient-to-r from-slate-500/25 via-slate-600/25 to-slate-700/25 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                            <span className="relative flex items-center justify-center gap-2">
                              🗺️ View Destinations
                            </span>
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* Shortest Path Results */}
        {shortestPath && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-16"
            ref={routeSectionRef}
          >
            <div className="mb-8 space-y-2">
              <h3 className="text-3xl font-semibold text-white drop-shadow-[0_12px_35px_rgba(59,130,246,0.45)]">
                Optimal Route
              </h3>
              <p className="text-sm text-white/70">
                We stitched your selections into the most efficient itinerary for a seamless adventure flow.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-[0_35px_120px_rgba(8,12,24,0.65)]"
              >
                <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20" />
                </div>
                <div className="relative space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Total Distance</span>
                    <span className="text-3xl font-semibold bg-gradient-to-r from-cyan-200 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                      {shortestPath.distanceKm.toFixed(1)} km
                    </span>
                  </div>
                  <div className="space-y-3">
                    <span className="text-sm uppercase tracking-[0.3em] text-white/60">Recommended Order</span>
                    <div className="flex flex-wrap gap-3">
                      {shortestPath.order.map((index, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.08 }}
                          className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/85 shadow-[0_0_35px_rgba(59,130,246,0.25)]"
                        >
                          {i + 1}. {selectedDestinations[index]?.name}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl shadow-[0_35px_120px_rgba(8,12,24,0.65)]"
              >
                <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-blue-500/20" />
                </div>
                <div className="relative space-y-4">
                  <h4 className="text-lg font-semibold text-white">Route Map</h4>
                  <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-2">
                    <RouteMap
                      destinations={selectedDestinations}
                      routeOrder={shortestPath.order}
                      apiKey={(import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>
        )}

        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-16"
        >
          <Feedback />
        </motion.section>
      </div>
    </main>
  </div>

      {/* Booking Form Modal */}
      <AnimatePresence>
        {showBookingForm && (
          <BookingForm
            destinations={selectedDestinations}
            onClose={() => setShowBookingForm(false)}
            onSuccess={handleBookingSuccess}
          />
        )}
      </AnimatePresence>

      {/* Email Confirmation Modal */}
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

      {/* Cancellation Request Modal */}
      <AnimatePresence>
        {showCancellationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0e1512] rounded-2xl border border-white/20 p-6 max-w-md w-full"
            >
              <h3 className="text-2xl font-semibold text-white mb-4">Request Cancellation</h3>
              <p className="text-white/70 text-sm mb-4">
                Are you sure you want to request a cancellation for booking #{pendingBookingId}?
              </p>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full min-h-[120px] rounded-lg bg-white/5 border border-white/10 text-white p-3 focus:outline-none focus:border-white/30"
                placeholder="Let us know why you need to cancel..."
              />
              {cancellationError && (
                <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {cancellationError}
                </div>
              )}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCancellationModal(false)
                    setPendingBookingId(null)
                    setCancellationReason('')
                  }}
                  className="px-4 py-2 rounded-lg border border-white/20 text-white/80 hover:bg-white/10 transition"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleSubmitCancellation}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition"
                >
                  Confirm Cancellation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancellation Center Drawer */}
      <AnimatePresence>
        {showCancellationCenter && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[420px] md:w-[480px] bg-[#0e1512] border-l border-white/10 z-50 shadow-2xl"
          >
            <CancellationCenter
              bookings={bookings}
              onClose={() => setShowCancellationCenter(false)}
              onRequestCancellation={handleRequestCancellation}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Destination Details Modal */}
      <AnimatePresence>
        {showDestinationDetailsModal && selectedBookingForDestinations && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-6"
            onClick={() => setShowDestinationDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-[#0e1512] rounded-2xl border border-white/20 p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Your Destinations
                </h3>
                <button
                  onClick={() => setShowDestinationDetailsModal(false)}
                  className="text-white/70 hover:text-white transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="text-lg font-semibold mb-2">Booking Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-white/70">Booking ID:</span>
                    <div className="text-white font-semibold">#{selectedBookingForDestinations.bookingId}</div>
                  </div>
                  <div>
                    <span className="text-white/70">Guests:</span>
                    <div className="text-white">{selectedBookingForDestinations.guests}</div>
                  </div>
                  <div>
                    <span className="text-white/70">Nights:</span>
                    <div className="text-white">{selectedBookingForDestinations.nights}</div>
                  </div>
                  <div>
                    <span className="text-white/70">Total:</span>
                    <div className="text-green-400 font-bold">₹{selectedBookingForDestinations.totalPrice.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-semibold">Destinations Included:</h4>
                {selectedBookingForDestinations.destinations.map((destName, index) => {
                  const destination = destinations.find(d => d.name === destName)
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-white/20 hover:shadow-xl hover:shadow-white/5 transition-all"
                    >
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                          <div className="aspect-[4/3] overflow-hidden rounded-lg">
                            <img
                              src={destination?.imageUrl || `https://images.unsplash.com/photo-${1500000000000 + index}?q=80&w=800&auto=format&fit=crop`}
                              alt={destName}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <h5 className="text-2xl font-bold text-white mb-3">{destName}</h5>
                          <p className="text-white/70 mb-4">
                            {destination?.description || 'A beautiful destination waiting for you to explore. Get ready for an amazing adventure!'}
                          </p>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-white/60 text-sm">Price per night:</span>
                              <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                ₹{destination?.price.toLocaleString() || 'N/A'}
                              </div>
                            </div>
                            {destination?.latitude && destination?.longitude && (
                              <div className="text-right">
                                <span className="text-white/60 text-sm">Coordinates:</span>
                                <div className="text-white text-sm">
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

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setShowDestinationDetailsModal(false)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}


