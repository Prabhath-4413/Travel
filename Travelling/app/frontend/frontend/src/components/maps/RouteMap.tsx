import { useEffect, useRef, useState } from 'react'
import { loadGoogleMapsAPI, isGoogleMapsLoaded } from '../../lib/googleMaps'

interface RouteMapProps {
  destinations: Array<{
    destinationId: number
    name: string
    latitude?: number
    longitude?: number
  }>
  routeOrder?: number[]
  apiKey: string
}

export default function RouteMap({ destinations, routeOrder, apiKey }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load Google Maps API first
    loadGoogleMapsAPI(apiKey)
      .then(() => {
        setIsLoading(false)
        setError(null)
      })
      .catch((err) => {
        setIsLoading(false)
        setError(err.message)
      })
  }, [apiKey])

  useEffect(() => {
    if (!mapRef.current || destinations.length === 0 || !isGoogleMapsLoaded()) return

    // Filter destinations that have coordinates
    const destinationsWithCoords = destinations.filter(d => d.latitude && d.longitude)
    if (destinationsWithCoords.length === 0) return

    // Create the map
    const map = new google.maps.Map(mapRef.current, {
      zoom: 6,
      center: {
        lat: destinationsWithCoords[0].latitude!,
        lng: destinationsWithCoords[0].longitude!
      },
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry.fill',
          stylers: [{ weight: '2.00' }]
        },
        {
          featureType: 'all',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#9c9c9c' }]
        },
        {
          featureType: 'all',
          elementType: 'labels.text',
          stylers: [{ visibility: 'on' }]
        },
        {
          featureType: 'landscape',
          elementType: 'all',
          stylers: [{ color: '#f2f2f2' }]
        },
        {
          featureType: 'landscape',
          elementType: 'geometry.fill',
          stylers: [{ color: '#ffffff' }]
        },
        {
          featureType: 'landscape.man_made',
          elementType: 'geometry.fill',
          stylers: [{ color: '#ffffff' }]
        },
        {
          featureType: 'poi',
          elementType: 'all',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'road',
          elementType: 'all',
          stylers: [{ saturation: -100 }, { lightness: 45 }]
        },
        {
          featureType: 'road',
          elementType: 'geometry.fill',
          stylers: [{ color: '#eeeeee' }]
        },
        {
          featureType: 'road',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#7b7b7b' }]
        },
        {
          featureType: 'road',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#ffffff' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'all',
          stylers: [{ visibility: 'simplified' }]
        },
        {
          featureType: 'road.arterial',
          elementType: 'labels.icon',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit',
          elementType: 'all',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'water',
          elementType: 'all',
          stylers: [{ color: '#46bcec' }, { visibility: 'on' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry.fill',
          stylers: [{ color: '#c8d7d4' }]
        },
        {
          featureType: 'water',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#070707' }]
        },
        {
          featureType: 'water',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#ffffff' }]
        }
      ]
    })

    // Create markers for each destination
    const markers: google.maps.Marker[] = []
    const infoWindows: google.maps.InfoWindow[] = []

    destinationsWithCoords.forEach((destination, index) => {
      const marker = new google.maps.Marker({
        position: {
          lat: destination.latitude!,
          lng: destination.longitude!
        },
        map: map,
        title: destination.name,
        label: {
          text: (index + 1).toString(),
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px'
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        }
      })

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold text-gray-800">${destination.name}</h3>
            <p class="text-sm text-gray-600">Stop ${index + 1}</p>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindows.forEach(iw => iw.close())
        infoWindow.open(map, marker)
      })

      markers.push(marker)
      infoWindows.push(infoWindow)
    })

    // Draw route if we have an order
    if (routeOrder && routeOrder.length > 1) {
      const directionsService = new google.maps.DirectionsService()
      const directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      })

      directionsRenderer.setMap(map)

      // Create waypoints for the route
      const waypoints = routeOrder.slice(1, -1).map(index => ({
        location: {
          lat: destinationsWithCoords[index].latitude!,
          lng: destinationsWithCoords[index].longitude!
        },
        stopover: true
      }))

      const request: google.maps.DirectionsRequest = {
        origin: {
          lat: destinationsWithCoords[routeOrder[0]].latitude!,
          lng: destinationsWithCoords[routeOrder[0]].longitude!
        },
        destination: {
          lat: destinationsWithCoords[routeOrder[routeOrder.length - 1]].latitude!,
          lng: destinationsWithCoords[routeOrder[routeOrder.length - 1]].longitude!
        },
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false
      }

      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(result)
        }
      })
    }

    // Fit map to show all markers
    if (markers.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      markers.forEach(marker => {
        bounds.extend(marker.getPosition()!)
      })
      map.fitBounds(bounds)
    }

    return () => {
      // Cleanup
      markers.forEach(marker => marker.setMap(null))
      infoWindows.forEach(infoWindow => infoWindow.close())
    }
  }, [destinations, routeOrder, isLoading])

  if (error) {
    return (
      <div className="w-full h-96 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
        <div className="text-center p-6">
          <p className="text-white/70 mb-2">Map unavailable</p>
          <p className="text-white/50 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full h-96 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center bg-white/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/70">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-white/10">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}
