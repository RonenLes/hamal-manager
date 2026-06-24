export function formatDateDisplay(date: Date) {
  return [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getFullYear()).slice(-2),
  ].join("/");
}

export function formatTime24(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

export function formatDateTime24(dateValue?: string) {
  if (!dateValue) return "Unknown";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return `${formatDateDisplay(date)} ${formatTime24(date)}`;
}

export function formatTime24FromValue(dateValue?: string, fallback = "Now") {
  if (!dateValue) return fallback;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return fallback;

  return formatTime24(date);
}
