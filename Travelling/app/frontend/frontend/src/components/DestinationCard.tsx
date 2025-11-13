import { useState } from "react";
import { motion } from "framer-motion";
import { type Destination } from "../lib/api";
import QuickBookModal from "./booking/QuickBookModal";

interface DestinationCardProps {
  destination: Destination;
  onViewDetails: (destination: Destination) => void;
  index?: number;
}

export default function DestinationCard({
  destination,
  onViewDetails,
  index = 0,
}: DestinationCardProps) {
  const [showQuickBookModal, setShowQuickBookModal] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-white/20 hover:shadow-xl hover:shadow-white/5"
      >
        <div className="aspect-[4/3] overflow-hidden relative">
          <img
            src={
              destination.imageUrl ||
              `https://via.placeholder.com/400x300?text=Destination`
            }
            alt={destination.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
            loading="lazy"
          />
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {destination.name}
              </h3>
              {destination.country && (
                <p className="text-sm text-white/60">{destination.country}</p>
              )}
            </div>
            <span className="text-sm text-white/70">
              ₹{destination.price.toLocaleString()}
            </span>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => onViewDetails(destination)}
              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors duration-200"
            >
              View Details
            </button>
            <button
              onClick={() => setShowQuickBookModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold rounded-lg hover:scale-105 transition-all duration-200"
            >
              Quick Book
            </button>
          </div>
        </div>
      </motion.div>

      <QuickBookModal
        destination={destination}
        isOpen={showQuickBookModal}
        onClose={() => setShowQuickBookModal(false)}
      />
    </>
  );
}
