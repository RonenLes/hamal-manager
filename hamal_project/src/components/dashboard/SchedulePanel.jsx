import PanelCard from "./PanelCard";

export default function SchedulePanel() {
  return (
    <PanelCard title="Today's Schedule" color="bg-blue-600" scrollable>
      <div className="space-y-4">
        <div className="border-b pb-4">
          <div className="flex justify-between items-center">
            <p className="font-bold">08:00</p>
            <span className="text-xs text-gray-500">Scheduled</span>
          </div>

          <div className="mt-3 text-sm">
            <p className="text-gray-500">From</p>
            <p>123 Main St, Downtown</p>
          </div>

          <div className="mt-3 text-sm">
            <p className="text-gray-500">To</p>
            <p>456 Oak Ave, Westside</p>
          </div>

          <p className="mt-3 text-sm font-medium">John Smith</p>
        </div>

        <div>
          <div className="flex justify-between items-center">
            <p className="font-bold">09:30</p>
            <span className="text-xs text-gray-500">Scheduled</span>
          </div>

          <div className="mt-3 text-sm">
            <p className="text-gray-500">From</p>
            <p>789 Pine Rd, Eastside</p>
          </div>

          <div className="mt-3 text-sm">
            <p className="text-gray-500">To</p>
            <p>321 Lake St, Northside</p>
          </div>

          <p className="mt-3 text-sm font-medium">Sarah Johnson</p>
        </div>
      </div>
    </PanelCard>
  );
}