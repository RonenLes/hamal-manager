import BarList from "../shared/BarList";
import CountWindow from "../shared/CountWindow";
import ExportButtons from "../shared/ExportButtons";
import GroupedBarChart from "../shared/GroupedBarChart";
import ReportFilters from "../shared/ReportFilters";
import type {
  BarRow,
  CargoGraph,
  GroupedBarGroup,
  ReportFilterProps,
} from "../shared/types";

const cargoGraphOptions: { id: CargoGraph; label: string }[] = [
  { id: "cargoByDate", label: "Cargo type by date" },
];

type CargoTruckStats = {
  coolingAvailable: number;
  coolingActive: number;
  standardAvailable: number;
  standardActive: number;
};

type CargoReportProps = {
  cargoTruckStats: CargoTruckStats;
  cargoRows: BarRow[];
  cargoGraph: CargoGraph;
  cargoByDateGroups: GroupedBarGroup[];
  filterProps: ReportFilterProps;
  onCargoGraphChange: (value: CargoGraph) => void;
  onExportPdf: () => void;
};

// Renders the cargo report component.
export default function CargoReport({
  cargoTruckStats,
  cargoRows,
  cargoGraph,
  cargoByDateGroups,
  filterProps,
  onCargoGraphChange,
  onExportPdf,
}: CargoReportProps) {
  return (
    <>
      <CountWindow
        title="Truck Availability By Cargo Type"
        rows={[
          {
            title: "Cooling Available",
            value: cargoTruckStats.coolingAvailable,
            note: "Refrigerated vans ready",
            color: "emerald",
          },
          {
            title: "Cooling Active",
            value: cargoTruckStats.coolingActive,
            note: "Refrigerated vans in mission",
            color: "blue",
          },
          {
            title: "Standard Available",
            value: cargoTruckStats.standardAvailable,
            note: "Non-cooling trucks ready",
            color: "emerald",
          },
          {
            title: "Standard Active",
            value: cargoTruckStats.standardActive,
            note: "Non-cooling trucks in mission",
            color: "blue",
          },
        ]}
      />

      <BarList
        title="Cooling Demand"
        rows={cargoRows}
        emptyText="No cargo data for this range."
      />

      <section className="rounded-xl border border-app bg-card p-4 shadow-sm sm:p-5">
        <div className="space-y-4">
          <div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <label className="block w-full max-w-md">
                <span className="text-sm font-semibold text-main">
                  Graph shown in main window
                </span>
                <select
                  value={cargoGraph}
                  onChange={(event) => onCargoGraphChange(event.target.value as CargoGraph)}
                  className="mt-2 w-full rounded-xl border border-app bg-input px-3 py-3 text-sm text-main outline-none focus:border-blue-500"
                >
                  {cargoGraphOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <ReportFilters {...filterProps} />

          <GroupedBarChart
            title="Cargo Type By Date"
            description="Each date shows standard cargo and cooling cargo mission counts."
            groups={cargoByDateGroups}
            series={[
              { key: "standard", label: "Standard cargo", color: "bg-blue-500" },
              { key: "cooling", label: "Cooling cargo", color: "bg-cyan-500" },
            ]}
          />
          <div className="flex justify-end border-t border-app pt-4">
            <ExportButtons onPdf={onExportPdf} />
          </div>
        </div>
      </section>
    </>
  );
}
