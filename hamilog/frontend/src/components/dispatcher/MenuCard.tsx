// src/components/dispatcher/MenuCard.tsx

import Link from "next/link";

type MenuCardProps = {
  title: string;
  description: string;
  icon: string;
  href: string;
  disabled?: boolean;
};

export default function MenuCard({
  title,
  description,
  icon,
  href,
  disabled = false,
}: MenuCardProps) {
  if (disabled) {
    return (
      <div className="aspect-square rounded-2xl border border-app bg-card p-6 opacity-50">
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="mb-4 text-5xl">{icon}</div>
          <h2 className="text-xl font-black text-main">{title}</h2>
          <p className="mt-2 text-sm text-muted">{description}</p>
          <span className="mt-4 rounded-full bg-card-soft px-3 py-1 text-xs text-muted">
            Coming soon
          </span>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="aspect-square rounded-2xl border border-app bg-card p-6 transition hover:-translate-y-1 hover:border-blue-500/50 hover:bg-card-soft hover:shadow-xl hover:shadow-blue-950/30"
    >
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-4 text-5xl">{icon}</div>

        <h2 className="text-xl font-black text-main">{title}</h2>

        <p className="mt-2 text-sm text-muted">{description}</p>
      </div>
    </Link>
  );
}