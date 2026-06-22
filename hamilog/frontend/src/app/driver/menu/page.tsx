import MenuCard from "@/components/shared/MenuCard";

const menuItems = [
  {
    title: "Dashboard",
    description: "Your driver command center.",
    icon: "📊",
    href: "/driver",
  },
  {
    title: "My Missions",
    description: "Track assigned and completed deliveries.",
    icon: "🚚",
    href: "/driver/my-missions",
  },
  {
    title: "History",
    description: "Review every mission you finished.",
    icon: "🕘",
    href: "/driver/history",
  },
  {
    title: "Open Tasks",
    description: "Review and accept available missions.",
    icon: "📦",
    href: "/driver/open-tasks",
  },
  {
    title: "Profile",
    description: "Driver account and vehicle information.",
    icon: "👤",
    href: "/driver/profile",
  },
  {
    title: "Settings",
    description: "Accessibility, theme, and font size.",
    icon: "⚙️",
    href: "/driver/settings",
  },
];

export default function DriverMenuPage() {
  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-black">Driver Menu</h1>
          <p className="mt-2 text-muted">Choose a driver page or tool.</p>
        </header>

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
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
