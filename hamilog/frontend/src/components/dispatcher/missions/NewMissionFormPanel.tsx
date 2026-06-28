import type { MissionPriority } from "@/lib/api-client";

export type NewMissionForm = {
  title: string;
  cargoDescription: string;
  from: string;
  to: string;
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
  onUpdate,
  onSubmit,
  onCancel,
}: NewMissionFormPanelProps) {
  return (
    <section className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-xl">
      <div className="mb-5">
        <h2 className="text-xl font-black text-main">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-muted">
            Mission title
          </label>
          <input
            value={form.title}
            onChange={(event) => onUpdate("title", event.target.value)}
            placeholder="Example: Medical supplies delivery"
            className="w-full rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-emerald-500"
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
            className="w-full rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-emerald-500"
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
            className="w-full rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-emerald-500"
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
            className="w-full rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-emerald-500"
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
            className="w-full rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-emerald-500"
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
            className="w-full rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-emerald-500"
          >
            <option value="">Select time</option>
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-muted">
            From
          </label>
          <input
            value={form.from}
            onChange={(event) => onUpdate("from", event.target.value)}
            placeholder="Pickup address"
            className="w-full rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-muted">
            To
          </label>
          <input
            value={form.to}
            onChange={(event) => onUpdate("to", event.target.value)}
            placeholder="Dropoff address"
            className="w-full rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-emerald-500"
          />
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
            className="w-full resize-none rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-3">
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
    </section>
  );
}
