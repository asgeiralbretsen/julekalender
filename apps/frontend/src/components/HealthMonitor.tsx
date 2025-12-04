import { useState, useEffect } from "react";
import Days from "./Days";
import { ChristmasBackground } from "./ChristmasBackground";

interface HealthStatus {
  status: string;
  timestamp: string;
}

export default function HealthMonitor() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/health`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setHealthStatus(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch health status"
        );
        setHealthStatus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ChristmasBackground>
      <div className="container mx-auto py-8 px-4 relative z-10">
        <div className="text-center mb-8">
          <h1
            className="text-4xl md:text-5xl font-extrabold text-yellow-300 drop-shadow-lg"
            style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
          >
            💚 Health Monitor
          </h1>
          <p className="mt-3 text-red-100">System status and monitoring</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Health Monitor */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-christmas-lg p-8 border-2 border-yellow-400/20">
            <h2 className="text-2xl font-bold text-yellow-300 mb-6 text-center flex items-center justify-center space-x-2">
              <span>🏥</span>
              <span>Backend Health Monitor</span>
            </h2>

            <div className="space-y-4">
              {loading && (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <span className="ml-2 text-red-100">Checking health...</span>
                </div>
              )}

              {error && (
                <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-lg">
                  <strong className="font-bold">Error:</strong>
                  <span className="block sm:inline"> {error}</span>
                </div>
              )}

              {healthStatus && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-red-100">Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        healthStatus.status === "healthy"
                          ? "bg-green-500/30 text-green-200 border border-green-400/50"
                          : "bg-red-500/30 text-red-200 border border-red-400/50"
                      }`}
                    >
                      {healthStatus.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-red-100">Last Check:</span>
                    <span className="text-sm text-red-200">
                      {new Date(healthStatus.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-red-200">
                Auto-refreshes every 5 seconds
              </p>
            </div>
          </div>

          {/* Advent Calendar Days */}
          <Days />
        </div>
      </div>

      <div className="pointer-events-none select-none fixed inset-x-0 bottom-0 h-24 bg-gradient-to-t from-red-900 to-transparent" />
    </ChristmasBackground>
  );
}
