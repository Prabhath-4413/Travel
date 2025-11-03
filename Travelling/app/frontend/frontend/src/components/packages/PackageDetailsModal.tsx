import { type Destination } from '../../lib/api'

interface PackageDetailsModalProps {
  name: string
  description?: string | null
  price: number
  destinations: Destination[]
  onClose: () => void
  onBookNow?: () => void
}

export default function PackageDetailsModal({ name, description, price, destinations, onClose, onBookNow }: PackageDetailsModalProps) {
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(price)
  const destinationCount = destinations.length
  const experienceSummary = description && description.trim().length > 0 ? description : 'No description available for this package.'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
          <div>
            <h2 className="text-2xl font-semibold text-white">{name}</h2>
            <p className="mt-1 text-sm uppercase tracking-wide text-white/60">{formattedPrice}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Close
          </button>
        </div>

        <div className="space-y-6 p-6">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Overview</h3>
            <p className="mt-2 text-base leading-relaxed text-white/80">
              {experienceSummary}
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">What to Expect</h3>
            <div className="mt-3 space-y-3 text-sm text-white/75">
              <p>
                This journey connects you with {destinationCount} curated {destinationCount === 1 ? 'destination' : 'destinations'} and pairs each stop with locally hosted experiences.
              </p>
              <ul className="space-y-2">
                <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  Dedicated travel concierge for itinerary personalization and on-trip assistance.
                </li>
                <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  Flexible scheduling windows with optional add-ons tailored to your pace.
                </li>
                <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  Insider tips on dining, cultural etiquette, and hidden-gem experiences.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Destinations</h3>
            {destinations.length > 0 ? (
              <ul className="mt-3 grid grid-cols-1 gap-2 text-white/80 sm:grid-cols-2">
                {destinations.map((destination) => (
                  <li
                    key={destination.destinationId ?? destination.name}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  >
                    {destination.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-white/60">No destinations linked to this package yet.</p>
            )}
          </section>
        </div>

        {onBookNow && (
          <div className="border-t border-white/10 p-6">
            <button
              onClick={onBookNow}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:brightness-110"
            >
              Book Now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
