import HelpPage, { type HelpPageItem } from "@/components/shared/HelpPage";

const driverHelpPages: HelpPageItem[] = [
  {
    title: "Dashboard",
    href: "/driver",
    description: "The main driver workspace for active delivery work.",
    features: [
      "Shows the current mission, open tasks, and driver status.",
      "Keeps active mission actions close to the first screen.",
      "Useful as the starting point before accepting or continuing deliveries.",
    ],
  },
  {
    title: "Open Tasks",
    href: "/driver/open-tasks",
    description: "Available missions that drivers can request.",
    features: [
      "Review available missions and route details.",
      "Open mission information before sending a request.",
      "Submit a request for missions that fit your vehicle and availability.",
    ],
  },
  {
    title: "My Missions",
    href: "/driver/my-missions",
    description: "Assigned, active, and completed mission work.",
    features: [
      "Track missions assigned to you.",
      "Review pickup, dropoff, cargo, and current mission status.",
      "Finish delivery flow from the active mission area.",
    ],
  },
  {
    title: "Messages",
    href: "/driver/messages",
    description: "Direct conversations with dispatchers and other drivers.",
    features: [
      "Open conversations from the people list.",
      "See unread message counts before opening a conversation.",
      "Filter people by online, offline, or on-mission status.",
    ],
  },
  {
    title: "History",
    href: "/driver/history",
    description: "Past mission record for completed delivery work.",
    features: [
      "Review missions that were already delivered.",
      "Inspect route, cargo, and delivery timing details.",
      "Use the history page to track previous work.",
    ],
  },
  {
    title: "Profile",
    href: "/driver/profile",
    description: "Driver account and vehicle information.",
    features: [
      "Review your contact details.",
      "Check vehicle type and profile information.",
      "Use this page when account details need to be checked.",
    ],
  },
  {
    title: "Settings",
    href: "/driver/settings",
    description: "Driver accessibility preferences.",
    features: [
      "Switch between light and dark theme modes.",
      "Choose small, medium, or large font size.",
      "Save display preferences in the browser for future sessions.",
    ],
  },
];

// Renders the driver help page component.
export default function DriverHelpPage() {
  return (
    <HelpPage
      guideLabel="Driver Guide"
      intro="A quick reference for what each driver page is used for."
      backHref="/driver/menu"
      pages={driverHelpPages}
    />
  );
}
