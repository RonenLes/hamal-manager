// src/components/Navbar.tsx

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { clearToken } from "@/lib/api-client";

const links = [
  { label: "Dashboard", href: "/dispatcher" },
  { label: "Reports", href: "/dispatcher/reports" },
  { label: "Menu", href: "/dispatcher/menu" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

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

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500 hover:text-white"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
