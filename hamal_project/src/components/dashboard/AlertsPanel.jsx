import PanelCard from "./PanelCard";

export default function AlertsPanel() {
  return (
    <PanelCard title="Alerts" color="bg-orange-600" count={3} scrollable>
      <div className="space-y-3">
        <div className="border-l-4 border-red-500 bg-red-50 p-3 rounded">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-red-700">
                High Priority Delivery
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Delivery #1030 has no assigned driver.
              </p>
            </div>

            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
              High
            </span>
          </div>
        </div>

        <div className="border-l-4 border-yellow-500 bg-yellow-50 p-3 rounded">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-yellow-700">
                Driver Delay
              </p>
              <p className="text-sm text-gray-600 mt-1">
                David Cohen is 15 minutes late for pickup.
              </p>
            </div>

            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
              Medium
            </span>
          </div>
        </div>

        <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-blue-700">
                New Request
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Sarah Levi requested to take delivery #1025.
              </p>
            </div>

            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              Info
            </span>
          </div>
        </div>
      </div>
    </PanelCard>
  );
}