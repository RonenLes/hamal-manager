import type { ReactNode } from "react";

type DetailTileProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export default function DetailTile({
  label,
  children,
  className = "",
}: DetailTileProps) {
  return (
    <div className={`rounded-xl border border-app bg-card p-4 ${className}`}>
      <p className="text-xs uppercase tracking-wider text-soft">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
