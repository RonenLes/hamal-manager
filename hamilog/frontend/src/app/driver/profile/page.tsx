import DriverMissionWorkspace from "@/components/driver/DriverMissionWorkspace";
import BackToMenuButton from "@/components/shared/BackToMenuButton";

// Renders the driver profile page component.
export default function DriverProfilePage() {
  return( 
    <div className="p-4 space-y-4">
      <BackToMenuButton href="/driver/menu" />
      <DriverMissionWorkspace initialTab="profile" />;
      </div>
  );
}
