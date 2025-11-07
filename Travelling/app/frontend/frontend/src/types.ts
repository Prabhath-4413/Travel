export type Destination = {
  id: number;
  name: string;
  state: string;
  country: string;
  description: string;
  imageUrl: string;
  pricePerNight: number;
  category: string;
  highlights: string[];
  bestTime: string;
};

export type AvailabilityResponse = {
  destinationId: number;
  available: boolean;
  unavailableDates: string[];
};

export type BookingRequest = {
  destinationId: number;
  startDate: string;
  endDate: string;
  travelers: number;
  fullName: string;
  email: string;
};

export type BookingResponse = {
  bookingId: string;
  totalPrice: number;
  currency: string;
};
