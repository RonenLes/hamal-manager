import CountWindow from "../shared/CountWindow";
import ExportButtons from "../shared/ExportButtons";
import ReportFilters from "../shared/ReportFilters";
import TrendChart from "../shared/TrendChart";
import type { ReportFilterProps, ReportStats } from "../shared/types";

type TrendPoint = {
  label: string;
  created: number;
  delivered: number;
};

type OverviewReportProps = {
  stats: ReportStats;
  trendPoints: TrendPoint[];
  filterProps: ReportFilterProps;
  onExportExcel: () => void;
  onExportPdf: () => void;
};

export default function OverviewReport({
  stats,
  trendPoints,
  filterProps,
  onExportExcel,
  onExportPdf,
}: OverviewReportProps) {
  return (
    <>
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CountWindow
          title="Mission Status"
          rows={[
            {
              title: "Open Missions",
              value: stats.open,
              note: "Waiting to be delivered",
              href: "/dispatcher/missions?status=open",
              color: "orange",
            },
            {
              title: "Active Missions",
              value: stats.active,
              note: "Currently in transit",
              href: "/dispatcher/missions?status=active",
              color: "blue",
            },
          ]}
        />
        <CountWindow
          title="Driver Availability"
          rows={[
            {
              title: "Available Drivers",
              value: stats.availableDrivers,
              note: "Ready for assignment",
              href: "/dispatcher/drivers?status=available",
              color: "emerald",
            },
            {
              title: "Drivers In Mission",
              value: stats.driversInMission,
              note: "Currently delivering",
              href: "/dispatcher/drivers?status=on_mission",
              color: "blue",
            },
          ]}
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-app bg-card p-5 shadow-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-main">Mission Trend</h2>
                <p className="mt-1 text-sm text-muted">
                  Export the current overview graph.
                </p>
              </div>
              <ExportButtons onExcel={onExportExcel} onPdf={onExportPdf} />
            </div>
          </section>
          <TrendChart title="Mission Trend" points={trendPoints} />
        </div>
        <ReportFilters {...filterProps} />
      </section>
    </>
  );
}
