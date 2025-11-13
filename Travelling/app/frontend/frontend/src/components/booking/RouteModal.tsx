import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import RouteMap, { SimpleDestination } from "../maps/RouteMap";

interface RouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinations: SimpleDestination[];
}

export default function RouteModal({
  isOpen,
  onClose,
  destinations,
}: RouteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-[#0e1512] border border-white/20 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#0e1512]/80 backdrop-blur-sm">
              <div>
                <h2 className="text-2xl font-bold text-white">Travel Route</h2>
                <p className="text-white/70 mt-1">
                  {destinations.length} destination
                  {destinations.length !== 1 ? "s" : ""} • Optimized route
                  visualization
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close route modal"
              >
                <X size={24} />
              </button>
            </div>

            {/* Map Content */}
            <div className="flex-1 overflow-hidden">
              <RouteMap destinations={destinations} />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-[#0e1512]/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="text-white/70 text-sm">
                  🗺️ Interactive map • 📍 Destination markers • 🛣️ Route
                  visualization
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors"
                >
                  Close Map
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
