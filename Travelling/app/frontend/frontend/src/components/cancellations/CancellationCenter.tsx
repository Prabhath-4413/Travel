import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Booking } from "../../lib/api";
import CancellationBadge from "./CancellationBadge";
import CancellationDetails from "./CancellationDetails";

export interface CancellationCenterProps {
  bookings: Booking[];
  onClose: () => void;
  onRequestCancellation: (bookingId: number) => void;
}

export function CancellationCenter({
  bookings,
  onClose,
  onRequestCancellation,
}: CancellationCenterProps) {
  const cancellableBookings = useMemo(
    () =>
      bookings.filter((booking) => booking.cancellationStatus !== "Approved"),
    [bookings],
  );

  const hasRequestedItems = cancellableBookings.some(
    (booking) => booking.latestCancellation?.status === "Pending",
  );
  const hasRejectedItems = cancellableBookings.some(
    (booking) => booking.latestCancellation?.status === "Rejected",
  );

  return (
    <div className="flex h-full flex-col bg-[#0e1512] text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold">Cancellation Center</h2>
          <p className="text-xs text-white/60">
            Track the status of your cancellation requests and start a new one.
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg border border-white/20 px-3 py-1 text-sm text-white/70 hover:bg-white/10 transition"
        >
          Close
        </button>
      </header>

      <div className="space-y-4 border-b border-white/10 px-6 py-4 text-xs text-white/60">
        <div className="flex items-center gap-2">
          <CancellationBadge
            cancellationStatus={hasRequestedItems ? "Requested" : "None"}
            emphasis
            size="sm"
          />
          <span>
            Pending requests are highlighted so you can follow up easily.
          </span>
        </div>
        {hasRejectedItems && (
          <div className="flex items-center gap-2">
            <CancellationBadge
              cancellationStatus="Rejected"
              emphasis
              size="sm"
            />
            <span>
              Rejected requests can be resubmitted with updated information.
            </span>
          </div>
        )}
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-left text-white/70">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
            Resubmission tips
          </h3>
          <ul className="mt-2 space-y-1.5 text-[11px] text-white/60">
            <li className="leading-relaxed">
              Update your reason or travel details before resubmitting a
              rejected request so reviewers understand what's new.
            </li>
            <li className="leading-relaxed">
              Resubmitted cancellations re-enter the moderation queue and you'll
              receive a fresh email when a decision is made.
            </li>
          </ul>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {cancellableBookings.length === 0 ? (
          <EmptyState onRequestCancellation={onRequestCancellation} />
        ) : (
          <div className="space-y-4">
            {cancellableBookings.map((booking) => (
              <motion.div
                key={booking.bookingId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white/90">
                      Booking #{booking.bookingId}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <CancellationBadge
                        cancellationStatus={booking.cancellationStatus}
                        size="sm"
                      />
                      {booking.latestCancellation?.status &&
                        booking.latestCancellation.status !== "Pending" && (
                          <CancellationBadge
                            cancellationStatus={
                              booking.latestCancellation.status
                            }
                            size="sm"
                          />
                        )}
                      {booking.latestCancellation?.status === "Pending" && (
                        <CancellationBadge
                          cancellationStatus="Requested"
                          size="sm"
                          emphasis
                        />
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-white/70">
                    <p className="text-white/80">
                      {booking.destinations.slice(0, 2).join(", ")}
                      {booking.destinations.length > 2 && "…"}
                    </p>
                    <p className="text-xs text-white/50">
                      Booked on{" "}
                      {new Date(booking.bookingDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 text-sm text-white/70 md:grid-cols-3">
                  <InfoBlock label="Guests" value={booking.guests} />
                  <InfoBlock label="Nights" value={booking.nights} />
                  <InfoBlock
                    label="Total"
                    value={`₹${booking.totalPrice.toLocaleString()}`}
                  />
                </div>

                <AnimatePresence>
                  {booking.latestCancellation && (
                    <motion.div
                      key={booking.latestCancellation.tripCancellationId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4"
                    >
                      <CancellationDetails
                        latestCancellation={booking.latestCancellation}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => onRequestCancellation(booking.bookingId)}
                    className="rounded-lg border border-red-500/30 bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={booking.cancellationStatus === "Requested"}
                  >
                    {booking.cancellationStatus === "Requested"
                      ? "Request Pending"
                      : "Request Cancellation"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  onRequestCancellation,
}: {
  onRequestCancellation: (bookingId: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
      <h3 className="text-lg font-semibold text-white">
        No cancellations in progress
      </h3>
      <p className="mt-2 text-sm">
        All of your current trips are active. When plans change, you can request
        a cancellation right from the booking card.
      </p>

      <div className="mt-4 space-y-2 text-xs text-white/60 text-left">
        <p className="font-semibold text-white/70 uppercase tracking-wide text-[11px]">
          How to start a cancellation
        </p>
        <ol className="list-decimal list-inside space-y-1 leading-relaxed">
          <li>
            Open <span className="text-white/80">My Bookings</span> and locate
            the trip you need to cancel.
          </li>
          <li>
            Click <span className="text-white/80">Request Cancellation</span>{" "}
            and share any helpful context for reviewers.
          </li>
          <li>
            Track the status here—updates appear instantly once the moderation
            team responds.
          </li>
        </ol>
      </div>

      <p className="mt-4 text-xs text-white/50">
        Tip: Need to tweak a pending request? Close this drawer, revisit the
        booking, and submit an updated note.
      </p>
    </div>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
        {label}
      </span>
      <div className="mt-2 text-white/80">{value}</div>
    </div>
  );
}

export default CancellationCenter;
