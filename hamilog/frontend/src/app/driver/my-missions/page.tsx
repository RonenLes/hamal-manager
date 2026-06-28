import DriverMissionWorkspace from "@/components/driver/DriverMissionWorkspace";
import BackToMenuButton from "@/components/shared/BackToMenuButton";

// Renders the driver my missions page component.
export default function DriverMyMissionsPage() {
  return (
    <div className="p-4 space-y-4">
      <BackToMenuButton href="/driver/menu" />
      <DriverMissionWorkspace initialTab="my-missions" />
    </div>
  );
}