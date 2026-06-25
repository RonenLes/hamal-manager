import SettingsPanel from "@/components/shared/SettingsPanel";
import BackToMenuButton from "@/components/shared/BackToMenuButton";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mb-4">
        <BackToMenuButton href="/dispatcher/menu" />
      </div>
      <SettingsPanel audience="dispatcher" />
    </main>
  );
}
