import type { ReactNode } from "react";

type DetailTileProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

// Renders the detail tile component.
export default function DetailTile({
  label,
  children,
  className = "",
}: DetailTileProps) {
  return (
    <div className={`min-w-0 rounded-xl border border-app bg-card p-3 sm:p-4 ${className}`}>
      <p className="text-[11px] font-bold uppercase text-soft sm:text-xs">{label}</p>
      <div className="mt-1.5 min-w-0 break-words text-sm sm:mt-2">{children}</div>
    </div>
  );
}
