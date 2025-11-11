export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

export interface IPLocationResponse {
  latitude: number;
  longitude: number;
  city: string;
  country_name: string;
}

class LocationService {
  private geolocationPromise: Promise<LocationData> | null = null;

  async getCurrentLocation(): Promise<LocationData> {
    // Return cached promise if already fetching
    if (this.geolocationPromise) {
      return this.geolocationPromise;
    }

    this.geolocationPromise = this.fetchLocation();
    return this.geolocationPromise;
  }

  private async fetchLocation(): Promise<LocationData> {
    // Try geolocation API first
    try {
      const position = await this.getGeolocationPosition();
      const locationData = await this.reverseGeocode(
        position.coords.latitude,
        position.coords.longitude,
      );
      return locationData;
    } catch (error) {
      console.log("Geolocation failed, falling back to IP location:", error);
      // Fallback to IP-based location
      return this.getIPLocation();
    }
  }

  private getGeolocationPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      });
    });
  }

  private async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<LocationData> {
    try {
      // Using Nominatim (OpenStreetMap) for reverse geocoding - free and no API key needed
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            "User-Agent": "TravelApp/1.0",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Reverse geocoding failed");
      }

      const data = await response.json();

      return {
        latitude,
        longitude,
        city:
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.display_name?.split(",")[0] ||
          "Unknown City",
        country: data.address?.country || "Unknown Country",
      };
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      // Return coordinates with generic location
      return {
        latitude,
        longitude,
        city: "Your Location",
        country: "Unknown",
      };
    }
  }

  private async getIPLocation(): Promise<LocationData> {
    try {
      const response = await fetch("https://ipapi.co/json/");

      if (!response.ok) {
        throw new Error("IP location failed");
      }

      const data: IPLocationResponse = await response.json();

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        country: data.country_name,
      };
    } catch (error) {
      console.error("IP location error:", error);
      // Default fallback location (Mumbai)
      return {
        latitude: 19.076,
        longitude: 72.8777,
        city: "Mumbai",
        country: "India",
      };
    }
  }
}

export const locationService = new LocationService();
