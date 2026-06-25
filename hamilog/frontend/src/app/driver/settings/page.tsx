import SettingsPanel from "@/components/shared/SettingsPanel";
import BackToMenuButton from "@/components/shared/BackToMenuButton";

export default function DriverSettingsPage() {
  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mb-4">
        <BackToMenuButton href="/driver/menu" />
      </div>
      <SettingsPanel audience="driver" />
    </main>
  );
}
