import Link from "next/link";

import HelpPageCard from "@/components/dispatcher/help/HelpPageCard";

const helpPages = [
  {
    title: "Dashboard",
    href: "/dispatcher",
    description: "The main command center for live dispatcher work.",
    features: [
      "Shows delivery progress and active driver counts.",
      "Highlights today's schedule, pending requests, unassigned missions, alerts, driver status, and recent activity.",
      "Useful as the first screen during ongoing operations.",
    ],
  },
  {
    title: "Schedule",
    href: "/dispatcher/schedule",
    description: "A date-based view of deliveries.",
    features: [
      "Select a date and review missions for that day.",
      "See mission state, urgency, assigned driver, pickup, dropoff, cargo, and timing details.",
      "Expand each delivery entry for the full information.",
    ],
  },
  {
    title: "Pending Requests",
    href: "/dispatcher/pending-requests",
    description: "Driver requests to take delivery-pool missions.",
    features: [
      "Review pending, accepted, and declined delivery requests.",
      "Compare driver score, mission urgency, pickup, dropoff, and cargo details.",
      "Accept or decline a pending delivery request.",
    ],
  },
  {
    title: "Missions",
    href: "/dispatcher/missions",
    description: "Mission creation and mission-pool management.",
    features: [
      "Create new delivery missions with cargo, route, urgency, cooling, and heavy-load information.",
      "Filter missions by assignment state, cooling requirement, urgency, and delivery date order.",
      "Expand each mission to inspect full route, cargo, status, and assigned driver details.",
    ],
  },
  {
    title: "Drivers",
    href: "/dispatcher/drivers",
    description: "Driver availability and performance overview.",
    features: [
      "Review all drivers, their status, vehicle type, score, and completed deliveries.",
      "Open a driver entry to see contact information, vehicle capacity, active delivery, and ID.",
      "Open driver history or pending new driver requests from this area.",
    ],
  },
  {
    title: "New Driver Requests",
    href: "/dispatcher/drivers/new-drivers",
    description: "Volunteer driver onboarding review.",
    features: [
      "View pending volunteer driver requests.",
      "Inspect contact details, address, vehicle type, and request date.",
      "Approve or decline pending requests.",
    ],
  },
  {
    title: "Alerts",
    href: "/dispatcher/alerts",
    description: "Operational warnings and urgent situations.",
    features: [
      "Review critical, warning, info, and OK alerts.",
      "Inspect alerts related to unassigned missions, cooling needs, unavailable drivers, and compatibility issues.",
      "Dismiss alerts once they have been handled.",
    ],
  },
  {
    title: "Live Map",
    href: "/dispatcher/live-map",
    description: "Visual map-style overview of mission locations.",
    features: [
      "See missions plotted as points by delivery state.",
      "Click a point to inspect mission, driver, pickup, dropoff, cargo, and published time.",
      "Use the color legend to understand active, assigned, unassigned, and delivered missions.",
    ],
  },
  {
    title: "Settings",
    href: "/dispatcher/settings",
    description: "Dispatcher accessibility preferences.",
    features: [
      "Switch between light and dark theme modes.",
      "Choose small, medium, or large font size.",
      "Save display preferences in the browser for future sessions.",
    ],
  },
];

export default function DispatcherHelpPage() {
  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <Link
            href="/dispatcher/menu"
            className="text-sm font-bold text-blue-400 hover:underline"
          >
            Back to Menu
          </Link>

          <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-blue-400">
            Dispatcher Guide
          </p>

          <h1 className="mt-1 text-3xl font-black">Help</h1>

          <p className="mt-2 max-w-3xl text-muted">
            A quick reference for what each dispatcher page is used for.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {helpPages.map((page) => (
            <HelpPageCard
              key={page.href}
              title={page.title}
              href={page.href}
              description={page.description}
              features={page.features}
            />
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-app bg-card p-5 shadow-xl">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
            <div>
              <h2 className="text-xl font-black text-main">
                Contact Support
              </h2>
              <p className="mt-2 text-sm text-muted">
                For now this is a placeholder contact form. Later it can be
                connected to email, tickets, or an internal support workflow.
              </p>
            </div>

            <form className="space-y-3">
              <label className="block text-sm font-semibold text-muted">
                Email
              </label>
              <input
                type="email"
                placeholder="dispatcher@example.com"
                className="w-full rounded-xl border border-app bg-app px-4 py-3 text-main outline-none focus:border-blue-500"
              />
              <button
                type="button"
                className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
              >
                Contact Support
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
