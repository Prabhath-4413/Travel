import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import L, { LatLngTuple } from "leaflet"
import { useEffect, useMemo, useState } from "react"
import "leaflet/dist/leaflet.css"

interface Destination {
  destinationId: number
  name: string
  latitude: number
  longitude: number
}

interface RouteMapProps {
  destinations?: Destination[]
}

interface RouteSummary {
  distance: number
  duration: number
  stops: number
}

interface RouteResult {
  coordinates: LatLngTuple[]
  orderedDestinations: Destination[]
  summary: RouteSummary
  message: string | null
}

// 🧍 User Marker Icon
const userIcon = L.icon({
  iconUrl: "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-blue.png",
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [0, -40],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

// 📍 Destination Numbered Markers
const createNumberedIcon = (number: number) =>
  L.divIcon({
    html: `
      <div style="
        background-color: #dc2626;
        color: white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0,0,0,0.4);
      ">${number}</div>
    `,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })

// 🌍 Haversine fallback for distance
const toRadians = (value: number) => (value * Math.PI) / 180

const haversineDistanceKm = (from: LatLngTuple, to: LatLngTuple) => {
  const R = 6371
  const dLat = toRadians(to[0] - from[0])
  const dLon = toRadians(to[1] - from[1])
  const lat1 = toRadians(from[0])
  const lat2 = toRadians(to[0])
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const buildFallbackPolyline = (origin: LatLngTuple, points: Destination[]) => {
  const path: LatLngTuple[] = [origin]
  let previous = origin
  let totalDistance = 0
  points.forEach((p) => {
    const next: LatLngTuple = [p.latitude, p.longitude]
    path.push(next)
    totalDistance += haversineDistanceKm(previous, next)
    previous = next
  })
  const summary: RouteSummary = {
    distance: totalDistance,
    duration: 0,
    stops: points.length,
  }
  return { path, summary }
}

// 🧭 OpenRouteService API (preferred)
const fetchOpenRouteServiceRoute = async (
  coords: [number, number][],
  destinations: Destination[]
): Promise<RouteResult | null> => {
  const apiKey = import.meta.env.VITE_OPENROUTESERVICE_API_KEY;
  if (!apiKey) return null

  const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ coordinates: coords }),
  })

  if (!response.ok) return null
  const data = await response.json()
  const feature = data.features?.[0]
  if (!feature?.geometry?.coordinates) return null

  const routeCoordinates: LatLngTuple[] = feature.geometry.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng]
  )

  const summary: RouteSummary = feature.properties?.summary
    ? {
        distance: feature.properties.summary.distance / 1000,
        duration: feature.properties.summary.duration / 60,
        stops: destinations.length,
      }
    : { distance: 0, duration: 0, stops: destinations.length }

  return {
    coordinates: routeCoordinates,
    orderedDestinations: [...destinations],
    summary,
    message: "Routing powered by OpenRouteService.",
  }
}

// 🗺️ OSRM Fallback
const fetchOsrmRoute = async (
  coords: [number, number][],
  destinations: Destination[]
): Promise<RouteResult | null> => {
  const url = `https://router.project-osrm.org/trip/v1/driving/${coords
    .map((c) => c.join(","))
    .join(";")}?source=first&roundtrip=false&geometries=geojson&overview=full`
  const response = await fetch(url)
  if (!response.ok) return null

  const data = await response.json()
  if (!data.trips?.[0]) return null

  const trip = data.trips[0]
  const routeCoordinates: LatLngTuple[] = trip.geometry.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng]
  )

  const summary: RouteSummary = {
    distance: trip.distance / 1000,
    duration: trip.duration / 60,
    stops: destinations.length,
  }

  return {
    coordinates: routeCoordinates,
    orderedDestinations: [...destinations],
    summary,
    message: "Routing powered by OSRM.",
  }
}

// 📍 RouteLayer
function RouteLayer({
  userLocation,
  destinations,
  setSummary,
  setRoutingMessage,
}: {
  userLocation: LatLngTuple
  destinations: Destination[]
  setSummary: (v: RouteSummary) => void
  setRoutingMessage: (v: string | null) => void
}) {
  const [routeCoords, setRouteCoords] = useState<LatLngTuple[]>([])
  const [optimizedOrder, setOptimizedOrder] = useState<Destination[]>([])
  const map = useMap()

  useEffect(() => {
    if (destinations.length < 2) {
      setRouteCoords([])
      setOptimizedOrder([...destinations])
      setSummary({ distance: 0, duration: 0, stops: destinations.length })
      setRoutingMessage(null)
      return
    }

    let cancelled = false

    const run = async () => {
      const coords: [number, number][] = [
        [userLocation[1], userLocation[0]], 
        ...destinations.map((d) => [d.longitude, d.latitude]),
      ]

      try {
        // 1️⃣ Try OpenRouteService first
        const orsRoute = await fetchOpenRouteServiceRoute(coords, destinations)
        if (orsRoute) {
          if (cancelled) return
          setRouteCoords(orsRoute.coordinates)
          setOptimizedOrder([...destinations])
          setSummary(orsRoute.summary)
          setRoutingMessage(orsRoute.message)
          map.fitBounds(L.latLngBounds(orsRoute.coordinates), { padding: [50, 50] })
          return
        }

        // 2️⃣ Try OSRM next
        const osrmRoute = await fetchOsrmRoute(coords, destinations)
        if (osrmRoute) {
          if (cancelled) return
          setRouteCoords(osrmRoute.coordinates)
          setOptimizedOrder([...destinations])
          setSummary(osrmRoute.summary)
          setRoutingMessage(osrmRoute.message)
          map.fitBounds(L.latLngBounds(osrmRoute.coordinates), { padding: [50, 50] })
          return
        }

        // 3️⃣ Fallback
        const fallback = buildFallbackPolyline(userLocation, destinations)
        setRouteCoords(fallback.path)
        setOptimizedOrder([...destinations])
        setSummary(fallback.summary)
        setRoutingMessage("Routing service not available for this region.")
        map.fitBounds(L.latLngBounds(fallback.path), { padding: [50, 50] })
      } catch (err) {
        console.error("Route fetch failed:", err)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [userLocation, destinations, map, setSummary, setRoutingMessage])

  return (
    <>
      {routeCoords.length > 1 && (
        <Polyline positions={routeCoords} color="#2563eb" weight={5} opacity={0.8} />
      )}

      {optimizedOrder.map((d, i) => (
        <Marker key={d.destinationId} position={[d.latitude, d.longitude]} icon={createNumberedIcon(i + 1)}>
          <Popup><b>📍 Stop {i + 1}: {d.name}</b></Popup>
        </Marker>
      ))}
    </>
  )
}

// 🌐 Main RouteMap Component
export default function RouteMap({ destinations }: RouteMapProps) {
  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null)
  const [summary, setSummary] = useState<RouteSummary>({ distance: 0, duration: 0, stops: 0 })
  const [routingMessage, setRoutingMessage] = useState<string | null>(null)

  const sanitizedDestinations = useMemo(() => (destinations ? [...destinations] : []), [destinations])

  const selectionMessage =
    sanitizedDestinations.length === 0
      ? "Select destinations to build your route."
      : sanitizedDestinations.length === 1
      ? "Select at least 2 destinations to build a route."
      : null

  const displayMessage = selectionMessage ?? routingMessage

  useEffect(() => {
    let cancelled = false
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!cancelled) setUserLocation([pos.coords.latitude, pos.coords.longitude])
      },
      () => {
        if (!cancelled) setUserLocation([17.385, 78.4867]) // Hyderabad fallback
      },
      { enableHighAccuracy: true }
    )
    return () => {
      cancelled = true
    }
  }, [])

  if (!userLocation) {
    return <div className="text-center text-gray-400 p-6">📍 Detecting your location...</div>
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full h-[80vh] rounded-lg overflow-hidden shadow-lg border border-gray-700">
        <MapContainer center={userLocation} zoom={6} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

          <Marker position={userLocation} icon={userIcon}>
            <Popup>🧍 You are here</Popup>
          </Marker>

          <RouteLayer
            userLocation={userLocation}
            destinations={sanitizedDestinations}
            setSummary={setSummary}
            setRoutingMessage={setRoutingMessage}
          />
        </MapContainer>
      </div>

      {displayMessage && (
        <div className="bg-[#0f172a] text-slate-200 border border-blue-500/40 mt-4 px-6 py-3 rounded-xl shadow-md text-center w-[90%] md:w-[50%]">
          {displayMessage}
        </div>
      )}

      {summary.distance > 0 && sanitizedDestinations.length >= 2 && (
        <div className="bg-[#0f172a] text-white mt-4 px-6 py-3 rounded-xl shadow-md text-center w-[90%] md:w-[50%]">
          <h3 className="text-lg font-semibold mb-1">📍 Route Summary</h3>
          <p>🛣️ Total Distance: <span className="font-bold text-blue-400">{summary.distance.toFixed(2)} km</span></p>
          <p>⏱️ Estimated Time: <span className="font-bold text-blue-400">{Math.round(summary.duration)} mins</span></p>
          <p>🎯 Stops: <span className="font-bold text-blue-400">{summary.stops}</span></p>
        </div>
      )}
    </div>
  )
}
