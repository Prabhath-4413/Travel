import { motion } from 'framer-motion'
import type { Booking } from '../../lib/api'
import CancellationBadge from './CancellationBadge'

export interface CancellationDetailsProps {
  latestCancellation: NonNullable<Booking['latestCancellation']>
}

export function CancellationDetails({ latestCancellation }: CancellationDetailsProps) {
  const { status, requestedAt, reviewedAt, adminComment, reason } = latestCancellation

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-xs uppercase tracking-wide">Latest Cancellation</span>
          <CancellationBadge cancellationStatus={status} emphasis size="sm" />
        </div>
        <div className="text-xs text-white/50">
          Requested on{' '}
          <span className="text-white/80">
            {new Date(requestedAt).toLocaleString()}
          </span>
        </div>
      </div>

      {(reason || reviewedAt || adminComment) && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {reason && (
            <DetailBlock label="Traveler Reason">
              <p>{reason}</p>
            </DetailBlock>
          )}

          {reviewedAt && (
            <DetailBlock label="Reviewed At">
              <p>{new Date(reviewedAt).toLocaleString()}</p>
            </DetailBlock>
          )}

          {adminComment && (
            <DetailBlock label="Admin Notes">
              <p>{adminComment}</p>
            </DetailBlock>
          )}
        </div>
      )}
    </motion.div>
  )
}

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/50">{label}</span>
      <div className="mt-2 text-white/80 leading-relaxed text-sm">{children}</div>
    </div>
  )
}

export default CancellationDetails