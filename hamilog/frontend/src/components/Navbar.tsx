// src/components/Navbar.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggleButton from "@/components/shared/ThemeToggleButton";
import { clearToken, getMessageConversations, getToken } from "@/lib/api-client";

const links = [
  { label: "Dashboard", href: "/dispatcher" },
  { label: "Messages", href: "/dispatcher/messages" },
  { label: "Menu", href: "/dispatcher/menu" },
];

// Renders the navbar component.
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!getToken()) return;

    // Fetches the unread data.
    async function fetchUnread() {
      try {
        const conversations = await getMessageConversations();
        setUnreadMessages(
          conversations.reduce(
            (total, conversation) => total + conversation.unread_count,
            0
          )
        );
      } catch {
        setUnreadMessages(0);
      }
    }

    const initialLoad = window.setTimeout(() => {
      void fetchUnread();
    }, 0);
    const interval = window.setInterval(fetchUnread, 10000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, []);

  // Handles the logout action.
  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <nav className="border-b border-app bg-app/90 px-4 py-4 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/dispatcher" className="text-xl font-black text-main">
          Hamilog
        </Link>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center lg:gap-3">
          {links.map((link) => {
            const isMessages = link.href.endsWith("/messages");
            const isActive =
              pathname === link.href ||
              (isMessages && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-2 text-center text-sm font-semibold transition sm:px-4 ${
                  isActive
                    ? "bg-blue-600 text-main"
                    : "text-muted hover:bg-card-soft hover:text-main"
                }`}
              >
                {link.label}
                {isMessages && unreadMessages > 0 && (
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-black text-white">
                    {unreadMessages}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="flex justify-center">
            <ThemeToggleButton />
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm font-semibold text-red-300 transition hover:bg-red-500 hover:text-white sm:px-4"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

