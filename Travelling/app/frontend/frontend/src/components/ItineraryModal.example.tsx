import { useState } from "react";
import ItineraryModal from "./ItineraryModal";
import "@/styles/ItineraryModal.css";

/**
 * ===== EXAMPLE 1: Basic Usage =====
 * Simple implementation with minimal data
 */
export function BasicExample() {
  const [isOpen, setIsOpen] = useState(false);

  const bookingData = {
    bookingId: "TRIP-001",
    totalPrice: 85000,
    currency: "INR",
    travelers: 2,
    duration: 3,
    destinations: [
      {
        id: 1,
        name: "Jaipur",
        city: "Jaipur",
        country: "India",
        imageUrl: "https://images.unsplash.com/photo-1605784574988-97a9aabceca9?w=500&h=400&fit=crop",
        description: "Experience the Pink City with its majestic forts and temples."
      },
      {
        id: 2,
        name: "Delhi",
        city: "Delhi",
        country: "India",
        imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&h=400&fit=crop",
        description: "Capital city with rich history and culture spanning centuries."
      }
    ]
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
      >
        View Itinerary
      </button>

      <ItineraryModal
        booking={bookingData}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}

/**
 * ===== EXAMPLE 2: Multi-destination Trip =====
 * Complete itinerary with multiple destinations
 */
export function MultiDestinationExample() {
  const [isOpen, setIsOpen] = useState(false);

  const bookingData = {
    bookingId: "TRIP-INTL-2024-001",
    totalPrice: 450000,
    currency: "INR",
    travelers: 4,
    duration: 10,
    destinations: [
      {
        id: 1,
        name: "Bali",
        city: "Denpasar",
        country: "Indonesia",
        imageUrl: "https://images.unsplash.com/photo-1537225228614-b4693fe5f798?w=500&h=400&fit=crop",
        description: "Tropical paradise with stunning beaches and cultural heritage.",
        startDate: "2024-12-01",
        endDate: "2024-12-04"
      },
      {
        id: 2,
        name: "Ubud",
        city: "Ubud",
        country: "Indonesia",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=400&fit=crop",
        description: "Cultural center with rice terraces, temples, and local crafts.",
        startDate: "2024-12-05",
        endDate: "2024-12-07"
      },
      {
        id: 3,
        name: "Lombok",
        city: "Mataram",
        country: "Indonesia",
        imageUrl: "https://images.unsplash.com/photo-1583212192562-40c3161ad158?w=500&h=400&fit=crop",
        description: "Pristine beaches and world-class diving destinations.",
        startDate: "2024-12-08",
        endDate: "2024-12-10"
      }
    ]
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Multi-destination Tour</h2>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
      >
        View Full Itinerary
      </button>

      <ItineraryModal
        booking={bookingData}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}

/**
 * ===== EXAMPLE 3: With Data from API =====
 * Real-world implementation with async data loading
 */
export function APIDataExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  const handleOpenItinerary = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const data = {
        bookingId: "API-TRIP-001",
        totalPrice: 125000,
        currency: "INR",
        travelers: 3,
        duration: 5,
        destinations: [
          {
            id: 1,
            name: "Goa",
            city: "Panaji",
            country: "India",
            imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846313?w=500&h=400&fit=crop",
            description: "Coastal beauty with beaches, churches, and vibrant nightlife."
          },
          {
            id: 2,
            name: "Kerala",
            city: "Kochi",
            country: "India",
            imageUrl: "https://images.unsplash.com/photo-1537046169726-09e70cd7a63f?w=500&h=400&fit=crop",
            description: "God's Own Country with backwaters and spice markets."
          }
        ]
      };
      
      setBookingData(data);
      setIsOpen(true);
    } catch (error) {
      console.error("Failed to load itinerary:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <button
        onClick={handleOpenItinerary}
        disabled={loading}
        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-70"
      >
        {loading ? "Loading..." : "View My Bookings"}
      </button>

      {bookingData && (
        <ItineraryModal
          booking={bookingData}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * ===== EXAMPLE 4: Custom Styling Variation =====
 * Showing how to customize colors and styling
 */
export function CustomStylingExample() {
  const [isOpen, setIsOpen] = useState(false);

  const bookingData = {
    bookingId: "CUSTOM-001",
    totalPrice: 95000,
    currency: "INR",
    travelers: 2,
    duration: 4,
    destinations: [
      {
        id: 1,
        name: "Udaipur",
        city: "Udaipur",
        country: "India",
        imageUrl: "https://images.unsplash.com/photo-1606261174505-2a5abda6a87e?w=500&h=400&fit=crop",
        description: "Venice of the East with palaces reflecting in pristine lakes."
      },
      {
        id: 2,
        name: "Jodhpur",
        city: "Jodhpur",
        country: "India",
        imageUrl: "https://images.unsplash.com/photo-1577215645535-41b5ff1eaadb?w=500&h=400&fit=crop",
        description: "Blue City with magnificent forts and vibrant bazaars."
      }
    ]
  };

  return (
    <div className="p-8">
      <style>
        {`
          :root {
            --custom-gradient: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
            --custom-color-bg: #1a1a2e;
          }
          
          .itinerary-title {
            background: var(--custom-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .action-button-primary {
            background: var(--custom-gradient);
          }
        `}
      </style>

      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
      >
        View Custom Styled Itinerary
      </button>

      <ItineraryModal
        booking={bookingData}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}

/**
 * ===== EXAMPLE 5: Stories Dashboard Integration =====
 * Integration with a stories/destinations section
 */
export function StoriesDashboardExample() {
  const [selectedTrip, setSelectedTrip] = useState(null);

  const trips = [
    {
      id: 1,
      title: "Himalayan Adventure",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      booking: {
        bookingId: "TRIP-001",
        totalPrice: 150000,
        currency: "INR",
        travelers: 3,
        duration: 7,
        destinations: [
          {
            id: 1,
            name: "Dharamshala",
            city: "Dharamshala",
            country: "India",
            imageUrl: "https://images.unsplash.com/photo-1623299505048-6a185a98d4b8?w=500&h=400&fit=crop",
            description: "Mountain town with spiritual vibes and adventure activities."
          },
          {
            id: 2,
            name: "Manali",
            city: "Manali",
            country: "India",
            imageUrl: "https://images.unsplash.com/photo-1531399537190-87f0d7e21a00?w=500&h=400&fit=crop",
            description: "Adventure hub with trekking and water sports."
          }
        ]
      }
    },
    {
      id: 2,
      title: "Beach Getaway",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
      booking: {
        bookingId: "TRIP-002",
        totalPrice: 85000,
        currency: "INR",
        travelers: 2,
        duration: 4,
        destinations: [
          {
            id: 1,
            name: "Pondicherry",
            city: "Pondicherry",
            country: "India",
            imageUrl: "https://images.unsplash.com/photo-1548013146-72bada9d2a8f?w=500&h=400&fit=crop",
            description: "Colonial charm mixed with beaches and culture."
          }
        ]
      }
    }
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
        Your Stories & Destinations
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {trips.map(trip => (
          <div
            key={trip.id}
            className="rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group cursor-pointer"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={trip.image}
                alt={trip.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <h3 className="absolute bottom-4 left-4 right-4 text-white text-xl font-bold">
                {trip.title}
              </h3>
            </div>

            <div className="p-4">
              <button
                onClick={() => setSelectedTrip(trip.booking)}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                View Itinerary
              </button>
            </div>
          </div>
        ))}
      </div>

      <ItineraryModal
        booking={selectedTrip}
        isOpen={!!selectedTrip}
        onClose={() => setSelectedTrip(null)}
      />
    </div>
  );
}

/**
 * ===== EXAMPLE 6: Component with Callbacks =====
 * Handling button actions and callbacks
 */
export function CallbacksExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [action, setAction] = useState("");

  const bookingData = {
    bookingId: "CALLBACK-001",
    totalPrice: 120000,
    currency: "INR",
    travelers: 2,
    duration: 5,
    destinations: [
      {
        id: 1,
        name: "Mumbai",
        city: "Mumbai",
        country: "India",
        imageUrl: "https://images.unsplash.com/photo-1552283204-25953a89f853?w=500&h=400&fit=crop",
        description: "City of dreams with modern architecture and beaches."
      }
    ]
  };

  const handleContinueJourney = () => {
    setAction("User clicked 'Continue Journey'");
    setIsOpen(false);
    // Add your logic here: navigate, update state, etc.
  };

  const handleClose = () => {
    setAction("User clicked 'Close'");
    setIsOpen(false);
  };

  return (
    <div className="p-8">
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
      >
        View Trip with Callbacks
      </button>

      {action && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg">
          Action triggered: {action}
        </div>
      )}

      <ItineraryModal
        booking={bookingData}
        isOpen={isOpen}
        onClose={handleClose}
      />
    </div>
  );
}

/**
 * ===== EXPORT ALL EXAMPLES =====
 */
export const examples = {
  BasicExample,
  MultiDestinationExample,
  APIDataExample,
  CustomStylingExample,
  StoriesDashboardExample,
  CallbacksExample
};
