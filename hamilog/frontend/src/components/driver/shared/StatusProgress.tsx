type StatusProgressProps = {
  status: string;
};

const steps = ["assigned", "in_transit", "delivered"];

export default function StatusProgress({ status }: StatusProgressProps) {
  const currentIndex = steps.indexOf(status);

  return (
    <div className="grid grid-cols-3 gap-2">
      {steps.map((step, index) => {
        const isCompleted = currentIndex >= index;
        const isCurrent = currentIndex === index;

        return (
          <div
            key={step}
            className={`rounded-xl border px-3 py-2 text-center text-xs font-bold capitalize ${
              isCompleted
                ? "border-blue-500/30 bg-blue-500/10 text-blue-300"
                : "border-app bg-card-soft text-muted"
            } ${isCurrent ? "ring-1 ring-blue-400/40" : ""}`}
          >
            {step.replace("_", " ")}
          </div>
        );
      })}
    </div>
  );
}
