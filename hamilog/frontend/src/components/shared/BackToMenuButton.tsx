"use client";

import { useRouter } from "next/navigation";

type BackToMenuButtonProps = {
  href: string;
  label?: string;
};

export default function BackToMenuButton({
  href,
  label = "Back",
}: BackToMenuButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(href);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center rounded-xl border border-app px-4 py-2 text-sm font-semibold text-main transition hover:bg-card-soft"
    >
      {label}
    </button>
  );
}
