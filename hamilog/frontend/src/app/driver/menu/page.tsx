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
    title: "Availability",
    description: "Mark the dates you are available.",
    icon: "📅",
    href: "/driver/availability",
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
  {
    title: "Help",
    description: "Driver guide and support tickets.",
    icon: "?",
    href: "/driver/help",
  },
];

// Renders the driver menu page component.
export default function DriverMenuPage() {
  return (
    <main className="min-h-screen bg-app px-3 py-4 text-main sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 sm:mb-8">

          <h1 className="text-2xl font-black sm:text-3xl">Driver Menu</h1>
          <p className="mt-2 text-muted">Choose a driver page or tool.</p>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-5">
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
