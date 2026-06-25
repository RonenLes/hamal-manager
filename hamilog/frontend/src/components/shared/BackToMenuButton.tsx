import Link from "next/link";

type BackToMenuButtonProps = {
  href: string;
  label?: string;
};

export default function BackToMenuButton({
  href,
  label = "← Back to Menu",
}: BackToMenuButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-xl border border-app px-4 py-2 text-sm font-semibold text-main transition hover:bg-card-soft"
    >
      {label}
    </Link>
  );
}