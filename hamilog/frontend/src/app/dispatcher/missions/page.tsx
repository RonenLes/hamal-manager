"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BackToMenuButton from "@/components/shared/BackToMenuButton";

import {
  type Mission,
  type MissionPriority,
  getMissions,
  getToken,
  getStoredUser,
  createMission as apiCreateMission,
} from "@/lib/api-client";

import DispatcherStatBox from "@/components/dispatcher/shared/DispatcherStatBox";
import MissionEntry from "@/components/dispatcher/missions/MissionEntry";
import MissionFilters, {
  type MissionStatusFilter,
} from "@/components/dispatcher/missions/MissionFilters";
import NewMissionFormPanel, {
  type NewMissionForm,
} from "@/components/dispatcher/missions/NewMissionFormPanel";

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

function getInitialFiltersFromQuery(): MissionStatusFilter {
  if (typeof window === "undefined") return initialFilters;

  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  const priority = params.get("priority");

  if (!status && !priority) return initialFilters;

  return {
    ...initialFilters,
    unassigned: status === "open",
    assigned: status === "open",
    active: status === "active",
    urgencyLow: priority === "low",
    urgencyMedium: priority === "medium",
    urgencyHigh: priority === "high",
    urgencyCritical: priority === "critical",
  };
}

const initialForm: NewMissionForm = {
  title: "",
  cargoDescription: "",
  from: "",
  to: "",
  urgency: "medium",
  cooling: "no",
  heavyLoad: "no",
};

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

async function createMission(body: NewMissionForm) {
  const isHeavyLoad = body.heavyLoad === "yes";
  const requiresCooling = body.cooling === "yes";
  const missionTitle =
    body.title.trim() ||
    body.cargoDescription.trim().slice(0, 40) ||
    "New Delivery Mission";

  return apiCreateMission({
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
  });
}

export default function MissionsPage() {
  const router = useRouter();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(
    null
  );
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filters, setFilters] = useState<MissionStatusFilter>(
    getInitialFiltersFromQuery,
  );
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
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
            <div className="mb-4">
              <BackToMenuButton href="/dispatcher/menu" />
            </div>
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
          <DispatcherStatBox
            title="Missions"
            value={stats.total}
            subtitle="Total missions"
          />
          <DispatcherStatBox
            title="Unassigned"
            value={stats.unassigned}
            subtitle="Needs driver"
          />
          <DispatcherStatBox
            title="Assigned"
            value={stats.assigned}
            subtitle="Driver selected"
          />
          <DispatcherStatBox
            title="Active"
            value={stats.active}
            subtitle="In delivery"
          />
          <DispatcherStatBox
            title="Cooling"
            value={stats.cooling}
            subtitle="Requires cooling"
          />
        </section>

        {isAddOpen && (
          <NewMissionFormPanel
            form={form}
            posting={posting}
            onUpdate={updateForm}
            onSubmit={handlePostMission}
          />
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
                  <MissionEntry
                    key={mission.id}
                    mission={mission}
                    state={state}
                    isExpanded={isExpanded}
                    onToggle={() =>
                      setExpandedMissionId(isExpanded ? null : mission.id)
                    }
                    getStateClasses={getStateClasses}
                  />
                );
              })}
            </div>
          </div>

          <MissionFilters
            filters={filters}
            onToggle={updateFilter}
            onReset={() => setFilters(initialFilters)}
          />
        </section>
      </div>
    </main>
  );
}
