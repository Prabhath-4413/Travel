import type { TripCancellationStatus, CancellationStatus } from "../../lib/api";

export type CancellationBadgeStatus =
  | TripCancellationStatus
  | CancellationStatus
  | "Requested";

export interface CancellationBadgeProps {
  cancellationStatus: CancellationBadgeStatus;
  emphasis?: boolean;
  size?: "sm" | "md";
}

const statusStyles: Record<
  string,
  { label: string; base: string; emphasis: string }
> = {
  None: {
    label: "Active",
    base: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
    emphasis: "bg-emerald-500/20 text-emerald-100 border-emerald-500/30",
  },
  Requested: {
    label: "Cancellation Requested",
    base: "bg-amber-500/10 text-amber-200 border-amber-500/20",
    emphasis: "bg-amber-500/20 text-amber-100 border-amber-500/30",
  },
  Pending: {
    label: "Awaiting Review",
    base: "bg-amber-500/10 text-amber-200 border-amber-500/20",
    emphasis: "bg-amber-500/20 text-amber-100 border-amber-500/30",
  },
  Approved: {
    label: "Cancelled",
    base: "bg-red-500/10 text-red-200 border-red-500/20",
    emphasis: "bg-red-500/20 text-red-100 border-red-500/30",
  },
  Rejected: {
    label: "Cancellation Rejected",
    base: "bg-purple-500/10 text-purple-200 border-purple-500/20",
    emphasis: "bg-purple-500/20 text-purple-100 border-purple-500/30",
  },
};

export function CancellationBadge({
  cancellationStatus,
  emphasis = false,
  size = "md",
}: CancellationBadgeProps) {
  const style = statusStyles[cancellationStatus] ?? statusStyles.None;

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border font-medium tracking-wide uppercase",
        emphasis ? style.emphasis : style.base,
        size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
      ].join(" ")}
    >
      {style.label}
    </span>
  );
}

export default CancellationBadge;
