import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { DatePreset, ExportColumn, ExportRow } from "./types";

// Converts the value to a date input value.
export function toDateInputValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

// Formats the date for display.
export function formatDateDisplay(date: Date) {
  return [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getFullYear()).slice(-2),
  ].join("/");
}

// Formats the date and time for display.
export function formatDateTimeDisplay(date: Date) {
  return `${formatDateDisplay(date)} ${String(date.getHours()).padStart(
    2,
    "0",
  )}:${String(date.getMinutes()).padStart(2, "0")}`;
}

// Formats the date for filenames.
export function formatDateForFilename(date: Date) {
  return formatDateDisplay(date).replaceAll("/", "-");
}

// Returns the start of month.
export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Returns the end of month.
export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

// Returns the end of day.
export function endOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

// Returns the date range.
export function getDateRange(
  preset: DatePreset,
  manualDates: boolean,
  fromDate: string,
  toDate: string,
) {
  if (manualDates && fromDate && toDate) {
    return {
      start: new Date(`${fromDate}T00:00:00`),
      end: endOfDay(new Date(`${toDate}T00:00:00`)),
    };
  }

  const now = new Date();

  if (preset === "thisMonth") {
    return { start: startOfMonth(now), end: endOfMonth(now) };
  }

  if (preset === "lastMonth") {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
  }

  const start = new Date(now);
  start.setDate(now.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  return { start, end: now };
}

// Checks whether the value is within range.
export function isWithinRange(value: string, start: Date, end: Date) {
  const date = new Date(value);
  return date >= start && date <= end;
}

// Calculates a percentage value.
export function percent(value: number, total: number) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Formats the duration for display.
export function formatDuration(ms: number) {
  if (!ms) return "No completed missions";
  const hours = ms / (1000 * 60 * 60);
  if (hours < 24) return `${hours.toFixed(1)} hours`;
  return `${(hours / 24).toFixed(1)} days`;
}

// Groups the count.
export function groupCount<T extends string>(items: T[]) {
  return items.reduce<Record<T, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {} as Record<T, number>);
}

// Converts a raw label into readable text.
export function labelize(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// Converts the value to a day key.
export function toDayKey(value: string | Date) {
  return toDateInputValue(typeof value === "string" ? new Date(value) : value);
}

// Returns the date buckets.
export function getDateBuckets(start: Date, end: Date) {
  const buckets: string[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);

  while (current <= last) {
    buckets.push(toDateInputValue(current));
    current.setDate(current.getDate() + 1);
  }

  return buckets.slice(-14);
}

// Sanitizes the filename.
function sanitizeFilename(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Exports the table to pdf.
export function exportTableToPdf(
  title: string,
  subtitle: string,
  columns: ExportColumn[],
  rows: ExportRow[],
) {
  const document = new jsPDF({
    orientation: columns.length > 5 ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
  });
  const pageWidth = document.internal.pageSize.getWidth();
  const generatedDate = formatDateForFilename(new Date());
  const filename = `${sanitizeFilename(title)}-${generatedDate}.pdf`;

  document.setFont("helvetica", "bold");
  document.setFontSize(16);
  document.text(title, 40, 42, { maxWidth: pageWidth - 80 });

  document.setFont("helvetica", "normal");
  document.setFontSize(10);
  document.text(subtitle, 40, 62, { maxWidth: pageWidth - 80 });

  autoTable(document, {
    startY: 86,
    head: [columns.map((column) => column.label)],
    body: rows.map((row) =>
      columns.map((column) => String(row[column.key] ?? "")),
    ),
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 5,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 40, right: 40 },
  });

  document.save(filename);
}
