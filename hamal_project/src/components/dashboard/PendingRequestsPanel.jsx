import PanelCard from "./PanelCard";

export default function PendingRequestsPanel() {
  return (
    <PanelCard title="Pending Requests" color="bg-yellow-500" count={3} scrollable>
      <div className="space-y-4">
        <div className="border rounded-lg p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">David Cohen</p>
              <p className="text-sm text-gray-500">Wants to take delivery #1024</p>
            </div>

            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
              Pending
            </span>
          </div>

          <div className="mt-3 text-sm space-y-1">
            <p>
              <span className="text-gray-500">Item:</span> Food packages
            </p>
            <p>
              <span className="text-gray-500">From:</span> Tel Aviv
            </p>
            <p>
              <span className="text-gray-500">To:</span> Ramat Gan
            </p>
          </div>

          <div className="flex gap-2 mt-4">
            <button className="flex-1 bg-green-600 text-white text-sm py-2 rounded-lg">
              Approve
            </button>

            <button className="flex-1 bg-red-600 text-white text-sm py-2 rounded-lg">
              Reject
            </button>
          </div>
        </div>

        <div className="border rounded-lg p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">Sarah Levi</p>
              <p className="text-sm text-gray-500">Wants to take delivery #1025</p>
            </div>

            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
              Pending
            </span>
          </div>

          <div className="mt-3 text-sm space-y-1">
            <p>
              <span className="text-gray-500">Item:</span> Medicine
            </p>
            <p>
              <span className="text-gray-500">From:</span> Givatayim
            </p>
            <p>
              <span className="text-gray-500">To:</span> Bnei Brak
            </p>
          </div>

          <div className="flex gap-2 mt-4">
            <button className="flex-1 bg-green-600 text-white text-sm py-2 rounded-lg">
              Approve
            </button>

            <button className="flex-1 bg-red-600 text-white text-sm py-2 rounded-lg">
              Reject
            </button>
          </div>
        </div>

        <div className="border rounded-lg p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">Michael Rosen</p>
              <p className="text-sm text-gray-500">Wants to take delivery #1026</p>
            </div>

            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
              Pending
            </span>
          </div>

          <div className="mt-3 text-sm space-y-1">
            <p>
              <span className="text-gray-500">Item:</span> Equipment
            </p>
            <p>
              <span className="text-gray-500">From:</span> Petah Tikva
            </p>
            <p>
              <span className="text-gray-500">To:</span> Tel Aviv
            </p>
          </div>

          <div className="flex gap-2 mt-4">
            <button className="flex-1 bg-green-600 text-white text-sm py-2 rounded-lg">
              Approve
            </button>

            <button className="flex-1 bg-red-600 text-white text-sm py-2 rounded-lg">
              Reject
            </button>
          </div>
        </div>
      </div>
    </PanelCard>
  );
}