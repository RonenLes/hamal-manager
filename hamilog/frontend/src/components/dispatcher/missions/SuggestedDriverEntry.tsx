import Link from "next/link";
import { useState } from "react";

import type { SuggestedDriver } from "@/lib/api-client";
import { CAR_SPECS } from "@/lib/car-specs";

import DetailTile from "../shared/DetailTile";

type SuggestedDriverEntryProps = {
  suggestion: SuggestedDriver;
  isExpanded: boolean;
  isSending: boolean;
  onToggle: () => void;
  onSend: (driverId: string, note: string) => void;
};

function getScoreClasses(score: number) {
  if (score >= 85) return "text-emerald-300";
  if (score >= 65) return "text-orange-300";
  return "text-red-300";
}

function getStatusClasses(status: string) {
  if (status === "available") return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  if (status === "offline") return "border-slate-500/30 bg-slate-500/10 text-muted";
  if (status === "blacklisted") return "border-red-500/30 bg-red-500/10 text-red-300";
  return "border-orange-500/30 bg-orange-500/10 text-orange-300";
}

export default function SuggestedDriverEntry({
  suggestion,
  isExpanded,
  isSending,
  onToggle,
  onSend,
}: SuggestedDriverEntryProps) {
  const [note, setNote] = useState("");
  const { driver } = suggestion;
  const matchScore = Math.round(suggestion.match_score * 100);
  const spec = CAR_SPECS[driver.car_type];
  const location = driver.current_location?.address || "No current location";

  return (
    <article
      className={`border-t border-app bg-card ${
        isExpanded
          ? "relative z-10 rounded-xl outline outline-2 outline-blue-500/70 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
          : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-card-soft"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-bold text-main">{driver.name}</h3>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusClasses(
                driver.status
              )}`}
            >
              {driver.status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-muted">
            {spec?.label || driver.car_type} - {location}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold uppercase text-soft">Match</p>
            <p className={`text-sm font-black ${getScoreClasses(matchScore)}`}>
              {matchScore}%
            </p>
          </div>
          <span className="text-xl text-muted">{isExpanded ? "^" : "v"}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-blue-500/40 bg-app/60 px-5 py-5">
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            <DetailTile label="Match Score">
              <p className={`text-3xl font-black ${getScoreClasses(matchScore)}`}>
                {matchScore}%
              </p>
            </DetailTile>

            <DetailTile label="Driver Score">
              <p className={`text-3xl font-black ${getScoreClasses(driver.score ?? 0)}`}>
                {driver.score ?? 0}%
              </p>
            </DetailTile>

            <DetailTile label="Availability">
              <p className="font-semibold text-main">
                {suggestion.availability_reason}
              </p>
            </DetailTile>

            <DetailTile label="Phone">
              <p className="font-semibold text-main">
                {driver.phone || "No phone number"}
              </p>
            </DetailTile>

            <DetailTile label="Email">
              <p className="font-semibold text-main">{driver.email || "No email"}</p>
            </DetailTile>

            <DetailTile label="Vehicle">
              <p className="font-semibold text-main">
                {spec?.icon || "Car"} {spec?.label || driver.car_type}
              </p>
              <p className="mt-1 text-sm text-muted">
                {spec?.max_weight ?? "?"} kg - {spec?.max_volume ?? "?"} L
                {spec?.cooling ? " - Cooling" : ""}
              </p>
            </DetailTile>

            <DetailTile label="Current Location">
              <p className="font-semibold text-main">{location}</p>
            </DetailTile>

            <DetailTile label="Available Dates" className="md:col-span-2">
              <p className="break-words text-sm font-semibold text-main">
                {(driver.availability_dates ?? []).join(", ") || "No marked dates"}
              </p>
            </DetailTile>
          </div>

          <div className="mt-5 border-t border-app pt-5">
            <label className="mb-2 block text-sm font-semibold text-muted">
              Personal note to driver
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="Add why this driver is a good fit or special delivery instructions..."
              className="w-full resize-none rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-orange-500"
            />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href={`/dispatcher/drivers/${driver.id}/history`}
                className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-5 py-2.5 text-center text-sm font-bold text-blue-200 transition hover:bg-blue-500/20"
              >
                Driver History
              </Link>
              <button
                type="button"
                onClick={() => onSend(driver.id, note)}
                disabled={isSending}
                className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? "Sending..." : "Send Suggestion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
