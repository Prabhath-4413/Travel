import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { destinationsAPI, type Destination } from '../lib/api'

const fallbackDestinations: Destination[] = [
  {
    destinationId: -1,
    name: 'Sample Coastline Escape',
    description: 'Explore our curated escapes while real destinations load.',
    price: 5200,
    imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop',
    latitude: 15.2993,
    longitude: 74.124,
    country: 'Sample',
    city: 'Coast'
  },
  {
    destinationId: -2,
    name: 'Sample Highlands Retreat',
    description: 'Breathe in crisp air and unwind in scenic highlands.',
    price: 4000,
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    latitude: 10.0889,
    longitude: 77.0595,
    country: 'Sample',
    city: 'Highlands'
  },
  {
    destinationId: -3,
    name: 'Sample Island Getaway',
    description: 'Crystal waters and sunset views await.',
    price: 18500,
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop',
    latitude: -8.34,
    longitude: 115.09,
    country: 'Sample',
    city: 'Island'
  }
]

interface DestinationsContextType {
  destinations: Destination[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  setLocal: (updater: (prev: Destination[]) => Destination[]) => void
}

const DestinationsContext = createContext<DestinationsContextType | undefined>(undefined)

export const useDestinations = () => {
  const ctx = useContext(DestinationsContext)
  if (!ctx) throw new Error('useDestinations must be used within DestinationsProvider')
  return ctx
}

export const DestinationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<number | null>(null)

  const load = async () => {
    setIsLoading(true)
    try {
      const data = await destinationsAPI.getAll()
      console.log('DestinationsContext received:', data)
      if (Array.isArray(data) && data.length > 0) {
        setDestinations(data)
        setError(null)
      } else {
        console.warn('Destinations API returned empty list, using fallback sample data')
        setDestinations(fallbackDestinations)
        setError('Destinations unavailable, showing sample experiences')
      }
    } catch (error) {
      console.error('Failed to load destinations', error)
      setDestinations(fallbackDestinations)
      setError('Destinations unavailable, showing sample experiences')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Lightweight polling to reflect admin updates without page refresh
    pollingRef.current = window.setInterval(() => {
      destinationsAPI
        .getAll()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setDestinations(data)
            setError(null)
          }
        })
        .catch((error) => {
          console.error('Background destinations refresh failed', error)
        })
    }, 15000) // 15s

    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current)
    }
  }, [])

  const value = useMemo<DestinationsContextType>(() => ({
    destinations,
    isLoading,
    error,
    refresh: load,
    setLocal: (updater) => setDestinations(prev => updater(prev))
  }), [destinations, isLoading, error])

  return (
    <DestinationsContext.Provider value={value}>
      {children}
    </DestinationsContext.Provider>
  )
}
