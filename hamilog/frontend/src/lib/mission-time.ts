// Formats the ideal delivery time for display.
export function formatIdealDeliveryTime(dateValue?: string | number | null) {
  if (!dateValue) return "Not set";

  if (typeof dateValue === "number") {
    return `${dateValue} min`;
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Not set";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    hourCycle: "h23",
  }).format(date);
}

// Returns the mission delivered at.
export function getMissionDeliveredAt(mission: {
  delivered_at?: string | null;
  updated_at: string;
  status: string;
}) {
  if (mission.delivered_at) return mission.delivered_at;
  if (mission.status === "delivered") return mission.updated_at;
  return null;
}
