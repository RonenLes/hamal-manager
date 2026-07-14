"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggleButton from "@/components/shared/ThemeToggleButton";
import { clearToken, getMessageConversations, getToken } from "@/lib/api-client";

type SideDrawerNavbarProps = {
  homeHref: string;
};

export default function SideDrawerNavbar({ homeHref }: SideDrawerNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const links = [
    { label: "Dashboard", href: homeHref },
    { label: "Messages", href: `${homeHref}/messages` },
  ];
  const menuHref = `${homeHref}/menu`;
  const menuPages = homeHref === "/driver"
    ? [
        { label: "My Missions", href: `${homeHref}/my-missions` },
        { label: "History", href: `${homeHref}/history` },
        { label: "Open Tasks", href: `${homeHref}/open-tasks` },
        { label: "Dispatcher Requests", href: `${homeHref}/requests` },
        { label: "Availability", href: `${homeHref}/availability` },
        { label: "Profile", href: `${homeHref}/profile` },
        { label: "Settings", href: `${homeHref}/settings` },
        { label: "Help", href: `${homeHref}/help` },
      ]
    : [
        { label: "Schedule", href: `${homeHref}/schedule` },
        { label: "Pending Requests", href: `${homeHref}/pending-requests` },
        { label: "Missions", href: `${homeHref}/missions` },
        { label: "Drivers", href: `${homeHref}/drivers` },
        { label: "Reports", href: `${homeHref}/reports` },
        { label: "Alerts", href: `${homeHref}/alerts` },
        { label: "Live Map", href: `${homeHref}/live-map` },
        { label: "AI Cargo Analysis", href: `${homeHref}/cargo-analysis` },
        { label: "Settings", href: `${homeHref}/settings` },
        { label: "Help", href: `${homeHref}/help` },
      ];

  useEffect(() => {
    if (!getToken()) return;

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

    const initialLoad = window.setTimeout(() => void fetchUnread(), 0);
    const interval = window.setInterval(fetchUnread, 10000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    function updateNavbarVisibility() {
      const currentScrollY = window.scrollY;
      const isScrollable = document.documentElement.scrollHeight > window.innerHeight + 1;

      if (!isScrollable || currentScrollY <= 0 || isOpen) {
        setIsNavbarVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setIsNavbarVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setIsNavbarVisible(true);
      }

      lastScrollY.current = currentScrollY;
    }

    updateNavbarVisibility();
    window.addEventListener("scroll", updateNavbarVisibility, { passive: true });
    window.addEventListener("resize", updateNavbarVisibility);

    return () => {
      window.removeEventListener("scroll", updateNavbarVisibility);
      window.removeEventListener("resize", updateNavbarVisibility);
    };
  }, [isOpen]);

  function handleLogout() {
    setIsOpen(false);
    clearToken();
    router.replace("/login");
  }

  return (
    <>
      <nav
        className={`sticky top-0 z-30 flex items-center border-b border-app bg-app/90 px-3 py-3 backdrop-blur transition-transform duration-300 sm:px-6 ${
          isNavbarVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <button
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={isOpen}
          aria-controls="main-navigation-drawer"
          onClick={() => setIsOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-main transition hover:bg-card-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-none stroke-current" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link
          href={homeHref}
          className="absolute left-1/2 -translate-x-1/2 text-xl font-black text-main sm:text-2xl"
        >
          Hamalog
        </Link>
      </nav>

      <div
        aria-hidden={!isOpen}
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-40 bg-black/55 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="main-navigation-drawer"
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-app bg-app p-4 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href={homeHref} onClick={() => setIsOpen(false)} className="text-xl font-black text-main">
            Hamalog
          </Link>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-card-soft hover:text-main"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current" strokeWidth="2" strokeLinecap="round">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          {links.map((link) => {
            const isMessages = link.href.endsWith("/messages");
            const isActive =
              pathname === link.href ||
              (link.href !== homeHref && pathname.startsWith(`${link.href}/`));

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-muted hover:bg-card-soft hover:text-main"
                }`}
              >
                <span>{link.label}</span>
                {isMessages && unreadMessages > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-black text-white">
                    {unreadMessages}
                  </span>
                )}
              </Link>
            );
          })}

          <div>
            <div className={`flex overflow-hidden rounded-xl ${
              pathname === menuHref ? "bg-blue-600 text-white" : "text-muted"
            }`}>
              <Link
                href={menuHref}
                onClick={() => setIsOpen(false)}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
                  pathname === menuHref ? "" : "hover:bg-card-soft hover:text-main"
                }`}
              >
                Menu
              </Link>
              <button
                type="button"
                aria-label={isMenuExpanded ? "Collapse menu pages" : "Expand menu pages"}
                aria-expanded={isMenuExpanded}
                onClick={() => setIsMenuExpanded((expanded) => !expanded)}
                className={`flex w-12 items-center justify-center transition ${
                  pathname === menuHref ? "hover:bg-blue-700" : "hover:bg-card-soft hover:text-main"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className={`h-5 w-5 fill-none stroke-current transition-transform ${
                    isMenuExpanded ? "rotate-180" : ""
                  }`}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>

            {isMenuExpanded && (
              <div className="mt-1 space-y-1 border-l-2 border-app pl-3">
                {menuPages.map((page) => {
                  const isActive = pathname === page.href || pathname.startsWith(`${page.href}/`);

                  return (
                    <Link
                      key={page.href}
                      href={page.href}
                      onClick={() => setIsOpen(false)}
                      className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-muted hover:bg-card-soft hover:text-main"
                      }`}
                    >
                      {page.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 border-t border-app pt-4">
          <div className="flex items-center justify-between gap-3 px-1 text-sm font-semibold text-muted">
            <span>Theme</span>
            <ThemeToggleButton />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-left text-sm font-semibold text-red-300 transition hover:bg-red-500 hover:text-white"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
