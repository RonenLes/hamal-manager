// src/app/dispatcher/menu/page.tsx

import MenuCard from "@/components/shared/MenuCard";

const menuItems = [
  {
    title: "Dashboard",
    description: "Main dispatcher command center.",
    icon: "dashboard",
    href: "/dispatcher",
  },
  {
    title: "Schedule",
    description: "View today's active missions.",
    icon: "schedule",
    href: "/dispatcher/schedule",
  },
  {
    title: "Pending Requests",
    description: "Review missions waiting for approval.",
    icon: "inbox",
    href: "/dispatcher/pending-requests",
  },
  {
    title: "Missions",
    description: "Create missions and manage the mission pool.",
    icon: "truck",
    href: "/dispatcher/missions",
  },
  {
    title: "Drivers",
    description: "View driver status, availability and new request for new drivers.",
    icon: "users",
    href: "/dispatcher/drivers",
  },
  {
    title: "Reports",
    description: "View mission, driver, and cargo statistics.",
    icon: "chart",
    href: "/dispatcher/reports",
  },
  {
    title: "Alerts",
    description: "Important warnings and system alerts.",
    icon: "alert",
    href: "/dispatcher/alerts",
  },
  {
    title: "Live Map",
    description: "Latest mission and driver updates.",
    icon: "map",
    href: "/dispatcher/live-map",
  },
  {
    title: "Messages",
    description: "Message drivers and dispatchers.",
    icon: "mail",
    href: "/dispatcher/messages",
  },
  {
    title: "AI Cargo Analysis",
    description: "Analyze cargo size, weight, and cooling.",
    icon: "cargo",
    href: "/dispatcher/cargo-analysis",
  },
  {
    title: "Settings",
    description: "Accessibility, theme, and font size.",
    icon: "settings",
    href: "/dispatcher/settings",
  },
  {
    title: "Help",
    description: "Learn what each dispatcher page offers.",
    icon: "help",
    href: "/dispatcher/help",
  },
];

// Renders the dispatcher menu page component.
export default function DispatcherMenuPage() {
  return (
    <main className="min-h-screen bg-app px-3 py-4 text-main sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 sm:mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dispatcher Menu</h1>
          <p className="mt-2 text-muted">Choose a dispatcher page or tool.</p>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {menuItems.map((item) => (
            <MenuCard
              key={item.href}
              title={item.title}
              description={item.description}
              icon={item.icon}
              href={item.href}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
