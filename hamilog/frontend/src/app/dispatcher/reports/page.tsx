"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import CargoReport from "@/components/dispatcher/reports/cargo/CargoReport";
import DriversReport from "@/components/dispatcher/reports/drivers/DriversReport";
import MissionsReport from "@/components/dispatcher/reports/missions/MissionsReport";
import OverviewReport from "@/components/dispatcher/reports/overview/OverviewReport";
import BackToMenuButton from "@/components/shared/BackToMenuButton";
import MetricCard from "@/components/dispatcher/reports/shared/MetricCard";
import type {
  CargoGraph,
  DatePreset,
  DriverGraph,
  ExportColumn,
  ExportRow,
  MissionDetailCargo,
  MissionDetailPriority,
  MissionDetailStatus,
  MissionGraph,
  ReportFilterProps,
  ReportStats,
  ReportView,
} from "@/components/dispatcher/reports/shared/types";
import {
  endOfDay,
  endOfMonth,
  formatDateDisplay,
  formatDateForFilename,
  formatDateTimeDisplay,
  exportTableToExcel,
  exportTableToPdf,
  getDateBuckets,
  getDateRange,
  groupCount,
  isWithinRange,
  labelize,
  percent,
  startOfMonth,
  toDateInputValue,
  toDayKey,
} from "@/components/dispatcher/reports/shared/utils";
import {
  type Driver,
  type Mission,
  getDrivers,
  getMissions,
  getStoredUser,
  getToken,
} from "@/lib/api-client";
import { formatIdealDeliveryTime, getMissionDeliveredAt } from "@/lib/mission-time";
import { getMissionDistanceKm } from "@/lib/mission-distance";

const reportViews: { id: ReportView; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "missions", label: "Missions" },
  { id: "drivers", label: "Drivers" },
  { id: "cargo", label: "Cargo" },
];

const driverGraphLabels: Record<DriverGraph, string> = {
  deliveries: "Deliveries by driver",
  score: "Driver score",
  km: "Total km by driver",
};

const missionGraphLabels: Record<MissionGraph, string> = {
  createdByDate: "Missions created by date",
  completedByDate: "Missions completed by date",
};

function getInitialDate(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return toDateInputValue(date);
}

export default function DispatcherReportsPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ReportView>("overview");
  const [datePreset, setDatePreset] = useState<DatePreset>("last30");
  const [manualDates, setManualDates] = useState(false);
  const [fromDate, setFromDate] = useState(() => getInitialDate(30));
  const [toDate, setToDate] = useState(() => toDateInputValue(new Date()));
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [driverGraph, setDriverGraph] = useState<DriverGraph>("deliveries");
  const [missionGraph, setMissionGraph] = useState<MissionGraph>("createdByDate");
  const [cargoGraph, setCargoGraph] = useState<CargoGraph>("cargoByDate");
  const [missionDetailStatus, setMissionDetailStatus] =
    useState<MissionDetailStatus>("all");
  const [missionDetailPriority, setMissionDetailPriority] =
    useState<MissionDetailPriority>("all");
  const [missionDetailCargo, setMissionDetailCargo] =
    useState<MissionDetailCargo>("all");
  const [missionDetailFromDate, setMissionDetailFromDate] = useState(() =>
    getInitialDate(30),
  );
  const [missionDetailToDate, setMissionDetailToDate] = useState(() =>
    toDateInputValue(new Date()),
  );

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (!token || !user || user.role !== "dispatcher") {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
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

    fetchData();
  }, []);

  const range = useMemo(
    () => getDateRange(datePreset, manualDates, fromDate, toDate),
    [datePreset, fromDate, manualDates, toDate],
  );
  const rangeLabel = `${formatDateDisplay(range.start)} - ${formatDateDisplay(range.end)}`;

  const filteredMissions = useMemo(() => {
    return missions.filter((mission) => {
      const inRange = isWithinRange(mission.created_at, range.start, range.end);
      const allowedStatus = includeCancelled || mission.status !== "cancelled";
      return inRange && allowedStatus;
    });
  }, [includeCancelled, missions, range.end, range.start]);

  const stats = useMemo<ReportStats>(() => {
    const delivered = filteredMissions.filter((mission) => mission.status === "delivered").length;
    const active = filteredMissions.filter((mission) => mission.status === "in_transit").length;
    const assigned = filteredMissions.filter((mission) => mission.status === "assigned").length;
    const unassigned = filteredMissions.filter((mission) => mission.status === "available").length;
    const cooling = filteredMissions.filter((mission) => mission.cargo.requires_cooling).length;
    const totalWeight = filteredMissions.reduce((sum, mission) => sum + mission.cargo.weight_kg, 0);
    const totalVolume = filteredMissions.reduce(
      (sum, mission) => sum + mission.cargo.volume_liters,
      0,
    );
    const deliveredMissions = filteredMissions.filter(
      (mission) => mission.status === "delivered",
    );
    const averageCompletionMs =
      deliveredMissions.length === 0
        ? 0
        : deliveredMissions.reduce((sum, mission) => {
            const deliveredAt = getMissionDeliveredAt(mission);
            return (
              sum +
              Math.max(
                0,
                new Date(deliveredAt ?? mission.updated_at).getTime() -
                  new Date(mission.created_at).getTime(),
              )
            );
          }, 0) / deliveredMissions.length;

    return {
      delivered,
      active,
      assigned,
      unassigned,
      open: assigned + unassigned,
      cooling,
      totalWeight,
      totalVolume,
      activeDrivers: drivers.filter((driver) => driver.status !== "offline").length,
      availableDrivers: drivers.filter((driver) => driver.status === "available").length,
      driversInMission: drivers.filter(
        (driver) => driver.status === "on_mission" || Boolean(driver.current_mission_id),
      ).length,
      averageCompletionMs,
      completionRate: percent(delivered, filteredMissions.length),
    };
  }, [drivers, filteredMissions]);

  const filterProps: ReportFilterProps = {
    datePreset,
    manualDates,
    fromDate,
    toDate,
    includeCancelled,
    rangeLabel,
    onDatePresetChange: setDatePreset,
    onManualDatesChange: setManualDates,
    onFromDateChange: setFromDate,
    onToDateChange: setToDate,
    onIncludeCancelledChange: setIncludeCancelled,
  };

  const carTypeRows = useMemo(() => {
    const counts = groupCount(drivers.map((driver) => driver.car_type));
    return Object.entries(counts).map(([label, value]) => ({
      label: labelize(label),
      value,
      color: label === "refrigerated_van" ? "bg-cyan-500" : "bg-violet-500",
    }));
  }, [drivers]);

  const cargoTruckStats = useMemo(() => {
    const coolingTrucks = drivers.filter(
      (driver) => driver.car_type === "refrigerated_van",
    );
    const standardTrucks = drivers.filter(
      (driver) => driver.car_type !== "refrigerated_van",
    );
    const isActive = (driver: Driver) =>
      driver.status === "on_mission" || Boolean(driver.current_mission_id);

    return {
      coolingAvailable: coolingTrucks.filter((driver) => driver.status === "available").length,
      coolingActive: coolingTrucks.filter(isActive).length,
      standardAvailable: standardTrucks.filter((driver) => driver.status === "available").length,
      standardActive: standardTrucks.filter(isActive).length,
    };
  }, [drivers]);

  const driverDeliveryRows = useMemo(() => {
    return drivers
      .map((driver) => ({
        label: driver.name,
        value: missions.filter(
          (mission) =>
            mission.assigned_driver_id === driver.id &&
            mission.status === "delivered" &&
            isWithinRange(
              getMissionDeliveredAt(mission) ?? mission.updated_at,
              range.start,
              range.end,
            ),
        ).length,
      }))
      .sort((a, b) => b.value - a.value);
  }, [drivers, missions, range.end, range.start]);

  const driverScoreRows = useMemo(() => {
    return drivers
      .map((driver) => {
        const driverMissions = missions.filter(
          (mission) =>
            mission.assigned_driver_id === driver.id &&
            isWithinRange(mission.updated_at, range.start, range.end),
        );
        const delivered = driverMissions.filter(
          (mission) => mission.status === "delivered",
        ).length;
        const cancelled = driverMissions.filter(
          (mission) => mission.status === "cancelled",
        ).length;
        const deliveryRate =
          driverMissions.length > 0 ? percent(delivered, driverMissions.length) : 0;
        const statusBonus =
          driver.status === "available" ? 10 : driver.status === "on_mission" ? 6 : 0;
        const volumeBonus = Math.min(30, delivered * 6);
        const score = Math.max(
          0,
          Math.min(
            100,
            Math.round(deliveryRate * 0.6 + volumeBonus - cancelled * 10 + statusBonus),
          ),
        );

        return {
          label: driver.name,
          value: score,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [drivers, missions, range.end, range.start]);

  const driverKmRows = useMemo(() => {
    return drivers
      .map((driver) => {
        const value = missions
          .filter(
            (mission) =>
              mission.assigned_driver_id === driver.id &&
              mission.status === "delivered" &&
              isWithinRange(
                getMissionDeliveredAt(mission) ?? mission.updated_at,
                range.start,
                range.end,
              ),
          )
          .reduce((sum, mission) => sum + getMissionDistanceKm(mission), 0);

        return {
          label: driver.name,
          value: Math.round(value),
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [drivers, missions, range.end, range.start]);

  const selectedDriverRows =
    driverGraph === "deliveries"
      ? driverDeliveryRows
      : driverGraph === "score"
        ? driverScoreRows
        : driverKmRows;
  const selectedDriverGraphLabel = driverGraphLabels[driverGraph];
  const selectedDriverMeasurement =
    driverGraph === "deliveries"
      ? "Deliveries made"
      : driverGraph === "score"
        ? "Driver score / 100"
        : "Kilometers driven";

  const cargoRows = useMemo(
    () => [
      {
        label: "Cooling required",
        value: stats.cooling,
        color: "bg-cyan-500",
      },
      {
        label: "Standard cargo",
        value: filteredMissions.length - stats.cooling,
        color: "bg-blue-500",
      },
    ],
    [filteredMissions.length, stats.cooling],
  );

  const trendPoints = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return startOfMonth(date);
    });

    return months.map((month) => {
      const monthEnd = endOfMonth(month);
      const monthMissions = missions.filter((mission) =>
        isWithinRange(mission.created_at, month, monthEnd),
      );

      return {
        label: formatDateDisplay(month),
        created: monthMissions.length,
        delivered: monthMissions.filter((mission) => mission.status === "delivered").length,
      };
    });
  }, [missions]);

  const dateBuckets = useMemo(
    () => getDateBuckets(range.start, range.end),
    [range.end, range.start],
  );

  const missionCreatedByDateGroups = useMemo(() => {
    return dateBuckets.map((date) => {
      const dayMissions = filteredMissions.filter(
        (mission) => toDayKey(mission.created_at) === date,
      );
      return {
        label: formatDateDisplay(new Date(`${date}T00:00:00`)),
        values: {
          critical: dayMissions.filter((mission) => mission.priority === "critical").length,
          high: dayMissions.filter((mission) => mission.priority === "high").length,
          medium: dayMissions.filter((mission) => mission.priority === "medium").length,
          low: dayMissions.filter((mission) => mission.priority === "low").length,
        },
      };
    });
  }, [dateBuckets, filteredMissions]);

  const missionCompletedByDateGroups = useMemo(() => {
    return dateBuckets.map((date) => {
      const dayMissions = missions.filter(
        (mission) =>
          mission.status === "delivered" &&
          toDayKey(getMissionDeliveredAt(mission) ?? mission.updated_at) === date,
      );

      return {
        label: formatDateDisplay(new Date(`${date}T00:00:00`)),
        values: {
          critical: dayMissions.filter((mission) => mission.priority === "critical").length,
          high: dayMissions.filter((mission) => mission.priority === "high").length,
          medium: dayMissions.filter((mission) => mission.priority === "medium").length,
          low: dayMissions.filter((mission) => mission.priority === "low").length,
        },
      };
    });
  }, [dateBuckets, missions]);

  const cargoByDateGroups = useMemo(() => {
    return dateBuckets.map((date) => {
      const dayMissions = filteredMissions.filter(
        (mission) => toDayKey(mission.created_at) === date,
      );
      return {
        label: formatDateDisplay(new Date(`${date}T00:00:00`)),
        values: {
          standard: dayMissions.filter((mission) => !mission.cargo.requires_cooling).length,
          cooling: dayMissions.filter((mission) => mission.cargo.requires_cooling).length,
        },
      };
    });
  }, [dateBuckets, filteredMissions]);

  const selectedMissionGraphLabel = missionGraphLabels[missionGraph];
  const selectedMissionGraphColumns: ExportColumn[] = [
    { key: "date", label: "Date" },
    { key: "critical", label: "Critical" },
    { key: "high", label: "High" },
    { key: "medium", label: "Medium" },
    { key: "low", label: "Low" },
  ];
  const selectedMissionGraphRows: ExportRow[] =
    (missionGraph === "createdByDate"
      ? missionCreatedByDateGroups
      : missionCompletedByDateGroups
    ).map((group) => ({
      date: group.label,
      critical: group.values.critical,
      high: group.values.high,
      medium: group.values.medium,
      low: group.values.low,
    }));

  const cargoGraphRows: ExportRow[] = cargoByDateGroups.map((group) => ({
    date: group.label,
    standard: group.values.standard,
    cooling: group.values.cooling,
  }));

  const selectedDriverExportRows: ExportRow[] = selectedDriverRows.map((row) => ({
    driver: row.label,
    value:
      driverGraph === "score"
        ? `${row.value}/100`
        : driverGraph === "km"
          ? `${row.value} km`
          : row.value,
  }));

  const missionDetailRange = {
    start: new Date(`${missionDetailFromDate}T00:00:00`),
    end: endOfDay(new Date(`${missionDetailToDate}T00:00:00`)),
  };
  const missionDetailRangeLabel = `${formatDateDisplay(
    missionDetailRange.start,
  )} - ${formatDateDisplay(missionDetailRange.end)}`;

  const missionDetailRows = filteredMissions.filter((mission) => {
    const inReportRange = isWithinRange(
      mission.created_at,
      missionDetailRange.start,
      missionDetailRange.end,
    );
    const statusMatches =
      missionDetailStatus === "all" ||
      (missionDetailStatus === "open" &&
        (mission.status === "available" || mission.status === "assigned")) ||
      (missionDetailStatus === "active" && mission.status === "in_transit") ||
      mission.status === missionDetailStatus;
    const priorityMatches =
      missionDetailPriority === "all" ||
      mission.priority === missionDetailPriority;
    const cargoMatches =
      missionDetailCargo === "all" ||
      (missionDetailCargo === "cooling" && mission.cargo.requires_cooling) ||
      (missionDetailCargo === "standard" && !mission.cargo.requires_cooling);

    return inReportRange && statusMatches && priorityMatches && cargoMatches;
  });

  function exportOverviewGraphToExcel() {
    exportTableToExcel(
      `hamilog-mission-trend-${formatDateForFilename(range.start)}-to-${formatDateForFilename(range.end)}`,
      [
        { key: "period", label: "Period" },
        { key: "created", label: "Created" },
        { key: "delivered", label: "Delivered" },
      ],
      trendPoints.map((point) => ({
        period: point.label,
        created: point.created,
        delivered: point.delivered,
      })),
    );
  }

  function exportOverviewGraphToPdf() {
    exportTableToPdf(
      "Hamilog Mission Trend",
      rangeLabel,
      [
        { key: "period", label: "Period" },
        { key: "created", label: "Created" },
        { key: "delivered", label: "Delivered" },
      ],
      trendPoints.map((point) => ({
        period: point.label,
        created: point.created,
        delivered: point.delivered,
      })),
    );
  }

  function exportMissionGraphToExcel() {
    exportTableToExcel(
      `hamilog-${missionGraph}-${formatDateForFilename(range.start)}-to-${formatDateForFilename(range.end)}`,
      selectedMissionGraphColumns,
      selectedMissionGraphRows,
    );
  }

  function exportMissionGraphToPdf() {
    exportTableToPdf(
      `Hamilog ${selectedMissionGraphLabel}`,
      rangeLabel,
      selectedMissionGraphColumns,
      selectedMissionGraphRows,
    );
  }

  function exportDriverGraphToExcel() {
    exportTableToExcel(
      `hamilog-${driverGraph}-${formatDateForFilename(range.start)}-to-${formatDateForFilename(range.end)}`,
      [
        { key: "driver", label: "Driver" },
        { key: "value", label: selectedDriverMeasurement },
      ],
      selectedDriverExportRows,
    );
  }

  function exportDriverGraphToPdf() {
    exportTableToPdf(
      `Hamilog ${selectedDriverGraphLabel}`,
      rangeLabel,
      [
        { key: "driver", label: "Driver" },
        { key: "value", label: selectedDriverMeasurement },
      ],
      selectedDriverExportRows,
    );
  }

  function exportCargoGraphToExcel() {
    exportTableToExcel(
      `hamilog-cargo-${formatDateForFilename(range.start)}-to-${formatDateForFilename(range.end)}`,
      [
        { key: "date", label: "Date" },
        { key: "standard", label: "Standard cargo" },
        { key: "cooling", label: "Cooling cargo" },
      ],
      cargoGraphRows,
    );
  }

  function exportCargoGraphToPdf() {
    exportTableToPdf(
      "Hamilog Cargo Type By Date",
      rangeLabel,
      [
        { key: "date", label: "Date" },
        { key: "standard", label: "Standard cargo" },
        { key: "cooling", label: "Cooling cargo" },
      ],
      cargoGraphRows,
    );
  }

  function exportMissionDetailsToPdf() {
    exportTableToPdf(
      "Hamilog Mission Detail Report",
      `${missionDetailRangeLabel} | Status: ${labelize(missionDetailStatus)} | Priority: ${labelize(
        missionDetailPriority,
      )} | Cargo: ${labelize(missionDetailCargo)}`,
      [
        { key: "title", label: "Mission" },
        { key: "status", label: "Status" },
        { key: "priority", label: "Priority" },
        { key: "driver", label: "Driver ID" },
        { key: "pickup", label: "Pickup" },
        { key: "dropoff", label: "Dropoff" },
        { key: "cargo", label: "Cargo" },
        { key: "created", label: "Created" },
        { key: "updated", label: "Updated" },
        { key: "deliveredAt", label: "Delivered At" },
        { key: "idealTime", label: "Ideal Time" },
      ],
      missionDetailRows.map((mission) => {
        const deliveredAt = getMissionDeliveredAt(mission);

        return {
          title: mission.title,
          status: labelize(mission.status),
          priority: labelize(mission.priority),
          driver: mission.assigned_driver_id ?? "Unassigned",
          pickup: mission.pickup.address,
          dropoff: mission.dropoff.address,
          cargo: `${mission.cargo.weight_kg} kg, ${mission.cargo.volume_liters} L, ${
            mission.cargo.requires_cooling ? "Cooling" : "Standard"
          }`,
          created: formatDateTimeDisplay(new Date(mission.created_at)),
          updated: formatDateTimeDisplay(new Date(mission.updated_at)),
          deliveredAt: deliveredAt
            ? formatDateTimeDisplay(new Date(deliveredAt))
            : "Not delivered",
          idealTime: formatIdealDeliveryTime(mission.ideal_delivery_time),
        };
      }),
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-main">
        Loading reports...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4">
              <BackToMenuButton href="/dispatcher/menu" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              Dispatcher Analytics
            </p>
            <h1 className="mt-1 text-3xl font-black">Statistics & Reports</h1>
            <p className="mt-2 max-w-2xl text-muted">
              Review mission flow, driver availability, and cargo patterns for the selected time range.
            </p>
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-app bg-card p-2 shadow-xl">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {reportViews.map((view) => {
              const isActive = activeView === view.id;

              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setActiveView(view.id)}
                  className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                    isActive
                      ? "bg-blue-600 text-main"
                      : "text-muted hover:bg-card-soft hover:text-main"
                  }`}
                >
                  {view.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-5">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Completion Rate"
              value={`${stats.completionRate}%`}
              note={`${stats.delivered} delivered from ${filteredMissions.length} missions`}
            />
            <MetricCard
              title="Total Deliveries Made"
              value={`${stats.delivered}`}
              note="Delivered missions in selected range"
            />
            <MetricCard
              title="Total Drivers"
              value={`${drivers.length}`}
              note="Registered drivers"
            />
            <MetricCard
              title="Cargo Load"
              value={`${Math.round(stats.totalWeight)} kg`}
              note={`${Math.round(stats.totalVolume)} liters total volume`}
            />
          </section>

          {activeView === "overview" && (
            <OverviewReport
              stats={stats}
              trendPoints={trendPoints}
              filterProps={filterProps}
              onExportExcel={exportOverviewGraphToExcel}
              onExportPdf={exportOverviewGraphToPdf}
            />
          )}

          {activeView === "missions" && (
            <MissionsReport
              filteredMissions={filteredMissions}
              stats={stats}
              missionGraph={missionGraph}
              missionCreatedByDateGroups={missionCreatedByDateGroups}
              missionCompletedByDateGroups={missionCompletedByDateGroups}
              filterProps={filterProps}
              missionDetailFromDate={missionDetailFromDate}
              missionDetailToDate={missionDetailToDate}
              missionDetailStatus={missionDetailStatus}
              missionDetailPriority={missionDetailPriority}
              missionDetailCargo={missionDetailCargo}
              missionDetailRowsCount={missionDetailRows.length}
              missionDetailRangeLabel={missionDetailRangeLabel}
              onMissionGraphChange={setMissionGraph}
              onMissionDetailFromDateChange={setMissionDetailFromDate}
              onMissionDetailToDateChange={setMissionDetailToDate}
              onMissionDetailStatusChange={setMissionDetailStatus}
              onMissionDetailPriorityChange={setMissionDetailPriority}
              onMissionDetailCargoChange={setMissionDetailCargo}
              onExportGraphExcel={exportMissionGraphToExcel}
              onExportGraphPdf={exportMissionGraphToPdf}
              onExportMissionDetailsPdf={exportMissionDetailsToPdf}
            />
          )}

          {activeView === "drivers" && (
            <DriversReport
              carTypeRows={carTypeRows}
              driverGraph={driverGraph}
              selectedDriverRows={selectedDriverRows}
              selectedDriverGraphLabel={selectedDriverGraphLabel}
              filterProps={filterProps}
              onDriverGraphChange={setDriverGraph}
              onExportExcel={exportDriverGraphToExcel}
              onExportPdf={exportDriverGraphToPdf}
            />
          )}

          {activeView === "cargo" && (
            <CargoReport
              cargoTruckStats={cargoTruckStats}
              cargoRows={cargoRows}
              cargoGraph={cargoGraph}
              cargoByDateGroups={cargoByDateGroups}
              filterProps={filterProps}
              onCargoGraphChange={setCargoGraph}
              onExportExcel={exportCargoGraphToExcel}
              onExportPdf={exportCargoGraphToPdf}
            />
          )}
        </section>
      </div>
    </main>
  );
}
