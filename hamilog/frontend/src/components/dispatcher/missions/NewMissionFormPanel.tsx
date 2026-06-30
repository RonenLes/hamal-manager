import type { MissionPriority } from "@/lib/api-client";

export type NewMissionForm = {
  title: string;
  cargoDescription: string;
  fromCity: string;
  from: string;
  fromStreetNumber: string;
  toCity: string;
  to: string;
  toStreetNumber: string;
  urgency: MissionPriority;
  idealDeliveryDate: string;
  idealDeliveryTime: string;
  cooling: "yes" | "no";
  heavyLoad: "yes" | "no";
};

type NewMissionFormPanelProps = {
  form: NewMissionForm;
  posting: boolean;
  title?: string;
  description?: string;
  submitLabel?: string;
  submittingLabel?: string;
  cities: string[];
  pickupStreets: string[];
  dropoffStreets: string[];
  locationsLoading?: boolean;
  onUpdate: <K extends keyof NewMissionForm>(
    key: K,
    value: NewMissionForm[K]
  ) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

const timeOptions = Array.from({ length: 24 * 4 }, (_, index) => {
  const totalMinutes = index * 15;
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
});

// Renders the new mission form panel component.
export default function NewMissionFormPanel({
  form,
  posting,
  title = "Add New Mission",
  description = "Fill the delivery information and post it to the mission pool.",
  submitLabel = "Post Mission",
  submittingLabel = "Posting...",
  cities,
  pickupStreets,
  dropoffStreets,
  locationsLoading = false,
  onUpdate,
  onSubmit,
  onCancel,
}: NewMissionFormPanelProps) {
  return (
    <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5">
      <div className="mb-5">
        <h2 className="text-xl font-black text-main">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-muted">
            Mission title
          </label>
          <input
            value={form.title}
            onChange={(event) => onUpdate("title", event.target.value)}
            placeholder="Example: Medical supplies delivery"
            className="w-full rounded-xl border border-app bg-app px-3 py-2.5 sm:px-4 sm:py-3 text-main outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-muted">
            Urgency
          </label>
          <select
            value={form.urgency}
            onChange={(event) =>
              onUpdate("urgency", event.target.value as MissionPriority)
            }
            className="w-full rounded-xl border border-app bg-app px-3 py-2.5 sm:px-4 sm:py-3 text-main outline-none focus:border-emerald-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-muted">
            Cooling
          </label>
          <select
            value={form.cooling}
            onChange={(event) =>
              onUpdate("cooling", event.target.value as "yes" | "no")
            }
            className="w-full rounded-xl border border-app bg-app px-3 py-2.5 sm:px-4 sm:py-3 text-main outline-none focus:border-emerald-500"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-muted">
            Heavy load
          </label>
          <select
            value={form.heavyLoad}
            onChange={(event) =>
              onUpdate("heavyLoad", event.target.value as "yes" | "no")
            }
            className="w-full rounded-xl border border-app bg-app px-3 py-2.5 sm:px-4 sm:py-3 text-main outline-none focus:border-emerald-500"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-muted">
            Ideal delivery date
          </label>
          <input
            type="date"
            value={form.idealDeliveryDate}
            onChange={(event) =>
              onUpdate("idealDeliveryDate", event.target.value)
            }
            className="w-full rounded-xl border border-app bg-app px-3 py-2.5 sm:px-4 sm:py-3 text-main outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-muted">
            Ideal delivery time
          </label>
          <select
            value={form.idealDeliveryTime}
            onChange={(event) =>
              onUpdate("idealDeliveryTime", event.target.value)
            }
            className="w-full rounded-xl border border-app bg-app px-3 py-2.5 sm:px-4 sm:py-3 text-main outline-none focus:border-emerald-500"
          >
            <option value="">Select time</option>
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-[1fr_1.2fr_100px] gap-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-muted">
              Pickup city
            </label>
            <select
              value={form.fromCity}
              onChange={(event) => {
                onUpdate("fromCity", event.target.value);
                onUpdate("from", "");
              }}
              disabled={locationsLoading}
              className="w-full rounded-xl border border-app bg-app px-3 py-2.5 sm:px-4 sm:py-3 text-main outline-none focus:border-emerald-500 disabled:opacity-50"
            >
              <option value="">City</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-muted">
              Pickup street
            </label>
            {pickupStreets.length > 0 ? (
              <select
                value={form.from}
                onChange={(event) => onUpdate("from", event.target.value)}
                disabled={!form.fromCity}
                className="w-full rounded-xl border border-app bg-app px-3 py-2.5 sm:px-4 sm:py-3 text-main outline-none focus:border-emerald-500 disabled:opacity-50"
              >
                <option value="">Street</option>
                {pickupStreets.map((street) => (
                  <option key={street} value={street}>
                    {street}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={form.from}
                onChange={(event) => onUpdate("from", event.target.value)}
                placeholder="Pickup street"
                className="w-full rounded-xl border border-app bg-app px-3 py-2.5 sm:px-4 sm:py-3 text-main outline-none focus:border-emerald-500"
              />
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-muted">
              No.
            </label>
            <input
              value={form.fromStreetNumber}
              onChange={(event) =>
                onUpdate("fromStreetNumber", event.target.value)
              }
              placeholder="12"
              className="w-full rounded-xl border border-app bg-app px-3 py-2.5 sm:px-4 sm:py-3 text-main outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_1.2fr_100px] gap-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-muted">
              Dropoff city
            </label>
            <select
              value={form.toCity}
              onChange={(event) => {
                onUpdate("toCity", event.target.value);
                onUpdate("to", "");
              }}
              disabled={locationsLoading}
              className="w-full rounded-xl border border-app bg-app px-3 py-2.5 sm:px-4 sm:py-3 text-main outline-none focus:border-emerald-500 disabled:opacity-50"
            >
              <option value="">City</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-muted">
              Dropoff street
            </label>
            {dropoffStreets.length > 0 ? (
              <select
                value={form.to}
                onChange={(event) => onUpdate("to", event.target.value)}
                disabled={!form.toCity}
                className="w-full rounded-xl border border-app bg-app px-3 py-2.5 sm:px-4 sm:py-3 text-main outline-none focus:border-emerald-500 disabled:opacity-50"
              >
                <option value="">Street</option>
                {dropoffStreets.map((street) => (
                  <option key={street} value={street}>
                    {street}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={form.to}
                onChange={(event) => onUpdate("to", event.target.value)}
                placeholder="Dropoff street"
                className="w-full rounded-xl border border-app bg-app px-3 py-2.5 sm:px-4 sm:py-3 text-main outline-none focus:border-emerald-500"
              />
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-muted">
              No.
            </label>
            <input
              value={form.toStreetNumber}
              onChange={(event) =>
                onUpdate("toStreetNumber", event.target.value)
              }
              placeholder="34"
              className="w-full rounded-xl border border-app bg-app px-3 py-2.5 sm:px-4 sm:py-3 text-main outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-muted">
            Cargo description
          </label>
          <textarea
            value={form.cargoDescription}
            onChange={(event) =>
              onUpdate("cargoDescription", event.target.value)
            }
            placeholder="Describe what should be delivered..."
            rows={4}
            className="w-full resize-none rounded-xl border border-app bg-app px-3 py-2.5 sm:px-4 sm:py-3 text-main outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={posting}
            className="rounded-xl border border-app px-6 py-3 text-sm font-bold text-main transition hover:bg-card-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        <button
          type="button"
          onClick={onSubmit}
          disabled={posting}
          className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-main transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {posting ? submittingLabel : submitLabel}
        </button>
      </div>
    </div>
  );
}
