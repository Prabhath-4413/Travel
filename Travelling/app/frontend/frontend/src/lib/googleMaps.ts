// Google Maps utility functions
let googleMapsLoadingPromise: Promise<void> | null = null;

export const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== "undefined" && !!(window as any).google?.maps;
};

export const loadGoogleMapsAPI = (apiKey: string): Promise<void> => {
  if (isGoogleMapsLoaded()) {
    return Promise.resolve();
  }
  if (googleMapsLoadingPromise) {
    return googleMapsLoadingPromise;
  }

  googleMapsLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-gmaps-loaded="1"]',
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google Maps")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-gmaps-loaded", "1");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return googleMapsLoadingPromise;
};
