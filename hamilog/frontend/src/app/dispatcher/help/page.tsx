import HelpPage, { type HelpPageItem } from "@/components/shared/HelpPage";

const dispatcherHelpPages: HelpPageItem[] = [
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
      "Compare mission urgency, pickup, dropoff, cargo details, and requesting drivers.",
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
      "Review all drivers, their status, vehicle type, and completed deliveries.",
      "Open a driver entry to see contact information, vehicle capacity, active delivery, and ID.",
      "Open driver history, message a driver, or review pending new driver requests from this area.",
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
    title: "Messages",
    href: "/dispatcher/messages",
    description: "Conversation center for drivers and dispatchers.",
    features: [
      "Filter people by driver or dispatcher role.",
      "See unread message counts and open direct conversations.",
      "Review on-mission drivers with links to the related mission details.",
    ],
  },
  {
    title: "Alerts",
    href: "/dispatcher/alerts",
    description: "Operational warnings and urgent situations.",
    features: [
      "Review critical, warning, info, and OK alerts.",
      "Inspect alerts related to unassigned missions, cooling needs, unavailable drivers, and driver cancellations.",
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

// Renders the dispatcher help page component.
export default function DispatcherHelpPage() {
  return (
    <HelpPage
      guideLabel="Dispatcher Guide"
      intro="A quick reference for what each dispatcher page is used for."
      backHref="/dispatcher/menu"
      pages={dispatcherHelpPages}
    />
  );
}
