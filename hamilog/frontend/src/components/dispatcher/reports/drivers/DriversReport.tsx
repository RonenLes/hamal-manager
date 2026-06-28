import BarList from "../shared/BarList";
import ExportButtons from "../shared/ExportButtons";
import LargeBarChart from "../shared/LargeBarChart";
import ReportFilters from "../shared/ReportFilters";
import type { BarRow, DriverGraph, ReportFilterProps } from "../shared/types";

const driverGraphOptions: { id: DriverGraph; label: string }[] = [
  { id: "deliveries", label: "Deliveries by driver" },
  { id: "score", label: "Driver score" },
  { id: "km", label: "Total km by driver" },
];

type DriversReportProps = {
  carTypeRows: BarRow[];
  driverGraph: DriverGraph;
  selectedDriverRows: BarRow[];
  selectedDriverGraphLabel: string;
  filterProps: ReportFilterProps;
  onDriverGraphChange: (value: DriverGraph) => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
};

// Renders the drivers report component.
export default function DriversReport({
  carTypeRows,
  driverGraph,
  selectedDriverRows,
  selectedDriverGraphLabel,
  filterProps,
  onDriverGraphChange,
  onExportExcel,
  onExportPdf,
}: DriversReportProps) {
  return (
    <>
      <section className="grid grid-cols-1 gap-5">
        <BarList
          title="Vehicle Types"
          rows={carTypeRows}
          emptyText="No vehicle data available."
        />
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
                  value={driverGraph}
                  onChange={(event) => onDriverGraphChange(event.target.value as DriverGraph)}
                  className="mt-2 w-full rounded-xl border border-app bg-input px-3 py-3 text-sm text-main outline-none focus:border-blue-500"
                >
                  {driverGraphOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <ExportButtons onExcel={onExportExcel} onPdf={onExportPdf} />
            </div>
          </section>

          <LargeBarChart
            title={selectedDriverGraphLabel}
            description={
              driverGraph === "deliveries"
                ? "X axis is the driver name. Y axis is delivered missions completed in the selected period."
                : driverGraph === "score"
                  ? "X axis is the driver name. Y axis is a 0-100 operational score based on completion rate, delivered missions, cancelled missions, and current status."
                  : "X axis is the driver name. Y axis is total delivered route kilometers in the selected period."
            }
            rows={selectedDriverRows}
            yLabel={
              driverGraph === "deliveries"
                ? "Deliveries made"
                : driverGraph === "score"
                  ? "Driver score"
                  : "Kilometers"
            }
            maxValue={driverGraph === "score" ? 100 : undefined}
            valueSuffix={
              driverGraph === "score" ? "/100" : driverGraph === "km" ? " km" : ""
            }
          />
        </div>
        <ReportFilters {...filterProps} />
      </section>
    </>
  );
}
