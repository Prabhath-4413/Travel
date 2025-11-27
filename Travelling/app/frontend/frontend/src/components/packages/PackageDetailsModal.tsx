import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import WeatherWidget from "../WeatherWidget";
import PackageBookingConfirmation from "../booking/PackageBookingConfirmation";
import { type Destination } from "../../lib/api";

interface PackageDetailsModalProps {
  packageId?: number;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  destinations: Destination[];
  onClose: () => void;
}

const fallbackImage =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80";

export default function PackageDetailsModal({
  packageId,
  name,
  description,
  price,
  imageUrl,
  destinations,
  onClose,
}: PackageDetailsModalProps) {
  const [selectedDestinationId, setSelectedDestinationId] = useState<number | null>(
    destinations[0]?.destinationId ?? null,
  );
  const [showBookingModal, setShowBookingModal] = useState(false);

  const handleBookNow = () => {
    console.log("[PackageDetailsModal.handleBookNow] Clicked, showing booking modal");
    setShowBookingModal(true);
  };

  const handleBookingSuccess = (result: any) => {
    console.log("[PackageDetailsModal.handleBookingSuccess] Booking succeeded", result);
    setShowBookingModal(false);
    onClose();
  };

  useEffect(() => {
    console.log("[PackageDetailsModal] Component mounted", { packageId, packageName: name });
    setSelectedDestinationId(destinations[0]?.destinationId ?? null);
  }, [destinations]);

  useEffect(() => {
    console.log("[PackageDetailsModal] showBookingModal changed to:", showBookingModal);
  }, [showBookingModal]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const { body } = document;
    const originalOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = originalOverflow;
    };
  }, []);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      }),
    [],
  );

  const selectedDestination =
    destinations.find((d) => d.destinationId === selectedDestinationId) ??
    destinations[0] ??
    null;

  const basePriceLabel = currencyFormatter.format(price);
  const destinationPriceLabel = currencyFormatter.format(
    selectedDestination?.price ?? 0,
  );
  const totalPriceLabel = currencyFormatter.format(
    price + (selectedDestination?.price ?? 0),
  );
  const heroImage = imageUrl && imageUrl.trim().length > 0 ? imageUrl : fallbackImage;
  const overviewText =
    description && description.trim().length > 0
      ? description
      : "This curated journey is crafted by SuiteSavvy concierges and adapts to your preferred pace.";
  const guestCountEstimate = Math.min(8, Math.max(2, (destinations.length || 1) * 2));
  const nightsEstimate = Math.max(4, (destinations.length || 1) * 2);
  const coordinatesLabel =
    selectedDestination &&
    typeof selectedDestination.latitude === "number" &&
    typeof selectedDestination.longitude === "number"
      ? `${selectedDestination.latitude.toFixed(2)}°, ${selectedDestination.longitude.toFixed(2)}°`
      : "Shared after confirmation";
  const aboutCopy =
    selectedDestination?.description && selectedDestination.description.trim().length > 0
      ? selectedDestination.description
      : overviewText;

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <>
      {showBookingModal && packageId && (
        <PackageBookingConfirmation
          packageId={packageId}
          packageName={name}
          packageDescription={description}
          destinations={destinations}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
      <motion.div
        className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      >
        <motion.section
          className="relative w-full max-w-6xl rounded-[32px] border border-white/10 bg-[#05090f]/80 text-white shadow-[0_35px_90px_rgba(0,0,0,0.9)] backdrop-blur-2xl max-h-[85vh] overflow-y-auto"
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`${name} details`}
        >
          <button
            onClick={onClose}
            className="absolute right-6 top-6 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/20"
            type="button"
            aria-label="Close package details"
          >
            ✕
          </button>

          <div className="flex flex-col gap-8 p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="relative min-h-[320px] overflow-hidden rounded-[28px] border border-white/10 bg-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                  <img src={heroImage} alt={name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05090f] via-black/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 space-y-2">
                    <p className="text-xs uppercase tracking-[0.35em] text-white/70">Tailored itinerary</p>
                    <h2 className="text-3xl font-semibold leading-tight">{name}</h2>
                    <p className="text-sm text-white/80 sm:text-base">{overviewText}</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">Quick summary</p>
                  <p className="mt-3 text-base leading-relaxed text-white/80">{aboutCopy}</p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/60">
                    <span>Live weather</span>
                    {selectedDestination?.city && <span className="text-white/50">{selectedDestination.city}</span>}
                  </div>
                  {selectedDestination ? (
                    <WeatherWidget
                      city={selectedDestination.city}
                      cityName={selectedDestination.name}
                      latitude={selectedDestination.latitude}
                      longitude={selectedDestination.longitude}
                      className="mt-4"
                    />
                  ) : (
                    <p className="mt-4 text-sm text-white/70">Choose a destination to view weather insights.</p>
                  )}
                </div>
              </div>

              <div className="space-y-6 pb-4">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-white/60">About this journey</p>
                      <h3 className="mt-2 text-2xl font-semibold text-white">
                        {selectedDestination?.name ?? name}
                      </h3>
                      {selectedDestination?.city && (
                        <p className="mt-1 text-white/60">
                          {selectedDestination.city}, {selectedDestination.country ?? "Worldwide"}
                        </p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-right">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/60">Starting from</p>
                      <p className="mt-2 text-3xl font-bold text-blue-200">{basePriceLabel}</p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-white/70">{aboutCopy}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Coordinates", value: coordinatesLabel },
                    { label: "Guest Count", value: `${guestCountEstimate} guests` },
                    { label: "Ideal Nights", value: `${nightsEstimate} nights` },
                    { label: "Destinations", value: `${destinations.length || 0} included` },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80"
                    >
                      <p className="text-xs uppercase tracking-[0.35em] text-white/60">{item.label}</p>
                      <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">Destinations</p>
                  {destinations.length === 0 ? (
                    <p className="mt-6 text-sm text-white/70">No destinations have been linked to this package yet.</p>
                  ) : (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {destinations.map((destination) => {
                        const isActive =
                          selectedDestination &&
                          destination.destinationId === selectedDestination.destinationId;
                        return (
                          <button
                            key={destination.destinationId ?? destination.name}
                            onClick={() =>
                              setSelectedDestinationId(destination.destinationId ?? null)
                            }
                            className={`rounded-2xl border px-4 py-4 text-left transition ${
                              isActive
                                ? "border-white/60 bg-white/15 shadow-[0_15px_35px_rgba(15,23,42,0.45)]"
                                : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                            }`}
                            type="button"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                                  {destination.country ?? "Worldwide"}
                                </p>
                                <p className="mt-1 text-lg font-semibold text-white">{destination.name}</p>
                              </div>
                              <span className="text-sm text-white/60">
                                {currencyFormatter.format(destination.price)}
                              </span>
                            </div>
                            {destination.city && (
                              <p className="mt-2 text-sm text-white/70">{destination.city}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/20 via-purple-600/20 to-fuchsia-500/10 p-6 shadow-[0_20px_60px_rgba(8,47,73,0.35)]">
                  <div className="space-y-4 text-white/80">
                    <div className="flex items-center justify-between">
                      <span>Package base</span>
                      <span>{basePriceLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{selectedDestination?.name ?? "Destination add-on"}</span>
                      <span>{destinationPriceLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Guests</span>
                      <span>{guestCountEstimate}</span>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-white/60">Estimated total</p>
                      <p className="mt-2 text-3xl font-semibold text-white">{totalPriceLabel}</p>
                    </div>
                    <button
                      onClick={handleBookNow}
                      className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_15px_35px_rgba(59,130,246,0.35)] transition hover:brightness-110 lg:w-auto"
                      type="button"
                    >
                      Book this package
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </>,
    document.body,
  );
}
