import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type StoredUser,
  clearToken,
  getStoredUser,
} from "@/lib/api-client";
import DetailTile from "@/components/dispatcher/shared/DetailTile";

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
    <DetailTile label={label}>
      {editing ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-app bg-card-soft px-3 py-2 font-semibold text-main outline-none transition focus:border-blue-500"
        />
      ) : (
        <p className="font-semibold text-main">{value}</p>
      )}
    </DetailTile>
  );
}

// Renders the profile tab component.
export default function ProfileTab() {
  const router = useRouter();
  const [user] = useState<StoredUser | null>(() => getStoredUser());
  const [profile, setProfile] = useState<DriverProfileDetails>(() =>
    getSavedProfile(getStoredUser())
  );
  const [editing, setEditing] = useState(false);

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
    <section className="space-y-5">
      <div className="rounded-2xl border border-app bg-card p-5 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-main">Profile</h2>
            <p className="mt-1 text-sm text-muted">
              Driver account, contact details, and vehicle information.
            </p>
          </div>

          <button
            type="button"
            onClick={handleEditClick}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            {editing ? "Save Profile" : "Edit Contact Info"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <DetailTile label="Username">
            <p className="font-semibold text-main">
              {user?.username || "Driver"}
            </p>
          </DetailTile>

          <DetailTile label="Role">
            <p className="font-semibold capitalize text-main">
              {user?.role || "driver"}
            </p>
          </DetailTile>

          <DetailTile label="Vehicle Type">
            <p className="font-semibold capitalize text-main">
              {user?.car_type?.replace("_", " ") || "Not set"}
            </p>
          </DetailTile>

          <DetailTile label="Driver ID">
            <p className="font-mono text-sm text-muted">
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
        className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-500"
      >
        Sign Out
      </button>
    </section>
  );
}
