interface PackageCardProps {
  name: string
  description?: string | null
  price: number
  imageUrl?: string | null
  onViewDetails: () => void
  onBuildRoute?: () => void
  showBuildRouteButton?: boolean
}

const fallbackImage =
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=60'

export default function PackageCard({
  name,
  description,
  price,
  imageUrl,
  onViewDetails,
  onBuildRoute,
  showBuildRouteButton = true,
}: PackageCardProps) {
  const displayImage = imageUrl && imageUrl.trim().length > 0 ? imageUrl : fallbackImage
  const formattedPrice = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
}).format(price)

  const hasRouteButton = showBuildRouteButton && Boolean(onBuildRoute)

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur-lg shadow-xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-blue-500/30">
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={displayImage}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1512] via-transparent" />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">{name}</h3>
          <p className="text-sm text-white/70 line-clamp-3">
            {description && description.trim().length > 0 ? description : 'No description available.'}
          </p>
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm uppercase tracking-wide text-white/60">Starting from</span>
            <span className="text-lg font-semibold text-blue-300">{formattedPrice}</span>
          </div>

          <div className={`flex flex-col gap-3 ${hasRouteButton ? 'sm:flex-row' : ''}`}>
            <button
              onClick={onViewDetails}
              className={`rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition hover:brightness-110 ${hasRouteButton ? 'flex-1' : 'w-full'}`}
            >
              View Details
            </button>
            {hasRouteButton && (
              <button
                onClick={onBuildRoute}
                className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Build Route
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
