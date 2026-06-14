import SettingsPanel from "@/components/shared/SettingsPanel";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <SettingsPanel audience="dispatcher" />
    </main>
  );
}
