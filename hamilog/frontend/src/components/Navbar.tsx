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
    <nav className="border-b border-app bg-app/90 px-3 py-3 backdrop-blur sm:px-6 sm:py-4">
      <div className="mx-auto flex w-full max-w-none items-center gap-3">
        <Link href="/dispatcher" className="shrink-0 text-lg font-black text-main sm:text-xl">
          Hamilog
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 overflow-x-auto pb-1">
          {links.map((link) => {
            const isMessages = link.href.endsWith("/messages");
            const isActive =
              pathname === link.href ||
              (isMessages && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-xl px-2.5 py-2 text-center text-xs font-semibold transition sm:px-4 sm:text-sm ${
                  isActive
                    ? "bg-blue-600 text-main"
                    : "text-muted hover:bg-card-soft hover:text-main"
                }`}
              >
                {link.label}
                {isMessages && unreadMessages > 0 && (
                  <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white sm:ml-2 sm:h-5 sm:min-w-5 sm:px-1.5 sm:text-xs">
                    {unreadMessages}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="flex shrink-0 justify-center">
            <ThemeToggleButton />
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-2 text-center text-xs font-semibold text-red-300 transition hover:bg-red-500 hover:text-white sm:px-4 sm:text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

