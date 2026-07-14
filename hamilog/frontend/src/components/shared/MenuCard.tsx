import Link from "next/link";
import Icon, { isIconName } from "@/components/shared/Icon";

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
    <div className="flex h-full min-h-32 flex-col items-start justify-start text-left sm:min-h-40">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-card-soft text-blue-600 dark:text-blue-400 sm:mb-4 sm:h-12 sm:w-12">
        {isIconName(icon) ? (
          <Icon name={icon} className="h-6 w-6 sm:h-7 sm:w-7" />
        ) : (
          <span className="text-2xl sm:text-3xl">{icon}</span>
        )}
      </span>
      <h2 className="text-sm font-semibold leading-tight text-main sm:text-base">
        {title}
      </h2>
      <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted sm:mt-1.5 sm:text-sm">
        {description}
      </p>
      {disabled && (
        <span className="mt-3 rounded-full bg-card-soft px-3 py-1 text-xs text-muted">
          Coming soon
        </span>
      )}
    </div>
  );

  if (disabled) {
    return (
      <div className="min-h-36 rounded-xl border border-app bg-card p-4 opacity-50 sm:p-5">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="min-h-36 rounded-xl border border-app bg-card p-4 transition hover:border-blue-500/60 hover:bg-card-soft sm:p-5"
    >
      {content}
    </Link>
  );
}
