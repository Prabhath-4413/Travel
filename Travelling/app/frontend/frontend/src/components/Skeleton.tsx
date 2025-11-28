type SizeValue = number | string;

type SkeletonProps = {
  width?: SizeValue;
  height?: SizeValue;
  borderRadius?: SizeValue;
  className?: string;
};

const formatSize = (value?: SizeValue) => {
  if (typeof value === "number") {
    return `${value}px`;
  }
  return value;
};

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 12,
  className = "",
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={{
        width: formatSize(width),
        height: formatSize(height),
        borderRadius: formatSize(borderRadius),
      }}
      aria-hidden="true"
    />
  );
}

export function DestinationCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-0">
      <Skeleton height={220} borderRadius="16px 16px 0 0" className="w-full" />
      <div className="p-6 space-y-3">
        <Skeleton width="70%" height={24} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="85%" height={14} />
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="space-y-2">
            <Skeleton width={48} height={12} />
            <Skeleton width={96} height={28} />
          </div>
          <Skeleton width={96} height={36} borderRadius={12} />
        </div>
      </div>
    </div>
  );
}

export function BookingRowSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Skeleton width={140} height={12} />
          <Skeleton width="60%" height={20} />
          <div className="space-y-2">
            <Skeleton width="80%" height={12} />
            <Skeleton width="50%" height={12} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Skeleton width={120} height={14} />
          <Skeleton width={120} height={28} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton height={44} borderRadius={16} />
        <Skeleton height={44} borderRadius={16} />
        <Skeleton height={44} borderRadius={16} />
      </div>
    </div>
  );
}

export function UserProfileSkeleton() {
  return (
    <div className="grid gap-10 md:grid-cols-[1.2fr,0.8fr]">
      <div className="space-y-6">
        <Skeleton width={220} height={16} />
        <div className="flex items-center gap-4">
          <Skeleton width={72} height={72} borderRadius={999} />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={18} />
            <Skeleton width="40%" height={14} />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton width="80%" height={62} />
          <Skeleton width="60%" height={62} />
        </div>
        <Skeleton width="90%" height={18} />
        <div className="flex flex-wrap gap-4">
          <Skeleton width={160} height={48} borderRadius={999} />
          <Skeleton width={160} height={48} borderRadius={999} />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
          <Skeleton width={120} height={12} />
          <Skeleton width="100%" height={14} />
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <Skeleton width={120} height={12} />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton width={80} height={32} />
              <Skeleton width={120} height={12} />
            </div>
            <div className="space-y-2">
              <Skeleton width={80} height={32} />
              <Skeleton width={120} height={12} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton height={8} className="flex-1" borderRadius={999} />
          <Skeleton height={8} className="flex-1" borderRadius={999} />
          <Skeleton height={8} className="flex-1" borderRadius={999} />
        </div>
      </div>
    </div>
  );
}
