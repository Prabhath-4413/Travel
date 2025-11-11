import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MapPin, Users } from "lucide-react";
import { toast } from "react-hot-toast";
import { type Destination } from "../lib/api";
import { reviewAPI, type Review, type ReviewAverage } from "../lib/api";
import StarRating from "./reviews/StarRating";
import ReviewForm from "./reviews/ReviewForm";
import ReviewList from "./reviews/ReviewList";

interface DestinationDetailsModalProps {
  destination: Destination | null;
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
  userName?: string;
}

export default function DestinationDetailsModal({
  destination,
  isOpen,
  onClose,
  userId,
  userName,
}: DestinationDetailsModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<ReviewAverage | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (isOpen && destination) {
      loadReviewsAndRating();
    }
  }, [isOpen, destination]);

  const loadReviewsAndRating = async () => {
    if (!destination) return;

    setLoading(true);
    try {
      const [reviewsData, averageData] = await Promise.all([
        reviewAPI.getForDestination(destination.destinationId),
        reviewAPI.getAverage(destination.destinationId),
      ]);
      setReviews(reviewsData);
      setAverageRating(averageData);
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAdded = () => {
    loadReviewsAndRating();
  };

  if (!destination) return null;

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(destination.price);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {/* Hero Image */}
              <div className="relative h-64 md:h-80 overflow-hidden rounded-t-lg">
                <img
                  src={destination.imageUrl || `https://via.placeholder.com/800x400?text=${destination.name}`}
                  alt={destination.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {destination.name}
                      </h1>
                      <div className="flex items-center gap-4 text-gray-600">
                        {destination.country && destination.city && (
                          <div className="flex items-center gap-1">
                            <MapPin size={16} />
                            <span>{destination.city}, {destination.country}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users size={16} />
                          <span>From {formattedPrice}</span>
                        </div>
                      </div>
                    </div>

                    {/* Average Rating */}
                    {averageRating && averageRating.totalReviews > 0 && (
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <StarRating
                            rating={averageRating.averageRating}
                            readonly
                            size={20}
                          />
                        </div>
                        <p className="text-sm text-gray-600">
                          {averageRating.averageRating.toFixed(1)} ({averageRating.totalReviews} reviews)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {destination.description && (
                    <p className="text-gray-700 leading-relaxed">
                      {destination.description}
                    </p>
                  )}
                </div>

                {/* Review Button */}
                {userId && (
                  <div className="mb-6">
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Star size={16} />
                      Write a Review
                    </button>
                  </div>
                )}

                {/* Reviews Section */}
                <div className="border-t pt-6">
                  <ReviewList
                    destinationId={destination.destinationId}
                    className="max-h-96 overflow-y-auto"
                  />
                </div>
              </div>
            </div>

            {/* Review Form Modal */}
            <ReviewForm
              destinationId={destination.destinationId}
              userId={userId || 0}
              isOpen={showReviewForm}
              onClose={() => setShowReviewForm(false)}
              onReviewAdded={handleReviewAdded}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}