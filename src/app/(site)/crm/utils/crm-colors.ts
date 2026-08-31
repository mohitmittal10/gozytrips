/**
 * crm-colors.ts
 *
 * Centralized, authoritative color schema for the CRM.
 * Theme: Pure Black (#000000) background + Sleek Stealth Dark Shades (#0c0c0e / #18181b / #27272a).
 * All general UI (buttons, icons, tabs, inputs, cards) uses sleek dark zinc shades.
 * COLOR IS RESERVED EXCLUSIVELY FOR STATUS & PIPELINE STAGES.
 */

export const CRM_COLORS = {
  bg: "#000000",
  cardBg: "#0c0c0e",
  cardBorder: "border-zinc-800",
  mutedText: "#a1a1aa",
  headingText: "#ffffff",
  primaryButton: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/80 font-medium shadow-sm transition-all",
  secondaryButton: "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-medium transition-all",
} as const;

export interface StatusStyle {
  label: string;
  badgeClass: string;
  dotClass: string;
  hex: string;
  borderColor: string;
  bgColor: string;
}

const statusMap: Record<string, StatusStyle> = {
  draft: {
    label: "Draft",
    badgeClass: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20 font-medium",
    dotClass: "bg-zinc-400",
    hex: "#71717a",
    borderColor: "border-zinc-700/50",
    bgColor: "bg-zinc-800/40",
  },
  proposed: {
    label: "Proposed",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20 font-medium",
    dotClass: "bg-amber-400",
    hex: "#f59e0b",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/10",
  },
  sent: {
    label: "Sent",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20 font-medium",
    dotClass: "bg-blue-400",
    hex: "#3b82f6",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/10",
  },
  booked: {
    label: "Booked",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium",
    dotClass: "bg-emerald-400",
    hex: "#10b981",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/10",
  },
  confirmed: {
    label: "Confirmed",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium",
    dotClass: "bg-emerald-400",
    hex: "#10b981",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/10",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-teal-500/10 text-teal-400 border-teal-500/20 font-medium",
    dotClass: "bg-teal-400",
    hex: "#14b8a6",
    borderColor: "border-teal-500/30",
    bgColor: "bg-teal-500/10",
  },
  rejected: {
    label: "Rejected",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20 font-medium",
    dotClass: "bg-rose-400",
    hex: "#f43f5e",
    borderColor: "border-rose-500/30",
    bgColor: "bg-rose-500/10",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20 font-medium",
    dotClass: "bg-rose-400",
    hex: "#f43f5e",
    borderColor: "border-rose-500/30",
    bgColor: "bg-rose-500/10",
  },
};

/** Get Tailwind badge classes for any trip/booking status */
export function getStatusBadgeClasses(status: string): string {
  if (!status) return statusMap.draft.badgeClass;
  const key = status.toLowerCase();
  return statusMap[key]?.badgeClass || statusMap.draft.badgeClass;
}

/** Get status dot class for status pill indicators */
export function getStatusDotClass(status: string): string {
  if (!status) return statusMap.draft.dotClass;
  const key = status.toLowerCase();
  return statusMap[key]?.dotClass || statusMap.draft.dotClass;
}

/** Get status hex color code for charts, pipeline funnels, and markers */
export function getStatusHex(status: string): string {
  if (!status) return statusMap.draft.hex;
  const key = status.toLowerCase();
  return statusMap[key]?.hex || statusMap.draft.hex;
}

/** Get full status style configuration */
export function getStatusStyle(status: string): StatusStyle {
  if (!status) return statusMap.draft;
  const key = status.toLowerCase();
  return statusMap[key] || {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    badgeClass: statusMap.draft.badgeClass,
    dotClass: statusMap.draft.dotClass,
    hex: statusMap.draft.hex,
    borderColor: statusMap.draft.borderColor,
    bgColor: statusMap.draft.bgColor,
  };
}

/** Clean avatar background class (enterprise dark neutral, no decorative colors) */
export const CRM_AVATAR_CLASS = "bg-zinc-900 text-zinc-200 border border-zinc-800 font-medium";
