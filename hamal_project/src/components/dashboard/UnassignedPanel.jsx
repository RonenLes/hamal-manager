import PanelCard from "./PanelCard";

export default function UnassignedPanel() {
  return (
    <PanelCard title="Unassigned Deliveries" color="bg-red-600" count={2} scrollable>
      <div className="space-y-4">
        <div className="border rounded-lg p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">Delivery #1030</p>
              <p className="text-sm text-gray-500">Food packages</p>
            </div>

            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
              No Driver
            </span>
          </div>

          <div className="mt-3 text-sm space-y-1">
            <p>
              <span className="text-gray-500">From:</span> Tel Aviv
            </p>
            <p>
              <span className="text-gray-500">To:</span> Rishon LeZion
            </p>
            <p>
              <span className="text-gray-500">Priority:</span> High
            </p>
          </div>

          <button className="w-full mt-4 bg-blue-600 text-white text-sm py-2 rounded-lg">
            Assign Driver
          </button>
        </div>

        <div className="border rounded-lg p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">Delivery #1031</p>
              <p className="text-sm text-gray-500">Medical equipment</p>
            </div>

            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
              No Driver
            </span>
          </div>

          <div className="mt-3 text-sm space-y-1">
            <p>
              <span className="text-gray-500">From:</span> Givatayim
            </p>
            <p>
              <span className="text-gray-500">To:</span> Bnei Brak
            </p>
            <p>
              <span className="text-gray-500">Priority:</span> Medium
            </p>
          </div>

          <button className="w-full mt-4 bg-blue-600 text-white text-sm py-2 rounded-lg">
            Assign Driver
          </button>
        </div>
      </div>
    </PanelCard>
  );
}