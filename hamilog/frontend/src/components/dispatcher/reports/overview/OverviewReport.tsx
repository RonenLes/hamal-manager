import ExportButtons from "../shared/ExportButtons";
import ReportFilters from "../shared/ReportFilters";
import TrendChart from "../shared/TrendChart";
import type { ReportFilterProps } from "../shared/types";

type TrendPoint = {
  label: string;
  created: number;
  delivered: number;
};

type OverviewReportProps = {
  trendPoints: TrendPoint[];
  filterProps: ReportFilterProps;
  onExportExcel: () => void;
  onExportPdf: () => void;
};

// Renders the overview report component.
export default function OverviewReport({
  trendPoints,
  filterProps,
  onExportExcel,
  onExportPdf,
}: OverviewReportProps) {
  return (
    <>
      <section className="rounded-2xl border border-app bg-card p-4 shadow-xl sm:p-5">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-main">Mission Trend</h2>
            <p className="mt-1 text-sm text-muted">Export the current overview graph.</p>
          </div>
        </div>
        <ReportFilters {...filterProps} />
        <div className="mt-4">
          <TrendChart title="Mission Trend" points={trendPoints} />
        </div>
        <div className="mt-4 flex justify-end border-t border-app pt-4">
          <ExportButtons onExcel={onExportExcel} onPdf={onExportPdf} />
        </div>
      </section>
    </>
  );
}
