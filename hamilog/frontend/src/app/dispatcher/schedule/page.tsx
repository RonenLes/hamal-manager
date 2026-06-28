"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BackToMenuButton from "@/components/shared/BackToMenuButton";
import Calendar from "@/components/shared/Calendar";

import {
  type Mission,
  type Driver,
  getMissions,
  getDrivers,
  getToken,
  getStoredUser,
} from "@/lib/api-client";
import { formatDateDisplay } from "@/lib/date-format";

import DispatcherStatBox from "@/components/dispatcher/shared/DispatcherStatBox";
import ScheduleEntry, {
  type DeliveryState,
} from "@/components/dispatcher/schedule/ScheduleEntry";

// Returns the delivery state.
function getDeliveryState(mission: Mission): DeliveryState {
  if (mission.status === "in_transit") return "active";
  if (mission.status === "assigned") return "assigned";
  if (mission.status === "delivered") return "delivered";
  if (mission.status === "cancelled") return "cancelled";

  return "unassigned";
}

// Converts the value to a local date input value.
function toLocalDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Formats the readable date for display.
function formatReadableDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  return formatDateDisplay(date);
}

// Checks whether the value is same local date.
function isSameLocalDate(dateValue: string | undefined, selectedDate: string) {
  if (!dateValue) return false;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return toLocalDateInputValue(date) === selectedDate;
}

// Renders the todays schedule page component.
export default function TodaysSchedulePage() {
  const router = useRouter();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    toLocalDateInputValue(new Date())
  );

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (!token || !user || user.role !== "dispatcher") {
      router.replace("/login?role=dispatcher");
    }
  }, [router]);

  // Fetches the latest page data.
  async function fetchData() {
    try {
      const [missionsData, driversData] = await Promise.all([
        getMissions(),
        getDrivers(),
      ]);

      setMissions(missionsData);
      setDrivers(driversData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const scheduleMissions = useMemo(() => {
    return missions.filter((mission) =>
      isSameLocalDate(mission.created_at, selectedDate)
    );
  }, [missions, selectedDate]);

  const stats = useMemo(() => {
    return {
      total: scheduleMissions.length,
      active: scheduleMissions.filter(
        (mission) => getDeliveryState(mission) === "active"
      ).length,
      assigned: scheduleMissions.filter(
        (mission) => getDeliveryState(mission) === "assigned"
      ).length,
      unassigned: scheduleMissions.filter(
        (mission) => getDeliveryState(mission) === "unassigned"
      ).length,
      delivered: scheduleMissions.filter(
        (mission) => getDeliveryState(mission) === "delivered"
      ).length,
    };
  }, [scheduleMissions]);

  const sortedMissions = useMemo(() => {
    const stateOrder: Record<DeliveryState, number> = {
      active: 0,
      assigned: 1,
      unassigned: 2,
      delivered: 3,
      cancelled: 4,
    };

    const priorityOrder = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return [...scheduleMissions].sort((a, b) => {
      const stateDiff =
        stateOrder[getDeliveryState(a)] - stateOrder[getDeliveryState(b)];

      if (stateDiff !== 0) return stateDiff;

      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [scheduleMissions]);

  const calendarMarkers = useMemo(() => {
    return missions.map((mission) => ({
      date: toLocalDateInputValue(new Date(mission.created_at)),
      label: mission.title,
      tone:
        mission.status === "delivered"
          ? ("slate" as const)
          : mission.status === "cancelled"
            ? ("red" as const)
            : mission.status === "available"
              ? ("orange" as const)
              : ("blue" as const),
    }));
  }, [missions]);

  // Returns the driver name.
  function getDriverName(driverId?: string | null) {
    if (!driverId) return "No driver assigned";

    return (
      drivers.find((driver) => driver.id === driverId)?.name ||
      "Unknown driver"
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-main">
        Loading schedule...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4">
              <BackToMenuButton href="/dispatcher/menu" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              Date Schedule
            </p>
            <h1 className="mt-1 text-3xl font-black">
              {formatReadableDate(selectedDate)} Schedule
            </h1>
            <p className="mt-2 text-muted">
              Track deliveries, assignments, urgency, drivers, cargo, and active
              missions for the selected date.
            </p>
          </div>

          <div className="rounded-2xl border border-app bg-card p-4">
            <label className="mb-2 block text-sm font-semibold text-muted">
              Change date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setExpandedId(null);
              }}
              className="rounded-xl border border-app bg-app px-4 py-2 text-main outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowCalendar((current) => !current)}
              className="mt-3 w-full rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-200 transition hover:bg-blue-500/20"
            >
              {showCalendar ? "Hide calendar" : "View in calendar"}
            </button>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <DispatcherStatBox
            title="Selected Date"
            value={stats.total}
            subtitle="Total missions"
          />
          <DispatcherStatBox
            title="In Action"
            value={stats.active}
            subtitle="Currently active"
          />
          <DispatcherStatBox
            title="Assigned"
            value={stats.assigned}
            subtitle="Waiting to start"
          />
          <DispatcherStatBox
            title="Unassigned"
            value={stats.unassigned}
            subtitle="Needs driver"
          />
          <DispatcherStatBox
            title="Delivered"
            value={stats.delivered}
            subtitle="Completed"
          />
        </section>

        {showCalendar && (
          <div className="mb-6">
            <Calendar
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setExpandedId(null);
              }}
              markers={calendarMarkers}
            />
          </div>
        )}

        <section className="rounded-2xl border border-app bg-card shadow-xl">
          <div className="border-b border-app px-5 py-4">
            <h2 className="text-xl font-bold">Delivery Entries</h2>
            <p className="mt-1 text-sm text-muted">
              Click a delivery to expand its full information.
            </p>
          </div>

          <div className="divide-y divide-white/10">
            {sortedMissions.length === 0 && (
              <div className="p-8 text-center text-muted">
                No deliveries for this date.
              </div>
            )}

            {sortedMissions.map((mission) => {
              const state = getDeliveryState(mission);
              const isExpanded = expandedId === mission.id;

              return (
                <ScheduleEntry
                  key={mission.id}
                  mission={mission}
                  state={state}
                  driverName={getDriverName(mission.assigned_driver_id)}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedId(isExpanded ? null : mission.id)}
                />
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
