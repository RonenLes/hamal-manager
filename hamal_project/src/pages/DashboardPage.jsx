import StatCard from "../components/dashboard/StatCard";
import SchedulePanel from "../components/dashboard/SchedulePanel";
import PendingRequestsPanel from "../components/dashboard/PendingRequestsPanel";
import UnassignedPanel from "../components/dashboard/UnassignedPanel";
import AlertsPanel from "../components/dashboard/AlertsPanel";
import DriverStatusPanel from "../components/dashboard/DriverStatusPanel";
import RecentActivityPanel from "../components/dashboard/RecentActivityPanel";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold mb-6">
          Hamal Manager Dashboard
        </h1>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <StatCard
            title="Deliveries Today"
            value="12 / 24"
            subtitle="3 in progress"
          />

          <StatCard
            title="Active Drivers"
            value="8 / 12"
            subtitle="3 available"
          />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AlertsPanel />
          <SchedulePanel />
          <DriverStatusPanel  />
          <PendingRequestsPanel />
          <UnassignedPanel />
          <RecentActivityPanel />
        </section>
      </div>
    </main>
  );
}