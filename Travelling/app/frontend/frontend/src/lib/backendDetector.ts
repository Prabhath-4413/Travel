interface BackendHealthCheck {
  isHealthy: boolean;
  port: number;
  baseUrl: string;
}

interface BackendDetectionResult {
  port: number | null;
  baseUrl: string | null;
  error: string | null;
}

const COMMON_PORTS = [5000, 5001, 5002, 5003, 5004, 5005, 6000, 6001, 6002];
const HEALTH_CHECK_ENDPOINT = "/health";
const DETECTION_TIMEOUT = 3000;

async function checkPort(port: number): Promise<boolean> {
  const baseUrl = `http://localhost:${port}`;
  const healthUrl = `${baseUrl}${HEALTH_CHECK_ENDPOINT}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DETECTION_TIMEOUT);

    const response = await fetch(healthUrl, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

export async function detectBackendPort(): Promise<BackendDetectionResult> {
  const envPort = import.meta.env.VITE_API_URL?.split(":").pop();
  const defaultPort = envPort ? parseInt(envPort) : 5000;

  try {
    for (const port of COMMON_PORTS) {
      const isHealthy = await checkPort(port);
      if (isHealthy) {
        return {
          port,
          baseUrl: `http://localhost:${port}`,
          error: null,
        };
      }
    }

    return {
      port: null,
      baseUrl: null,
      error: `Backend not found on any common port (${COMMON_PORTS.join(", ")})`,
    };
  } catch (error) {
    return {
      port: null,
      baseUrl: null,
      error: `Error detecting backend: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function getBackendUrl(): Promise<string> {
  const detection = await detectBackendPort();

  if (detection.baseUrl) {
    console.log(`✓ Backend detected on port ${detection.port}`);
    return detection.baseUrl;
  }

  if (detection.error) {
    console.warn(`✗ ${detection.error}`);
  }

  const fallbackUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  console.log(`Using fallback URL: ${fallbackUrl}`);
  return fallbackUrl;
}

export async function createHealthCheckListener(
  onStatusChange: (status: "healthy" | "unhealthy") => void,
) {
  let lastStatus: "healthy" | "unhealthy" = "healthy";

  const checkHealth = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DETECTION_TIMEOUT);

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${apiUrl}${HEALTH_CHECK_ENDPOINT}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const currentStatus = response.ok ? "healthy" : "unhealthy";
      if (currentStatus !== lastStatus) {
        lastStatus = currentStatus;
        onStatusChange(currentStatus);
      }
    } catch {
      if (lastStatus !== "unhealthy") {
        lastStatus = "unhealthy";
        onStatusChange("unhealthy");
      }
    }
  };

  const interval = setInterval(checkHealth, 10000);
  await checkHealth();

  return () => clearInterval(interval);
}

export const backendDetector = {
  detectBackendPort,
  getBackendUrl,
  createHealthCheckListener,
};
