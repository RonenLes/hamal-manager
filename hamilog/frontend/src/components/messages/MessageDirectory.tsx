import type { ParticipantWithConversation } from "./types";
import MessageParticipantEntry from "./MessageParticipantEntry";

type MessageDirectoryProps = {
  participants: ParticipantWithConversation[];
  missionHrefFor: (participant: ParticipantWithConversation) => string;
  conversationHrefFor: (participant: ParticipantWithConversation) => string;
};

// Renders the message directory component.
export default function MessageDirectory({
  participants,
  missionHrefFor,
  conversationHrefFor,
}: MessageDirectoryProps) {
  return (
    <section className="rounded-xl border border-app bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-main">People</h2>
          <p className="text-sm text-muted">Use the message icon to open a thread.</p>
        </div>
        <span className="rounded-full bg-card-soft px-3 py-1 text-xs font-bold text-muted">
          {participants.length}
        </span>
      </div>

      <div className="space-y-3">
        {participants.length === 0 && (
          <p className="rounded-xl border border-app bg-app/70 p-4 text-sm text-muted">
            No people match this filter.
          </p>
        )}

        {participants.map((participant) => {
          const key = `${participant.role}:${participant.id}`;

          return (
            <MessageParticipantEntry
              key={key}
              participant={participant}
              missionHref={missionHrefFor(participant)}
              conversationHref={conversationHrefFor(participant)}
            />
          );
        })}
      </div>
    </section>
  );
}
