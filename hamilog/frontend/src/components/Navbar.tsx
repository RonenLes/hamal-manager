// src/components/Navbar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggleButton from "@/components/shared/ThemeToggleButton";

const links = [
  { label: "Dashboard", href: "/dispatcher" },
  { label: "Reports", href: "/dispatcher/reports" },
  { label: "Menu", href: "/dispatcher/menu" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-app bg-app/90 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/dispatcher" className="text-xl font-black text-main">
          Hamilog
        </Link>

        <div className="flex items-center gap-3">
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-main"
                    : "text-muted hover:bg-card-soft hover:text-main"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
            <ThemeToggleButton />
        </div>
      </div>
    </nav>
  );
}
