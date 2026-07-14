import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type Mission,
  type StoredUser,
  clearToken,
  getStoredUser,
} from "@/lib/api-client";
import DetailTile from "@/components/dispatcher/shared/DetailTile";
import StatCard from "@/components/dispatcher/dashboard/StatCard";
import DispatcherStatsWindow from "@/components/dispatcher/shared/DispatcherStatsWindow";
import { getMissionDistanceLabel } from "@/lib/mission-distance";

type DriverProfileDetails = {
  email: string;
  phone: string;
  address: string;
  city: string;
  zipcode: string;
};

const DEFAULT_PROFILE: DriverProfileDetails = {
  email: "driver@example.com",
  phone: "+1 555 0100",
  address: "120 Logistics Way",
  city: "Tel Aviv",
  zipcode: "6100001",
};

// Builds initial profile details from the logged-in user record.
function getDefaultProfile(user: StoredUser | null): DriverProfileDetails {
  return {
    ...DEFAULT_PROFILE,
    email: user?.email || DEFAULT_PROFILE.email,
    phone: user?.phone || DEFAULT_PROFILE.phone,
    address: user?.address || DEFAULT_PROFILE.address,
    city: user?.city || DEFAULT_PROFILE.city,
  };
}

// Returns the profile storage key.
function getProfileStorageKey(user: StoredUser | null) {
  return `hamilog-driver-profile-${user?.driver_id || user?.username || "guest"}`;
}

// Returns the saved profile.
function getSavedProfile(user: StoredUser | null): DriverProfileDetails {
  const defaultProfile = getDefaultProfile(user);
  if (typeof window === "undefined") return defaultProfile;

  const savedProfile = localStorage.getItem(getProfileStorageKey(user));
  if (!savedProfile) return defaultProfile;

  try {
    return { ...defaultProfile, ...JSON.parse(savedProfile) };
  } catch {
    return defaultProfile;
  }
}

// Renders the editable field component.
function EditableField({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <DetailTile label={label} density="compact">
      {editing ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-app bg-card-soft px-2.5 py-2 text-sm font-semibold text-main outline-none transition focus:border-blue-500"
        />
      ) : (
        <p className="font-semibold text-main">{value}</p>
      )}
    </DetailTile>
  );
}

// Renders the profile tab component.
export default function ProfileTab({
  missions,
  openMissions,
}: {
  missions: Mission[];
  openMissions: Mission[];
}) {
  const router = useRouter();
  const [user] = useState<StoredUser | null>(() => getStoredUser());
  const [profile, setProfile] = useState<DriverProfileDetails>(() =>
    getSavedProfile(getStoredUser())
  );
  const [editing, setEditing] = useState(false);
  const activeCount = missions.filter(
    (mission) => mission.status === "in_transit"
  ).length;
  const completedMissions = missions.filter(
    (mission) => mission.status === "delivered"
  );

  const handleLogout = useCallback(() => {
    clearToken();
    router.push("/");
  }, [router]);

  const handleEditClick = useCallback(() => {
    if (editing) {
      localStorage.setItem(getProfileStorageKey(user), JSON.stringify(profile));
    }

    setEditing((current) => !current);
  }, [editing, profile, user]);

  const updateProfileField = useCallback(
    (field: keyof DriverProfileDetails, value: string) => {
      setProfile((current) => ({ ...current, [field]: value }));
    },
    []
  );

  return (
    <section className="space-y-3 sm:space-y-5">
      <DispatcherStatsWindow className="min-h-28 max-h-64 resize-y overflow-auto">
        <StatCard
          title="Active Mission"
          value={`${activeCount}`}
          subtitle={activeCount > 0 ? "In transit" : "No active route"}
          icon="truck"
          color="blue"
          compact
        />
        <StatCard
          title="Open Tasks"
          value={`${openMissions.length}`}
          subtitle="Available missions"
          icon="cargo"
          color="orange"
          compact
        />
        <StatCard
          title="Completed"
          value={`${completedMissions.length}`}
          subtitle="Delivered missions"
          icon="check"
          color="green"
          compact
        />
        <StatCard
          title="Total Km"
          value={getMissionDistanceLabel(completedMissions)}
          subtitle="Delivered routes"
          icon="km"
          color="blue"
          compact
        />
      </DispatcherStatsWindow>

      <div className="rounded-xl border border-app bg-card p-3 shadow-sm sm:p-4">
        <h2 className="text-lg font-semibold text-main sm:text-xl">Driver Status</h2>
        <div className="mt-3 grid gap-2.5 text-sm sm:grid-cols-3">
          <div className="flex justify-between gap-4 rounded-xl border border-app bg-card-soft p-3">
            <span className="text-muted">Account</span>
            <span className="font-bold text-main">
              {user?.username || "Driver"}
            </span>
          </div>
          <div className="flex justify-between gap-4 rounded-xl border border-app bg-card-soft p-3">
            <span className="text-muted">Vehicle</span>
            <span className="font-bold capitalize text-main">
              {user?.car_type?.replace("_", " ") || "Not set"}
            </span>
          </div>
          <div className="flex justify-between gap-4 rounded-xl border border-app bg-card-soft p-3">
            <span className="text-muted">Online</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">Ready</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-app bg-card p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-main sm:text-xl">Profile</h2>
            <p className="mt-1 text-xs text-muted sm:text-sm">
              Driver account, contact details, and vehicle information.
            </p>
          </div>

          <button
            type="button"
            onClick={handleEditClick}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            {editing ? "Save Profile" : "Edit Contact Info"}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-3">
          <DetailTile label="Username" density="compact">
            <p className="font-semibold text-main">
              {user?.username || "Driver"}
            </p>
          </DetailTile>

          <DetailTile label="Role" density="compact">
            <p className="font-semibold capitalize text-main">
              {user?.role || "driver"}
            </p>
          </DetailTile>

          <DetailTile label="Vehicle Type" density="compact">
            <p className="font-semibold capitalize text-main">
              {user?.car_type?.replace("_", " ") || "Not set"}
            </p>
          </DetailTile>

          <DetailTile label="Driver ID" density="compact">
            <p className="font-mono text-xs text-muted sm:text-sm">
              {user?.driver_id || "Unknown"}
            </p>
          </DetailTile>

          <EditableField
            label="Email"
            value={profile.email}
            editing={editing}
            onChange={(value) => updateProfileField("email", value)}
          />

          <EditableField
            label="Phone"
            value={profile.phone}
            editing={editing}
            onChange={(value) => updateProfileField("phone", value)}
          />

          <EditableField
            label="Address"
            value={profile.address}
            editing={editing}
            onChange={(value) => updateProfileField("address", value)}
          />

          <EditableField
            label="City"
            value={profile.city}
            editing={editing}
            onChange={(value) => updateProfileField("city", value)}
          />

          <EditableField
            label="Zipcode"
            value={profile.zipcode}
            editing={editing}
            onChange={(value) => updateProfileField("zipcode", value)}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-500"
      >
        Sign Out
      </button>
    </section>
  );
}
