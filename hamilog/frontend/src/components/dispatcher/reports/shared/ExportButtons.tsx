type ExportButtonsProps = {
  onPdf: () => void;
};

// Renders the export buttons component.
export default function ExportButtons({ onPdf }: ExportButtonsProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={onPdf}
        className="rounded-xl border border-blue-500/30 bg-blue-500/15 px-4 py-3 text-sm font-bold text-blue-700 dark:text-blue-300 transition hover:bg-blue-500/25"
      >
        Export PDF
      </button>
    </div>
  );
}
