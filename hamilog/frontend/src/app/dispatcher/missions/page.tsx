"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type Mission,
  type MissionPriority,
  getMissions,
  getToken,
  getStoredUser,
} from "@/lib/api-client";

import PriorityBadge from "@/components/dispatcher/PriorityBadge";

type MissionStatusFilter = {
  unassigned: boolean;
  assigned: boolean;
  active: boolean;
  cooling: boolean;
  urgencyLow: boolean;
  urgencyMedium: boolean;
  urgencyHigh: boolean;
  urgencyCritical: boolean;
  orderByDeliveryDate: boolean;
};

type NewMissionForm = {
  title: string;
  cargoDescription: string;
  from: string;
  to: string;
  urgency: MissionPriority;
  cooling: "yes" | "no";
  heavyLoad: "yes" | "no";
};

const initialFilters: MissionStatusFilter = {
  unassigned: true,
  assigned: true,
  active: true,
  cooling: false,
  urgencyLow: false,
  urgencyMedium: false,
  urgencyHigh: false,
  urgencyCritical: false,
  orderByDeliveryDate: true,
};

const initialForm: NewMissionForm = {
  title: "",
  cargoDescription: "",
  from: "",
  to: "",
  urgency: "medium",
  cooling: "no",
  heavyLoad: "no",
};

function formatDateTime(dateValue?: string) {
  if (!dateValue) return "Unknown";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMissionState(mission: Mission) {
  if (mission.status === "in_transit") return "active";
  if (mission.status === "assigned") return "assigned";
  if (mission.status === "available" && !mission.assigned_driver_id) {
    return "unassigned";
  }

  return mission.status;
}

function getStateClasses(state: string) {
  if (state === "active") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (state === "assigned") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  }

  if (state === "unassigned") {
    return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  }

  if (state === "delivered") {
    return "border-slate-500/30 bg-slate-500/10 text-muted";
  }

  if (state === "cancelled") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  return "border-slate-500/30 bg-slate-500/10 text-muted";
}

function getPriorityRank(priority: MissionPriority) {
  switch (priority) {
    case "critical":
      return 0;
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
      return 3;
    default:
      return 4;
  }
}

function StatBox({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-app bg-card p-5 shadow-xl">
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-2 text-3xl font-black text-main">{value}</p>
      <p className="mt-1 text-xs text-soft">{subtitle}</p>
    </div>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center justify-between rounded-xl border border-app bg-app px-4 py-3 text-left text-sm transition hover:bg-card-soft"
    >
      <span className="text-muted">{label}</span>

      <span
        className={`flex h-6 w-6 items-center justify-center rounded-md border text-sm font-black ${
          checked
            ? "border-emerald-500 bg-emerald-500 text-main"
            : "border-app bg-card-soft text-transparent"
        }`}
      >
        ✓
      </span>
    </button>
  );
}

async function createMission(body: NewMissionForm) {
  const token = getToken();

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const isHeavyLoad = body.heavyLoad === "yes";
  const requiresCooling = body.cooling === "yes";

  const missionTitle =
    body.title.trim() ||
    body.cargoDescription.trim().slice(0, 40) ||
    "New Delivery Mission";

  const response = await fetch(`${apiUrl}/api/missions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: missionTitle,
      description: body.cargoDescription,
      priority: body.urgency,
      cargo: {
        weight_kg: isHeavyLoad ? 120 : 20,
        volume_liters: isHeavyLoad ? 250 : 60,
        requires_cooling: requiresCooling,
      },
      pickup: {
        lat: 0,
        lng: 0,
        address: body.from,
      },
      dropoff: {
        lat: 0,
        lng: 0,
        address: body.to,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create mission");
  }

  return response.json();
}

export default function MissionsPage() {
  const router = useRouter();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(
    null
  );
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filters, setFilters] = useState<MissionStatusFilter>(initialFilters);
  const [form, setForm] = useState<NewMissionForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (!token || !user || user.role !== "dispatcher") {
      router.replace("/login?role=dispatcher");
    }
  }, [router]);

  async function fetchData() {
    try {
      const missionsData = await getMissions();
      setMissions(missionsData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    return {
      total: missions.length,
      unassigned: missions.filter(
        (mission) => getMissionState(mission) === "unassigned"
      ).length,
      assigned: missions.filter(
        (mission) => getMissionState(mission) === "assigned"
      ).length,
      active: missions.filter(
        (mission) => getMissionState(mission) === "active"
      ).length,
      cooling: missions.filter((mission) => mission.cargo?.requires_cooling)
        .length,
    };
  }, [missions]);

  const filteredMissions = useMemo(() => {
    let result = missions.filter((mission) => {
      const state = getMissionState(mission);

      const statusMatches =
        (filters.unassigned && state === "unassigned") ||
        (filters.assigned && state === "assigned") ||
        (filters.active && state === "active");

      const noStatusFilterSelected =
        !filters.unassigned && !filters.assigned && !filters.active;

      const statusOk = noStatusFilterSelected || statusMatches;

      const coolingOk =
        !filters.cooling || Boolean(mission.cargo?.requires_cooling);

      const urgencyFiltersSelected =
        filters.urgencyLow ||
        filters.urgencyMedium ||
        filters.urgencyHigh ||
        filters.urgencyCritical;

      const urgencyOk =
        !urgencyFiltersSelected ||
        (filters.urgencyLow && mission.priority === "low") ||
        (filters.urgencyMedium && mission.priority === "medium") ||
        (filters.urgencyHigh && mission.priority === "high") ||
        (filters.urgencyCritical && mission.priority === "critical");

      return statusOk && coolingOk && urgencyOk;
    });

    result = [...result].sort((a, b) => {
      if (filters.orderByDeliveryDate) {
        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      }

      return getPriorityRank(a.priority) - getPriorityRank(b.priority);
    });

    return result;
  }, [missions, filters]);

  function updateFilter(key: keyof MissionStatusFilter) {
    setFilters((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function updateForm<K extends keyof NewMissionForm>(
    key: K,
    value: NewMissionForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handlePostMission() {
    if (!form.cargoDescription.trim() || !form.from.trim() || !form.to.trim()) {
      alert("Please fill cargo description, from, and to.");
      return;
    }

    setPosting(true);

    try {
      await createMission(form);
      setForm(initialForm);
      setIsAddOpen(false);
      await fetchData();
    } catch {
      alert("Could not post mission. Make sure the backend is running.");
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-main">
        Loading missions...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-red-400">
              Mission Management
            </p>

            <h1 className="mt-1 text-3xl font-black">Missions</h1>

            <p className="mt-2 text-muted">
              Add missions, review delivery details, and filter the mission pool.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddOpen((current) => !current)}
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-main transition hover:bg-emerald-500"
          >
            {isAddOpen ? "Close Mission Form" : "+ Add New Mission"}
          </button>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatBox title="Missions" value={stats.total} subtitle="Total missions" />
          <StatBox
            title="Unassigned"
            value={stats.unassigned}
            subtitle="Needs driver"
          />
          <StatBox
            title="Assigned"
            value={stats.assigned}
            subtitle="Driver selected"
          />
          <StatBox title="Active" value={stats.active} subtitle="In delivery" />
          <StatBox
            title="Cooling"
            value={stats.cooling}
            subtitle="Requires cooling"
          />
        </section>

        {isAddOpen && (
          <section className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-xl">
            <div className="mb-5">
              <h2 className="text-xl font-black text-main">
                Add New Mission
              </h2>

              <p className="mt-1 text-sm text-muted">
                Fill the delivery information and post it to the mission pool.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-muted">
                  Mission title
                </label>

                <input
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  placeholder="Example: Medical supplies delivery"
                  className="w-full rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-muted">
                  Urgency
                </label>

                <select
                  value={form.urgency}
                  onChange={(event) =>
                    updateForm("urgency", event.target.value as MissionPriority)
                  }
                  className="w-full rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-emerald-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-muted">
                  Cooling
                </label>

                <select
                  value={form.cooling}
                  onChange={(event) =>
                    updateForm("cooling", event.target.value as "yes" | "no")
                  }
                  className="w-full rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-emerald-500"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-muted">
                  Heavy load
                </label>

                <select
                  value={form.heavyLoad}
                  onChange={(event) =>
                    updateForm("heavyLoad", event.target.value as "yes" | "no")
                  }
                  className="w-full rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-emerald-500"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-muted">
                  From
                </label>

                <input
                  value={form.from}
                  onChange={(event) => updateForm("from", event.target.value)}
                  placeholder="Pickup address"
                  className="w-full rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-muted">
                  To
                </label>

                <input
                  value={form.to}
                  onChange={(event) => updateForm("to", event.target.value)}
                  placeholder="Dropoff address"
                  className="w-full rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-muted">
                  Cargo description
                </label>

                <textarea
                  value={form.cargoDescription}
                  onChange={(event) =>
                    updateForm("cargoDescription", event.target.value)
                  }
                  placeholder="Describe what should be delivered..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handlePostMission}
                disabled={posting}
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-main transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {posting ? "Posting..." : "Post Mission"}
              </button>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-app bg-card shadow-xl">
            <div className="border-b border-app px-5 py-4">
              <h2 className="text-xl font-bold">Mission Entries</h2>
              <p className="mt-1 text-sm text-muted">
                Click a mission to expand its full delivery details.
              </p>
            </div>

            <div className="divide-y divide-white/10">
              {filteredMissions.length === 0 && (
                <div className="p-8 text-center text-muted">
                  No missions match the selected filters.
                </div>
              )}

              {filteredMissions.map((mission) => {
                const state = getMissionState(mission);
                const isExpanded = expandedMissionId === mission.id;

                return (
                  <article key={mission.id} className="bg-card">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMissionId(isExpanded ? null : mission.id)
                      }
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-card-soft"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-bold text-main">
                            {mission.title}
                          </h3>

                          <PriorityBadge priority={mission.priority} />

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStateClasses(
                              state
                            )}`}
                          >
                            {state.replace("_", " ")}
                          </span>

                          {mission.cargo?.requires_cooling && (
                            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
                              Cooling
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-sm text-muted">
                          {mission.pickup?.address || "Pickup TBD"} →{" "}
                          {mission.dropoff?.address || "Dropoff TBD"}
                        </p>
                      </div>

                      <span className="text-xl text-muted">
                        {isExpanded ? "⌃" : "⌄"}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-app bg-app/60 px-5 py-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <div className="rounded-xl border border-app bg-card p-4">
                            <p className="text-xs uppercase tracking-wider text-soft">
                              Status
                            </p>

                            <p
                              className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-bold capitalize ${getStateClasses(
                                state
                              )}`}
                            >
                              {state.replace("_", " ")}
                            </p>
                          </div>

                          <div className="rounded-xl border border-app bg-card p-4">
                            <p className="text-xs uppercase tracking-wider text-soft">
                              Urgency
                            </p>

                            <div className="mt-2">
                              <PriorityBadge priority={mission.priority} />
                            </div>
                          </div>

                          <div className="rounded-xl border border-app bg-card p-4">
                            <p className="text-xs uppercase tracking-wider text-soft">
                              Published
                            </p>

                            <p className="mt-2 font-semibold text-main">
                              {formatDateTime(mission.created_at)}
                            </p>
                          </div>

                          <div className="rounded-xl border border-app bg-card p-4">
                            <p className="text-xs uppercase tracking-wider text-soft">
                              From
                            </p>

                            <p className="mt-2 font-semibold text-main">
                              {mission.pickup?.address ||
                                "Pickup location TBD"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-app bg-card p-4">
                            <p className="text-xs uppercase tracking-wider text-soft">
                              To
                            </p>

                            <p className="mt-2 font-semibold text-main">
                              {mission.dropoff?.address ||
                                "Dropoff location TBD"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-app bg-card p-4">
                            <p className="text-xs uppercase tracking-wider text-soft">
                              Assigned Driver
                            </p>

                            <p className="mt-2 font-semibold text-main">
                              {mission.assigned_driver_id || "No driver assigned"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-app bg-card p-4 md:col-span-2">
                            <p className="text-xs uppercase tracking-wider text-soft">
                              Cargo
                            </p>

                            <p className="mt-2 font-semibold text-main">
                              {mission.description || "No cargo description"}
                            </p>

                            <p className="mt-1 text-sm text-muted">
                              {mission.cargo?.weight_kg ?? "?"} kg ·{" "}
                              {mission.cargo?.volume_liters ?? "?"} L
                              {mission.cargo?.requires_cooling
                                ? " · Cooling required"
                                : ""}
                            </p>
                          </div>

                          <div className="rounded-xl border border-app bg-card p-4">
                            <p className="text-xs uppercase tracking-wider text-soft">
                              Mission ID
                            </p>

                            <p className="mt-2 font-mono text-sm text-muted">
                              {mission.id}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="rounded-2xl border border-app bg-card p-5 shadow-xl">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-main">Filters</h2>
              <p className="mt-1 text-sm text-muted">
                Tick filters with ✓ to control the mission list.
              </p>
            </div>

            <div className="space-y-3">
              <FilterCheckbox
                label="Unassigned"
                checked={filters.unassigned}
                onChange={() => updateFilter("unassigned")}
              />

              <FilterCheckbox
                label="Assigned"
                checked={filters.assigned}
                onChange={() => updateFilter("assigned")}
              />

              <FilterCheckbox
                label="Active"
                checked={filters.active}
                onChange={() => updateFilter("active")}
              />

              <FilterCheckbox
                label="Cooling"
                checked={filters.cooling}
                onChange={() => updateFilter("cooling")}
              />

              <FilterCheckbox
                label="Order by delivery date"
                checked={filters.orderByDeliveryDate}
                onChange={() => updateFilter("orderByDeliveryDate")}
              />

              <div className="pt-3">
                <p className="mb-2 text-sm font-bold text-muted">
                  Urgency
                </p>

                <div className="space-y-3">
                  <FilterCheckbox
                    label="Urgency: Low"
                    checked={filters.urgencyLow}
                    onChange={() => updateFilter("urgencyLow")}
                  />

                  <FilterCheckbox
                    label="Urgency: Medium"
                    checked={filters.urgencyMedium}
                    onChange={() => updateFilter("urgencyMedium")}
                  />

                  <FilterCheckbox
                    label="Urgency: High"
                    checked={filters.urgencyHigh}
                    onChange={() => updateFilter("urgencyHigh")}
                  />

                  <FilterCheckbox
                    label="Urgency: Critical"
                    checked={filters.urgencyCritical}
                    onChange={() => updateFilter("urgencyCritical")}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFilters(initialFilters)}
                className="mt-4 w-full rounded-xl border border-app bg-card-soft px-4 py-3 text-sm font-bold text-main transition hover:bg-card-soft"
              >
                Reset Filters
              </button>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}