import type { Mission } from "@/lib/api-client";

import CountWindow from "../shared/CountWindow";
import ExportButtons from "../shared/ExportButtons";
import GroupedBarChart from "../shared/GroupedBarChart";
import MetricCard from "../shared/MetricCard";
import ReportFilters from "../shared/ReportFilters";
import {
  formatDuration,
} from "../shared/utils";
import type {
  GroupedBarGroup,
  MissionDetailCargo,
  MissionDetailPriority,
  MissionDetailStatus,
  MissionGraph,
  ReportFilterProps,
  ReportStats,
} from "../shared/types";

const missionGraphOptions: { id: MissionGraph; label: string }[] = [
  { id: "createdByDate", label: "Missions created by date" },
  { id: "completedByDate", label: "Missions completed by date" },
];

type MissionsReportProps = {
  filteredMissions: Mission[];
  stats: ReportStats;
  missionGraph: MissionGraph;
  missionCreatedByDateGroups: GroupedBarGroup[];
  missionCompletedByDateGroups: GroupedBarGroup[];
  filterProps: ReportFilterProps;
  missionDetailFromDate: string;
  missionDetailToDate: string;
  missionDetailStatus: MissionDetailStatus;
  missionDetailPriority: MissionDetailPriority;
  missionDetailCargo: MissionDetailCargo;
  missionDetailRowsCount: number;
  missionDetailRangeLabel: string;
  onMissionGraphChange: (value: MissionGraph) => void;
  onMissionDetailFromDateChange: (value: string) => void;
  onMissionDetailToDateChange: (value: string) => void;
  onMissionDetailStatusChange: (value: MissionDetailStatus) => void;
  onMissionDetailPriorityChange: (value: MissionDetailPriority) => void;
  onMissionDetailCargoChange: (value: MissionDetailCargo) => void;
  onExportGraphExcel: () => void;
  onExportGraphPdf: () => void;
  onExportMissionDetailsPdf: () => void;
};

export default function MissionsReport({
  filteredMissions,
  stats,
  missionGraph,
  missionCreatedByDateGroups,
  missionCompletedByDateGroups,
  filterProps,
  missionDetailFromDate,
  missionDetailToDate,
  missionDetailStatus,
  missionDetailPriority,
  missionDetailCargo,
  missionDetailRowsCount,
  missionDetailRangeLabel,
  onMissionGraphChange,
  onMissionDetailFromDateChange,
  onMissionDetailToDateChange,
  onMissionDetailStatusChange,
  onMissionDetailPriorityChange,
  onMissionDetailCargoChange,
  onExportGraphExcel,
  onExportGraphPdf,
  onExportMissionDetailsPdf,
}: MissionsReportProps) {
  return (
    <>
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <CountWindow
          title="Mission Priority"
          rows={[
            {
              title: "Critical",
              value: filteredMissions.filter((mission) => mission.priority === "critical").length,
              note: "Highest urgency",
              href: "/dispatcher/missions?priority=critical",
              color: "red",
            },
            {
              title: "High",
              value: filteredMissions.filter((mission) => mission.priority === "high").length,
              note: "High urgency",
              href: "/dispatcher/missions?priority=high",
              color: "orange",
            },
            {
              title: "Medium",
              value: filteredMissions.filter((mission) => mission.priority === "medium").length,
              note: "Normal urgency",
              href: "/dispatcher/missions?priority=medium",
              color: "blue",
            },
            {
              title: "Low",
              value: filteredMissions.filter((mission) => mission.priority === "low").length,
              note: "Low urgency",
              href: "/dispatcher/missions?priority=low",
              color: "slate",
            },
          ]}
        />
        <MetricCard
          title="Average Completion Time"
          value={formatDuration(stats.averageCompletionMs)}
          note="From mission creation to delivered update"
        />
      </section>

      <section className="rounded-2xl border border-app bg-card p-5 shadow-xl">
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-black text-main">Mission Detail PDF Report</h2>
            <p className="mt-1 text-sm text-muted">
              Choose filters for mission details and generate a printable PDF report.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <label className="block">
              <span className="text-sm font-semibold text-main">From: date</span>
              <input
                type="date"
                value={missionDetailFromDate}
                onChange={(event) => onMissionDetailFromDateChange(event.target.value)}
                className="mt-2 w-full rounded-xl border border-app bg-input px-3 py-3 text-sm text-main outline-none focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-main">To: date</span>
              <input
                type="date"
                value={missionDetailToDate}
                onChange={(event) => onMissionDetailToDateChange(event.target.value)}
                className="mt-2 w-full rounded-xl border border-app bg-input px-3 py-3 text-sm text-main outline-none focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-main">Status</span>
              <select
                value={missionDetailStatus}
                onChange={(event) =>
                  onMissionDetailStatusChange(event.target.value as MissionDetailStatus)
                }
                className="mt-2 w-full rounded-xl border border-app bg-input px-3 py-3 text-sm text-main outline-none focus:border-blue-500"
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="active">Active</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-main">Priority</span>
              <select
                value={missionDetailPriority}
                onChange={(event) =>
                  onMissionDetailPriorityChange(event.target.value as MissionDetailPriority)
                }
                className="mt-2 w-full rounded-xl border border-app bg-input px-3 py-3 text-sm text-main outline-none focus:border-blue-500"
              >
                <option value="all">All priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-main">Cargo</span>
              <select
                value={missionDetailCargo}
                onChange={(event) =>
                  onMissionDetailCargoChange(event.target.value as MissionDetailCargo)
                }
                className="mt-2 w-full rounded-xl border border-app bg-input px-3 py-3 text-sm text-main outline-none focus:border-blue-500"
              >
                <option value="all">All cargo</option>
                <option value="standard">Standard cargo</option>
                <option value="cooling">Cooling cargo</option>
              </select>
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              {missionDetailRowsCount} missions match the selected report filters from{" "}
              {missionDetailRangeLabel}.
            </p>
            <button
              type="button"
              onClick={onExportMissionDetailsPdf}
              className="rounded-xl border border-blue-500/30 bg-blue-500/15 px-4 py-3 text-sm font-bold text-blue-300 transition hover:bg-blue-500/25"
            >
              Generate Mission PDF
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-app bg-card p-5 shadow-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <label className="block w-full max-w-md">
                <span className="text-sm font-semibold text-main">
                  Graph shown in main window
                </span>
                <select
                  value={missionGraph}
                  onChange={(event) => onMissionGraphChange(event.target.value as MissionGraph)}
                  className="mt-2 w-full rounded-xl border border-app bg-input px-3 py-3 text-sm text-main outline-none focus:border-blue-500"
                >
                  {missionGraphOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <ExportButtons onExcel={onExportGraphExcel} onPdf={onExportGraphPdf} />
            </div>
          </section>

          {missionGraph === "createdByDate" ? (
            <GroupedBarChart
              title="Missions Created By Date"
              description="Each date shows created missions split into critical, high, medium, and low priority."
              groups={missionCreatedByDateGroups}
              series={[
                { key: "critical", label: "Critical", color: "bg-red-500" },
                { key: "high", label: "High", color: "bg-orange-500" },
                { key: "medium", label: "Medium", color: "bg-blue-500" },
                { key: "low", label: "Low", color: "bg-slate-500" },
              ]}
            />
          ) : (
            <GroupedBarChart
              title="Missions Completed By Date"
              description="Each date shows completed missions split into critical, high, medium, and low priority."
              groups={missionCompletedByDateGroups}
              series={[
                { key: "critical", label: "Critical", color: "bg-red-500" },
                { key: "high", label: "High", color: "bg-orange-500" },
                { key: "medium", label: "Medium", color: "bg-blue-500" },
                { key: "low", label: "Low", color: "bg-slate-500" },
              ]}
            />
          )}
        </div>
        <ReportFilters {...filterProps} />
      </section>
    </>
  );
}
