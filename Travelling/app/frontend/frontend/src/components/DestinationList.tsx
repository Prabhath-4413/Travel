import { type Destination } from "../lib/api";
import DestinationCard from "./DestinationCard";

interface DestinationListProps {
  destinations: Destination[];
  onViewDetails?: (destination: Destination) => void;
}

export default function DestinationList({
  destinations,
  onViewDetails,
}: DestinationListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {destinations.map((destination, index) => (
        <DestinationCard
          key={destination.destinationId}
          destination={destination}
          onViewDetails={onViewDetails || (() => {})}
          index={index}
        />
      ))}
    </div>
  );
}
