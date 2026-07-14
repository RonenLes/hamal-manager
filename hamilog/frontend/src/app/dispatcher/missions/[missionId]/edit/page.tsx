"use client";

import { use } from "react";
import MissionFormPage from "@/components/dispatcher/missions/MissionFormPage";

export default function EditMissionPage({ params }: { params: Promise<{ missionId: string }> }) {
  const { missionId } = use(params);
  return <MissionFormPage missionId={missionId} />;
}
