import type { DriverRequest } from "@/lib/api-client";
import { CAR_SPECS } from "@/lib/car-specs";
import { formatDateTime24 } from "@/lib/date-format";

import DetailTile from "../shared/DetailTile";

type NewDriverRequestEntryProps = {
  driverRequest: DriverRequest;
  isExpanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onDecline: () => void;
};

// Formats the date time for display.
function formatDateTime(dateValue?: string) {
  return formatDateTime24(dateValue);
}

// Returns the request status classes.
function getRequestStatusClasses(status: DriverRequest["status"]) {
  if (status === "pending") {
    return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  }

  if (status === "approved") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  return "border-red-500/30 bg-red-500/10 text-red-300";
}

// Returns the request status dot classes.
function getRequestStatusDotClasses(status: DriverRequest["status"]) {
  if (status === "pending") return "bg-orange-400";
  if (status === "approved") return "bg-emerald-400";
  return "bg-red-400";
}

// Renders the new driver request entry component.
export default function NewDriverRequestEntry({
  driverRequest,
  isExpanded,
  onToggle,
  onApprove,
  onDecline,
}: NewDriverRequestEntryProps) {
  const spec = CAR_SPECS[driverRequest.car_type];
  const phone = driverRequest.phone || "No phone number yet";
  const address = driverRequest.address || "No address yet";
  const city = driverRequest.city || "No city yet";
  const fullAddress =
    driverRequest.address && driverRequest.city
      ? `${driverRequest.address}, ${driverRequest.city}`
      : driverRequest.address || driverRequest.city || "No address yet";

  return (
    <article
      className={`bg-card ${
        isExpanded
          ? "border-y-2 border-blue-500/70 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]"
          : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[var(--bg-card-soft)]"
      >
        <div className="flex min-w-0 items-center gap-4">
          <span
            className={`h-3 w-3 shrink-0 rounded-full ${getRequestStatusDotClasses(
              driverRequest.status
            )}`}
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-bold text-main">
                {driverRequest.name}
              </h3>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getRequestStatusClasses(
                  driverRequest.status
                )}`}
              >
                {driverRequest.status}
              </span>
            </div>

            <p className="mt-1 truncate text-sm text-muted">
              {spec?.label || driverRequest.car_type} - requested{" "}
              {formatDateTime(driverRequest.created_at)}
            </p>
          </div>
        </div>

        <span className="text-xl text-muted">{isExpanded ? "^" : "v"}</span>
      </button>

      {isExpanded && (
        <div className="border-t-2 border-blue-500/70 bg-card-soft px-5 py-5">
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            <DetailTile label="Full Name">
              <p className="font-semibold text-main">{driverRequest.name}</p>
            </DetailTile>

            <DetailTile label="Phone Number">
              <p className="font-semibold text-main">{phone}</p>
            </DetailTile>

            <DetailTile label="Email">
              <p className="font-semibold text-main">
                {driverRequest.email || "No email provided"}
              </p>
            </DetailTile>

            <DetailTile label="Request Status">
              <p
                className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold capitalize ${getRequestStatusClasses(
                  driverRequest.status
                )}`}
              >
                {driverRequest.status}
              </p>
            </DetailTile>

            <DetailTile label="City">
              <p className="font-semibold text-main">{city}</p>
            </DetailTile>

            <DetailTile label="Address">
              <p className="font-semibold text-main">{address}</p>
            </DetailTile>

            <DetailTile label="Full Address" className="md:col-span-2">
              <p className="font-semibold text-main">{fullAddress}</p>
            </DetailTile>

            <DetailTile label="Request Date">
              <p className="font-semibold text-main">
                {formatDateTime(driverRequest.created_at)}
              </p>
            </DetailTile>

            <DetailTile label="Vehicle">
              <p className="font-semibold text-main">
                {spec?.icon || "Car"} {spec?.label || driverRequest.car_type}
              </p>

              <p className="mt-1 text-sm text-muted">
                {spec?.max_weight ?? "?"} kg - {spec?.max_volume ?? "?"} L
                {spec?.cooling ? " - Cooling" : ""}
              </p>
            </DetailTile>

            <DetailTile label="Request ID">
              <p className="font-mono text-sm text-muted">
                {driverRequest.id}
              </p>
            </DetailTile>
          </div>

          <div className="mt-5 flex justify-end gap-3 border-t border-app pt-5">
            <button
              type="button"
              onClick={onDecline}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-500"
            >
              Decline
            </button>

            <button
              type="button"
              onClick={onApprove}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
            >
              Approve
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
