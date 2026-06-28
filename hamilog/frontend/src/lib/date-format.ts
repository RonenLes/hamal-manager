// Formats the date for display.
export function formatDateDisplay(date: Date) {
  return [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getFullYear()).slice(-2),
  ].join("/");
}

// Formats the time24 for display.
export function formatTime24(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

// Formats the date time24 for display.
export function formatDateTime24(dateValue?: string) {
  if (!dateValue) return "Unknown";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return `${formatDateDisplay(date)} ${formatTime24(date)}`;
}

// Formats the time24 from value for display.
export function formatTime24FromValue(dateValue?: string, fallback = "Now") {
  if (!dateValue) return fallback;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return fallback;

  return formatTime24(date);
}
