// src/app/dispatcher/menu/page.tsx

import MenuCard from "@/components/shared/MenuCard";

const menuItems = [
  {
    title: "Dashboard",
    description: "Main dispatcher command center.",
    icon: "📊",
    href: "/dispatcher",
  },
  {
    title: "Schedule",
    description: "View today's active missions.",
    icon: "🗓️",
    href: "/dispatcher/schedule",
  },
  {
    title: "Pending Requests",
    description: "Review missions waiting for approval.",
    icon: "📥",
    href: "/dispatcher/pending-requests",
  },
  {
    title: "Missions",
    description: "Create missions and manage the mission pool.",
    icon: "🚚",
    href: "/dispatcher/missions",
  },
  {
    title: "Drivers",
    description: "View driver status, availability and new request for new drivers.",
    icon: "👥",
    href: "/dispatcher/drivers",
  },
  {
    title: "Reports",
    description: "View mission, driver, and cargo statistics.",
    icon: "📈",
    href: "/dispatcher/reports",
  },
  {
    title: "Alerts",
    description: "Important warnings and system alerts.",
    icon: "⚠️",
    href: "/dispatcher/alerts",
  },
  {
    title: "Live Map",
    description: "Latest mission and driver updates.",
    icon: "🗺️",
    href: "/dispatcher/live-map",
  },
  {
    title: "Messages",
    description: "Message drivers and dispatchers.",
    icon: "✉️",
    href: "/dispatcher/messages",
  },
  {
    title: "AI Cargo Analysis",
    description: "Analyze cargo size, weight, and cooling.",
    icon: "🤖",
    href: "/dispatcher/cargo-analysis",
  },
  {
    title: "Settings",
    description: "Accessibility, theme, and font size.",
    icon: "⚙️",
    href: "/dispatcher/settings",
  },
  {
    title: "Help",
    description: "Learn what each dispatcher page offers.",
    icon: "❓",
    href: "/dispatcher/help",
  },
];

export default function DispatcherMenuPage() {
  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-black">Dispatcher Menu</h1>
          <p className="mt-2 text-muted">Choose a dispatcher page or tool.</p>
        </header>

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
