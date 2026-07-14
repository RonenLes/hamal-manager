"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createMission,
  getLocationCities,
  getLocationStreets,
  getMission,
  getStoredUser,
  getToken,
  updateMission,
} from "@/lib/api-client";
import NewMissionFormPanel, { type NewMissionForm } from "./NewMissionFormPanel";
import {
  buildMissionPayload,
  initialMissionForm,
  missionToForm,
  validateMissionForm,
} from "@/lib/mission-form";

type ResultState = { type: "success" | "error"; message: string } | null;

export default function MissionFormPage({ missionId }: { missionId?: string }) {
  const router = useRouter();
  const isEditing = Boolean(missionId);
  const [form, setForm] = useState<NewMissionForm>(initialMissionForm);
  const [cities, setCities] = useState<string[]>([]);
  const [pickupStreets, setPickupStreets] = useState<string[]>([]);
  const [dropoffStreets, setDropoffStreets] = useState<string[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(isEditing);
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState<ResultState>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!getToken() || !user || user.role !== "dispatcher") {
      router.replace("/login?role=dispatcher");
    }
  }, [router]);

  const fetchCities = useCallback(async () => {
    setLocationsLoading(true);
    try {
      setCities(await getLocationCities());
      setLocationsError(null);
    } catch {
      setCities([]);
      setLocationsError("Could not load cities. Make sure the backend is running.");
    } finally {
      setLocationsLoading(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(fetchCities); }, [fetchCities]);

  useEffect(() => {
    if (!missionId) return;
    async function loadMission() {
      try {
        setForm(missionToForm(await getMission(missionId as string)));
      } catch {
        setResult({ type: "error", message: "Could not load this mission for editing." });
      } finally {
        setPageLoading(false);
      }
    }
    void loadMission();
  }, [missionId]);

  useEffect(() => {
    if (!form.fromCity) return;
    void getLocationStreets(form.fromCity).then(setPickupStreets).catch(() => setPickupStreets([]));
  }, [form.fromCity]);

  useEffect(() => {
    if (!form.toCity) return;
    void getLocationStreets(form.toCity).then(setDropoffStreets).catch(() => setDropoffStreets([]));
  }, [form.toCity]);

  function updateForm<K extends keyof NewMissionForm>(key: K, value: NewMissionForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === "fromCity") setPickupStreets([]);
    if (key === "toCity") setDropoffStreets([]);
    if (result?.type === "error") setResult(null);
  }

  async function submitMission() {
    const validationError = validateMissionForm(form);
    if (validationError) {
      setResult({ type: "error", message: validationError });
      return;
    }

    setPosting(true);
    setResult(null);
    try {
      const payload = buildMissionPayload(form);
      if (missionId) await updateMission(missionId, payload);
      else await createMission(payload);
      setResult({
        type: "success",
        message: missionId ? "Mission updated successfully." : "Mission added successfully.",
      });
    } catch (error: unknown) {
      const detail = error && typeof error === "object" && "detail" in error
        ? String((error as { detail: unknown }).detail)
        : null;
      setResult({
        type: "error",
        message: detail || (missionId ? "Mission update failed." : "Mission creation failed."),
      });
    } finally {
      setPosting(false);
    }
  }

  if (pageLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-app text-main">Loading mission...</main>;
  }

  if (result?.type === "success") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app px-3 py-6 text-main">
        <section className="w-full max-w-lg rounded-2xl border border-emerald-500/30 bg-card p-6 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-2xl text-emerald-300">✓</div>
          <h1 className="mt-4 text-2xl font-black">Success</h1>
          <p className="mt-2 text-muted">{result.message}</p>
          <Link href="/dispatcher/missions" className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500">Back to Missions</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app px-3 py-4 text-main sm:p-6">
      <div className="mx-auto max-w-5xl">
        <Link href="/dispatcher/missions" className="inline-flex rounded-xl border border-app bg-card px-4 py-2 text-sm font-bold text-main transition hover:bg-card-soft">← Back to Missions</Link>
        {result?.type === "error" && (
          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-red-200">{result.message}</p>
            <button type="button" onClick={() => void submitMission()} disabled={posting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50">Retry</button>
          </div>
        )}
        <NewMissionFormPanel
          form={form}
          posting={posting}
          title={isEditing ? "Edit Mission" : "Add New Mission"}
          description={isEditing ? "Update the mission details and save your changes." : "Fill the delivery information and add it to the mission pool."}
          submitLabel={isEditing ? "Update Mission" : "Add Mission"}
          submittingLabel={isEditing ? "Updating..." : "Adding..."}
          cities={cities}
          pickupStreets={pickupStreets}
          dropoffStreets={dropoffStreets}
          locationsLoading={locationsLoading}
          locationsError={locationsError}
          onRetryLocations={fetchCities}
          onUpdate={updateForm}
          onSubmit={() => void submitMission()}
          onCancel={() => router.push("/dispatcher/missions")}
        />
      </div>
    </main>
  );
}
