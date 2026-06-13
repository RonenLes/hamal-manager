// src/components/dispatcher/PriorityBadge.tsx

import type { MissionPriority } from "@/lib/api-client";

type PriorityBadgeProps = {
  priority: MissionPriority;
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const classes = {
    critical: "border-red-500/30 bg-red-500/10 text-red-300",
    high: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    medium: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    low: "border-slate-500/30 bg-slate-500/10 text-muted",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${classes[priority]}`}
    >
      {priority}
    </span>
  );
}