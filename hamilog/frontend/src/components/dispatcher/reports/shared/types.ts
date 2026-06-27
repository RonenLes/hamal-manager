export type ReportView = "overview" | "missions" | "drivers" | "cargo";
export type DatePreset = "last30" | "thisMonth" | "lastMonth";
export type DriverGraph = "deliveries" | "score";
export type MissionGraph = "createdByDate" | "completedByDate";
export type CargoGraph = "cargoByDate";
export type MissionDetailStatus =
  | "all"
  | "open"
  | "active"
  | "delivered"
  | "cancelled";
export type MissionDetailPriority = "all" | "critical" | "high" | "medium" | "low";
export type MissionDetailCargo = "all" | "cooling" | "standard";

export type ReportStats = {
  delivered: number;
  active: number;
  assigned: number;
  unassigned: number;
  open: number;
  cooling: number;
  totalWeight: number;
  totalVolume: number;
  activeDrivers: number;
  availableDrivers: number;
  driversInMission: number;
  averageCompletionMs: number;
  completionRate: number;
};

export type DateRange = {
  start: Date;
  end: Date;
};

export type ReportFilterProps = {
  datePreset: DatePreset;
  manualDates: boolean;
  fromDate: string;
  toDate: string;
  includeCancelled: boolean;
  rangeLabel: string;
  onDatePresetChange: (value: DatePreset) => void;
  onManualDatesChange: (value: boolean) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onIncludeCancelledChange: (value: boolean) => void;
};

export type BarRow = {
  label: string;
  value: number;
  color?: string;
};

export type GroupedBarGroup = {
  label: string;
  values: Record<string, number>;
};

export type GroupedBarSeries = {
  key: string;
  label: string;
  color: string;
};

export type CountRow = {
  title: string;
  value: number;
  note: string;
  href?: string;
  color?: "blue" | "emerald" | "orange" | "red" | "slate";
};

export type ExportColumn = {
  key: string;
  label: string;
};

export type ExportRow = Record<string, string | number>;
