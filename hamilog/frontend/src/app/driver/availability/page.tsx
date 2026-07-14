"use client";

import { useEffect, useMemo, useState } from "react";
import { LoadingScreen } from "@/components/shared/Spinner";
import { useRouter } from "next/navigation";

import BackToMenuButton from "@/components/shared/BackToMenuButton";
import Calendar, { toDateInputValue } from "@/components/shared/Calendar";
import {
  type Driver,
  type Mission,
  getDriver,
  getMissions,
  getStoredUser,
  getToken,
  updateDriverAvailability,
} from "@/lib/api-client";

type SelectionMode = "add" | "remove" | null;

// Renders the driver availability page component.
export default function DriverAvailabilityPage() {
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()));
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (!token || !user || user.role !== "driver" || !user.driver_id) {
      router.replace("/login?role=driver");
      return;
    }

    const driverId = user.driver_id;

    // Fetches the latest page data.
    async function fetchData() {
      try {
        const [driverData, missionData] = await Promise.all([
          getDriver(driverId),
          getMissions({ driverUid: driverId }),
        ]);
        setDriver(driverData);
        setMissions(
          missionData.filter(
            (mission) => mission.assigned_driver_id === driverId,
          ),
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const availabilityDates = useMemo(
    () => driver?.availability_dates ?? [],
    [driver?.availability_dates],
  );
  const calendarMarkers = useMemo(
    () => [
      ...availabilityDates.map((date) => ({
        date,
        label: "Available",
        tone: "emerald" as const,
      })),
      ...missions.map((mission) => ({
        date: toDateInputValue(new Date(mission.created_at)),
        label: mission.title,
        tone:
          mission.status === "delivered"
            ? ("slate" as const)
            : mission.status === "cancelled"
              ? ("red" as const)
              : ("blue" as const),
      })),
    ],
    [availabilityDates, missions],
  );

  // Handles the calendar select action.
  function handleCalendarSelect(date: string) {
    setError(null);
    setSelectedDate(date);

    if (!selectionMode) return;

    if (selectionMode === "remove" && !availabilityDates.includes(date)) {
      setError("Only available dates can be selected for removal.");
      return;
    }

    setSelectedDates((current) =>
      current.includes(date)
        ? current.filter((item) => item !== date)
        : [...current, date],
    );
  }

  // Saves the availability.
  async function saveAvailability(nextDates: string[]) {
    if (!driver) return;

    setSaving(true);
    setError(null);
    try {
      const updated = await updateDriverAvailability(driver.id, nextDates);
      setDriver(updated);
      setSelectedDates([]);
      setSelectionMode(null);
    } catch (err) {
      const rawMessage =
        err && typeof err === "object" && "detail" in err
          ? String(err.detail)
          : err instanceof Error
            ? err.message
          : "Could not update availability dates.";
      const message =
        rawMessage === "Not Found"
          ? "Availability route not found. Restart the backend server and try again."
          : rawMessage;
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  // Handles the primary action action.
  async function handlePrimaryAction() {
    if (!selectionMode) {
      setSelectionMode("add");
      setSelectedDates([]);
      return;
    }

    if (selectedDates.length === 0) return;

    await saveAvailability(
      [...new Set([...availabilityDates, ...selectedDates])].sort(),
    );
  }

  // Handles the remove selected action.
  async function handleRemoveSelected() {
    if (selectedDates.length === 0) return;

    await saveAvailability(
      availabilityDates.filter((date) => !selectedDates.includes(date)),
    );
  }

  // Starts the remove selection.
  function startRemoveSelection() {
    setSelectionMode("remove");
    setSelectedDates([]);
    setError(null);
  }

  if (loading) {
    return (
      <LoadingScreen label="Loading availability..." />
    );
  }

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <BackToMenuButton href="/driver/menu" />
          <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-emerald-400">
            Driver Availability
          </p>
          <h1 className="mt-1 text-3xl font-semibold">Availability Calendar</h1>
          <p className="mt-2 text-muted">
            Select dates you can drive and save them for dispatcher planning.
          </p>
        </header>

        <section className="rounded-xl border border-app bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-main">
                Availability Window
              </h2>
              <p className="mt-1 text-sm text-muted">
                {selectionMode
                  ? `${selectedDates.length} date${
                      selectedDates.length === 1 ? "" : "s"
                    } selected to ${
                      selectionMode === "remove" ? "remove" : "mark"
                    }`
                  : `${availabilityDates.length} available date${
                      availabilityDates.length === 1 ? "" : "s"
                    } saved`}
              </p>
              {error && (
                <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-700 dark:text-red-300">
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {selectionMode && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectionMode(null);
                    setSelectedDates([]);
                    setError(null);
                  }}
                  className="rounded-xl border border-app bg-card-soft px-5 py-3 text-sm font-bold text-main transition hover:bg-card-soft"
                >
                  Cancel selection
                </button>
              )}

              {!selectionMode && availabilityDates.length > 0 && (
                <button
                  type="button"
                  onClick={startRemoveSelection}
                  className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-700 dark:text-red-200 transition hover:bg-red-500/15"
                >
                  Select dates to remove
                </button>
              )}

              {selectionMode === "remove" && (
                <button
                  type="button"
                  onClick={handleRemoveSelected}
                  disabled={saving || selectedDates.length === 0}
                  className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  {selectedDates.length > 0
                    ? "Remove availability"
                    : "Select dates on calendar"}
                </button>
              )}

              {selectionMode !== "remove" && (
                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  disabled={
                    saving ||
                    (selectionMode === "add" && selectedDates.length === 0)
                  }
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {!selectionMode
                    ? "Select available dates"
                    : selectedDates.length > 0
                      ? "Mark dates as available"
                      : "Select dates on calendar"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-app pt-5">
            <Calendar
              embedded
              selectedDate={selectedDate}
              onSelectDate={handleCalendarSelect}
              markers={calendarMarkers}
              selectedDates={
                selectionMode === "remove"
                  ? availabilityDates
                  : [...new Set([...availabilityDates, ...selectedDates])]
              }
              removalDates={selectionMode === "remove" ? selectedDates : []}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
