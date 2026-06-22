type ExportButtonsProps = {
  onExcel: () => void;
  onPdf: () => void;
};

export default function ExportButtons({ onExcel, onPdf }: ExportButtonsProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={onExcel}
        className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/25"
      >
        Export Excel
      </button>
      <button
        type="button"
        onClick={onPdf}
        className="rounded-xl border border-blue-500/30 bg-blue-500/15 px-4 py-3 text-sm font-bold text-blue-300 transition hover:bg-blue-500/25"
      >
        Export PDF
      </button>
    </div>
  );
}
