import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

interface Destination {
  destinationId: number;
  name: string;
  latitude: number;
  longitude: number;
}

interface RouteMapProps {
  destinations?: Destination[];
}

// ✅ Blue icon for user location
const userIcon = L.icon({
  iconUrl:
    "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-blue.png",
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [0, -40],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ✅ Custom numbered icons (1, 2, 3...)
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
  });

// ✅ Handles route calculation & marker rendering
function RouteLayer({
  userLocation,
  destinations,
  setSummary,
}: {
  userLocation: [number, number];
  destinations: Destination[];
  setSummary: (data: { distance: number; duration: number; stops: number }) => void;
}) {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [optimizedOrder, setOptimizedOrder] = useState<Destination[]>([]);
  const map = useMap();

  useEffect(() => {
    if (!userLocation || destinations.length === 0) return;

    // Build coords for OSRM request (lng, lat)
    const coords = [
      [userLocation[1], userLocation[0]],
      ...destinations.map((d) => [d.longitude, d.latitude]),
    ];

    const url = `https://router.project-osrm.org/trip/v1/driving/${coords
      .map((c) => c.join(","))
      .join(";")}?source=first&roundtrip=false&geometries=geojson&overview=full`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!data.trips || !data.trips[0]) return;
        const route = data.trips[0];

        // Convert geometry to [lat, lng]
        const newCoords = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );
        setRouteCoords(newCoords);

        // Fix: waypoints already come in optimized order, use that directly
        const order = route.waypoints
          .slice(1)
          .map((wp: any, i: number) => ({
            ...destinations[i],
            latitude: wp.location[1],
            longitude: wp.location[0],
          }));
        setOptimizedOrder(order);

        setSummary({
          distance: route.distance / 1000,
          duration: route.duration / 60,
          stops: order.length,
        });

        map.fitBounds(L.latLngBounds(newCoords), { padding: [50, 50] });
      })
      .catch((err) => console.error("Route fetch error:", err));
  }, [userLocation, destinations, map, setSummary]);

  return (
    <>
      {routeCoords.length > 0 && (
        <Polyline positions={routeCoords} color="#2563eb" weight={5} opacity={0.8} />
      )}

      {/* ✅ Render numbered destination pins */}
      {optimizedOrder.map((d, index) => (
        <Marker
          key={d.destinationId}
          position={[d.latitude, d.longitude]}
          icon={createNumberedIcon(index + 1)}
        >
          <Popup>
            <b>📍 Stop {index + 1}: {d.name}</b>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default function RouteMap({ destinations }: RouteMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [summary, setSummary] = useState({ distance: 0, duration: 0, stops: 0 });

  // ✅ Default demo destinations
  const defaultDestinations: Destination[] = [
    { destinationId: 1, name: "Hyderabad", latitude: 17.385, longitude: 78.4867 },
    { destinationId: 2, name: "Goa", latitude: 15.2993, longitude: 74.124 },
    { destinationId: 3, name: "Bangalore", latitude: 12.9716, longitude: 77.5946 },
  ];

  const activeDestinations = destinations && destinations.length > 0 ? destinations : defaultDestinations;

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      (err) => {
        console.warn("Location not found, using fallback:", err);
        setUserLocation([17.385, 78.4867]); // Hyderabad fallback
      },
      { enableHighAccuracy: true }
    );
  }, []);

  if (!userLocation)
    return <div className="text-center text-gray-400 p-6">📍 Detecting your location...</div>;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full h-[80vh] rounded-lg overflow-hidden shadow-lg border border-gray-700">
        <MapContainer center={userLocation} zoom={6} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* 🧍 Your current location */}
          <Marker position={userLocation} icon={userIcon}>
            <Popup>🧍 You are here</Popup>
          </Marker>

          {/* 🚗 Route and stops */}
          <RouteLayer
            userLocation={userLocation}
            destinations={activeDestinations}
            setSummary={setSummary}
          />
        </MapContainer>
      </div>

      {/* 📊 Route summary */}
      {summary.distance > 0 && (
        <div className="bg-[#0f172a] text-white mt-4 px-6 py-3 rounded-xl shadow-md text-center w-[90%] md:w-[50%]">
          <h3 className="text-lg font-semibold mb-1">📍 Route Summary</h3>
          <p>
            🛣️ Total Distance:{" "}
            <span className="font-bold text-blue-400">{summary.distance.toFixed(2)} km</span>
          </p>
          <p>
            ⏱️ Estimated Time:{" "}
            <span className="font-bold text-blue-400">{Math.round(summary.duration)} mins</span>
          </p>
          <p>
            🎯 Stops:{" "}
            <span className="font-bold text-blue-400">{summary.stops}</span>
          </p>
        </div>
      )}
    </div>
  );
}
