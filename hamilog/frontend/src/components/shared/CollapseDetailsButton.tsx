type CollapseDetailsButtonProps = {
  onCollapse: () => void;
  label?: string;
};

export default function CollapseDetailsButton({
  onCollapse,
  label = "Close details",
}: CollapseDetailsButtonProps) {
  return (
    <div className="mb-3 flex justify-end">
      <button
        type="button"
        onClick={onCollapse}
        className="inline-flex items-center gap-2 rounded-lg border border-app bg-card-soft px-3 py-2 text-xs font-bold text-muted transition hover:text-main"
        aria-label={label}
      >
        <span aria-hidden="true" className="text-base leading-none">×</span>
        {label}
      </button>
    </div>
  );
}
