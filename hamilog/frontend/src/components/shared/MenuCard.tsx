import Link from "next/link";

type MenuCardProps = {
  title: string;
  description: string;
  icon: string;
  href: string;
  disabled?: boolean;
};

// Renders the menu card component.
export default function MenuCard({
  title,
  description,
  icon,
  href,
  disabled = false,
}: MenuCardProps) {
  const content = (
    <div className="flex h-full min-h-32 flex-col items-center justify-center text-center sm:min-h-44">
      <div className="mb-2 text-3xl sm:mb-4 sm:text-5xl">{icon}</div>
      <h2 className="text-sm font-black leading-tight text-main sm:text-xl">{title}</h2>
      <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted sm:mt-2 sm:text-sm">{description}</p>
      {disabled && (
        <span className="mt-4 rounded-full bg-card-soft px-3 py-1 text-xs text-muted">
          Coming soon
        </span>
      )}
    </div>
  );

  if (disabled) {
    return (
      <div className="min-h-36 rounded-2xl border border-app bg-card p-3 opacity-50 sm:aspect-square sm:p-6">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="min-h-36 rounded-2xl border border-app bg-card p-3 transition hover:-translate-y-1 hover:border-blue-500/50 hover:bg-card-soft hover:shadow-xl hover:shadow-blue-950/30 sm:aspect-square sm:p-6"
    >
      {content}
    </Link>
  );
}
