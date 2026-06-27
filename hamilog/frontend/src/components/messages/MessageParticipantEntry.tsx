import Link from "next/link";

import type { ParticipantWithConversation } from "./types";

type MessageParticipantEntryProps = {
  participant: ParticipantWithConversation;
  missionHref: string;
  conversationHref: string;
};

function getStatusClasses(status: string) {
  if (status === "on_mission") {
    return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  }
  if (status === "available" || status === "online") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }
  return "border-slate-500/30 bg-slate-500/10 text-muted";
}

export default function MessageParticipantEntry({
  participant,
  missionHref,
  conversationHref,
}: MessageParticipantEntryProps) {
  const mission = participant.current_mission;

  return (
    <article
      className="rounded-xl border border-app bg-app/70 p-4 transition hover:border-blue-500/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-main">{participant.name}</h3>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusClasses(
                participant.status
              )}`}
            >
              {participant.status.replace("_", " ")}
            </span>
          </div>

          <p className="mt-1 text-sm capitalize text-muted">
            {participant.role}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {participant.unread_count > 0 && (
            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-black text-white">
              {participant.unread_count}
            </span>
          )}

          <Link
            href={conversationHref}
            aria-label={`Message ${participant.name}`}
            title={`Message ${participant.name}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white transition hover:bg-blue-500"
          >
            <span aria-hidden="true">✉</span>
          </Link>
        </div>
      </div>

      {mission && (
        <Link
          href={missionHref}
          className="mt-3 block rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/20"
        >
          Mission: {mission.title}
        </Link>
      )}

      {participant.conversation?.last_message && (
        <p className="mt-3 line-clamp-2 text-sm text-muted">
          {participant.conversation.last_message.body}
        </p>
      )}

    </article>
  );
}
