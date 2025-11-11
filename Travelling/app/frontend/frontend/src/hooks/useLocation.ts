import { useState, useEffect } from "react";
import { locationService, LocationData } from "../lib/location";

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setLoading(true);
        setError(null);
        const locationData = await locationService.getCurrentLocation();
        setLocation(locationData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to get location");
        console.error("Location hook error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  return { location, loading, error };
}
