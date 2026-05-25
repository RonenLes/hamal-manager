import PanelCard from "./PanelCard";

export default function DriverStatusPanel() {
  return (
    <PanelCard title="Driver Status" color="bg-green-600" count={4} scrollable>
      <div className="space-y-3">
        <div className="flex items-center justify-between border rounded-lg p-3">
          <div>
            <p className="font-semibold">David Cohen</p>
            <p className="text-sm text-gray-500">Tel Aviv area</p>
          </div>

          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            Available
          </span>
        </div>

        <div className="flex items-center justify-between border rounded-lg p-3">
          <div>
            <p className="font-semibold">Sarah Levi</p>
            <p className="text-sm text-gray-500">On delivery #1025</p>
          </div>

          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            In Progress
          </span>
        </div>

        <div className="flex items-center justify-between border rounded-lg p-3">
          <div>
            <p className="font-semibold">Michael Rosen</p>
            <p className="text-sm text-gray-500">Waiting for approval</p>
          </div>

          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
            Pending
          </span>
        </div>

        <div className="flex items-center justify-between border rounded-lg p-3">
          <div>
            <p className="font-semibold">Noam Bar</p>
            <p className="text-sm text-gray-500">Not connected</p>
          </div>

          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
            Offline
          </span>
        </div>
      </div>
    </PanelCard>
  );
}