import PanelCard from "./PanelCard";

export default function RecentActivityPanel() {
  return (
    <PanelCard title="Recent Activity" color="bg-purple-600" count={5} scrollable>
      <div className="space-y-4">
        <div className="border-b pb-3">
          <p className="text-sm font-medium">Driver approved</p>
          <p className="text-sm text-gray-500">
            David Cohen was approved for delivery #1024.
          </p>
          <p className="text-xs text-gray-400 mt-1">5 minutes ago</p>
        </div>

        <div className="border-b pb-3">
          <p className="text-sm font-medium">Delivery completed</p>
          <p className="text-sm text-gray-500">
            Delivery #1019 was completed successfully.
          </p>
          <p className="text-xs text-gray-400 mt-1">18 minutes ago</p>
        </div>

        <div className="border-b pb-3">
          <p className="text-sm font-medium">New pending request</p>
          <p className="text-sm text-gray-500">
            Sarah Levi requested to take delivery #1025.
          </p>
          <p className="text-xs text-gray-400 mt-1">27 minutes ago</p>
        </div>

        <div className="border-b pb-3">
          <p className="text-sm font-medium">Unassigned delivery created</p>
          <p className="text-sm text-gray-500">
            Delivery #1030 was added without an assigned driver.
          </p>
          <p className="text-xs text-gray-400 mt-1">42 minutes ago</p>
        </div>

        <div>
          <p className="text-sm font-medium">Driver went offline</p>
          <p className="text-sm text-gray-500">
            Noam Bar is currently not connected.
          </p>
          <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
        </div>
      </div>
    </PanelCard>
  );
}