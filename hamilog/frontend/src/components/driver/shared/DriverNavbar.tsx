"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggleButton from "@/components/shared/ThemeToggleButton";

const links = [
  { label: "Dashboard", href: "/driver" },
  { label: "Menu", href: "/driver/menu" },
];

export default function DriverNavbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-app bg-app/90 px-6 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/driver" className="text-xl font-black text-main">
          Hamilog Driver
        </Link>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center lg:gap-3">
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-4 py-2 text-center text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-white"
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
