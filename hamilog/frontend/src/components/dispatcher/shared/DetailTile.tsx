import type { ReactNode } from "react";

type DetailTileProps = {
  label: string;
  children: ReactNode;
  className?: string;
  density?: "regular" | "compact";
};

// Renders the detail tile component.
export default function DetailTile({
  label,
  children,
  className = "",
  density = "regular",
}: DetailTileProps) {
  const paddingClasses =
    density === "compact" ? "p-2.5 sm:p-3" : "p-3 sm:p-4";
  const labelClasses =
    density === "compact"
      ? "text-[10px] font-bold uppercase text-soft sm:text-[11px]"
      : "text-[11px] font-bold uppercase text-soft sm:text-xs";
  const contentClasses =
    density === "compact"
      ? "mt-1 min-w-0 break-words text-xs sm:text-sm"
      : "mt-1.5 min-w-0 break-words text-sm sm:mt-2";

  return (
    <div className={`min-w-0 rounded-xl border border-app bg-card ${paddingClasses} ${className}`}>
      <p className={labelClasses}>{label}</p>
      <div className={contentClasses}>{children}</div>
    </div>
  );
}
