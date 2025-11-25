import { AlertCircle, RefreshCw } from "lucide-react";

interface BackendConnectionErrorProps {
  message?: string;
  onRetry?: () => void;
  isFullScreen?: boolean;
}

export default function BackendConnectionError({
  message = "Unable to connect to the backend server",
  onRetry,
  isFullScreen = false,
}: BackendConnectionErrorProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const containerClass = isFullScreen
    ? "flex items-center justify-center min-h-screen bg-gradient-to-b from-[#0e1512] to-[#1a1f19]"
    : "bg-red-50 border border-red-200 rounded-lg p-6";

  return (
    <div className={containerClass}>
      <div className={`${isFullScreen ? "text-center max-w-lg" : ""}`}>
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <h2 className="text-lg font-semibold text-red-900">
            Backend Connection Error
          </h2>
        </div>

        <p className="text-red-700 mb-4 text-sm leading-relaxed">
          {message}
        </p>

        <div className="bg-red-100 rounded p-3 mb-6 text-sm">
          <p className="text-red-800 font-medium mb-2">
            Please ensure your .NET backend is running:
          </p>
          <ul className="text-red-700 space-y-1 text-left ml-4 list-disc">
            <li>Common port: http://localhost:5000</li>
            <li>Alternative ports checked: 5001, 5002, 5003, 5004, 5005</li>
            <li>Check backend console for any errors</li>
            <li>Verify CORS is properly configured in the backend</li>
          </ul>
        </div>

        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    </div>
  );
}
