import DriverMissionWorkspace from "@/components/driver/DriverMissionWorkspace";
import BackToMenuButton from "@/components/shared/BackToMenuButton";

// Renders the driver profile page component.
export default function DriverProfilePage() {
  return (
    <div className="space-y-4 p-4">
      <BackToMenuButton href="/driver/menu" />
      <DriverMissionWorkspace initialTab="profile" />
    </div>
  );
}
