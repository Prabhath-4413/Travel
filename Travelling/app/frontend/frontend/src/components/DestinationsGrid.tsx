import { motion } from "framer-motion";
import { type Destination } from "../lib/api";

interface DestinationsGridProps {
  destinations: Destination[];
  onDestinationClick?: (destination: Destination) => void;
}

export default function DestinationsGrid({
  destinations,
  onDestinationClick,
}: DestinationsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {destinations.map((destination, index) => (
        <motion.div
          key={destination.destinationId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-white/20 hover:shadow-xl hover:shadow-white/5 cursor-pointer"
          onClick={() => onDestinationClick?.(destination)}
        >
          <div className="aspect-[4/3] overflow-hidden">
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
              <h3 className="text-lg font-semibold text-white">
                {destination.name}
              </h3>
              <span className="text-sm text-white/70">
                ₹{destination.price.toLocaleString()}
              </span>
            </div>
            <p className="text-white/70 text-sm line-clamp-2">
              {destination.description ||
                "Breathtaking views and unforgettable experiences."}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
