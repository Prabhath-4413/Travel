import { useEffect, useState } from "react";
import { getPackages, TravelPackage } from "../../api/packages";
import PackageCard from "./PackageCard";
import PackageDetailsModal from "./PackageDetailsModal";
import RouteMap from "../maps/RouteMap";

type RawDestination = TravelPackage["destinations"][number] & {
  Latitude?: unknown;
  Longitude?: unknown;
};

const normalizeNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const normalizeDestinations = (destinations: TravelPackage["destinations"]) =>
  destinations.map((destination) => {
    const source = destination as RawDestination;
    const latitude = normalizeNumber(source.latitude ?? source.Latitude);
    const longitude = normalizeNumber(source.longitude ?? source.Longitude);
    return {
      ...destination,
      latitude,
      longitude,
    };
  });

interface RouteDestination {
  destinationId: number;
  name: string;
  latitude: number;
  longitude: number;
}

interface PackageListProps {
  readOnly?: boolean;
  onBookPackage?: (travelPackage: TravelPackage) => void;
}

export default function PackageList({
  readOnly = false,
  onBookPackage,
}: PackageListProps) {
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<TravelPackage | null>(
    null,
  );
  const [routePackage, setRoutePackage] = useState<TravelPackage | null>(null);

  useEffect(() => {
    let active = true;

    const loadPackages = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPackages();
        if (active) {
          setPackages(
            data.map((pkg) => ({
              ...pkg,
              destinations: normalizeDestinations(pkg.destinations),
            })),
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load travel packages.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPackages();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (readOnly && routePackage) {
      setRoutePackage(null);
    }
  }, [readOnly, routePackage]);

  const routeDestinations: RouteDestination[] =
    !readOnly && routePackage
      ? normalizeDestinations(routePackage.destinations)
          .filter(
            (
              destination,
            ): destination is typeof destination & {
              latitude: number;
              longitude: number;
            } =>
              typeof destination.latitude === "number" &&
              typeof destination.longitude === "number",
          )
          .map((destination) => ({
            destinationId: destination.destinationId,
            name: destination.name,
            latitude: destination.latitude,
            longitude: destination.longitude,
          }))
      : [];

  return (
    <section className="space-y-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-white">
            Curated Travel Packages
          </h2>
          <p className="text-white/60">
            {readOnly
              ? "Discover top experiences curated by our travel experts."
              : "Discover hand-picked journeys with immersive itineraries and stunning destinations."}
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center rounded-2xl border border-white/5 bg-white/5 p-10 text-white/70">
          Loading travel packages...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-100">
          {error}
        </div>
      )}

      {!loading && !error && packages.length === 0 && (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-8 text-center text-white/60">
          No travel packages are available right now. Please check back soon.
        </div>
      )}

      {!loading && !error && packages.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => {
            const normalizedDestinations = normalizeDestinations(
              pkg.destinations,
            );
            return (
              <PackageCard
                key={pkg.packageId}
                name={pkg.name}
                description={pkg.description}
                price={pkg.price}
                imageUrl={pkg.imageUrl}
                onViewDetails={() =>
                  setSelectedPackage({
                    ...pkg,
                    destinations: normalizedDestinations,
                  })
                }
                onBuildRoute={
                  !readOnly
                    ? () =>
                        setRoutePackage({
                          ...pkg,
                          destinations: normalizedDestinations,
                        })
                    : undefined
                }
                showBuildRouteButton={!readOnly}
              />
            );
          })}
        </div>
      )}

      {!readOnly && routePackage && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  Route Planner: {routePackage.name}
                </h3>
                <p className="text-sm text-white/60">
                  {routeDestinations.length > 0
                    ? "Optimized route preview for selected destinations."
                    : "Destinations in this package need location details to build a route."}
                </p>
              </div>
              <button
                onClick={() => setRoutePackage(null)}
                className="self-start rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Close
              </button>
            </div>

            {routeDestinations.length > 0 ? (
              <RouteMap destinations={routeDestinations} />
            ) : (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-yellow-100">
                We couldn't find coordinates for these destinations. Update
                their location details to visualize the route.
              </div>
            )}
          </div>
        </div>
      )}

      {selectedPackage && (
        <PackageDetailsModal
          name={selectedPackage.name}
          description={selectedPackage.description}
          price={selectedPackage.price}
          destinations={selectedPackage.destinations}
          onClose={() => setSelectedPackage(null)}
          onBookNow={() => {
            onBookPackage?.(selectedPackage);
            setSelectedPackage(null);
          }}
        />
      )}
    </section>
  );
}
