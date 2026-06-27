import type { FormEvent } from "react";

import type { Message, StoredUser } from "@/lib/api-client";
import type { MessageRecipient } from "./types";

type MessageThreadProps = {
  currentUser: StoredUser | null;
  recipient: MessageRecipient | null;
  messages: Message[];
  draft: string;
  sending: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
};

function getCurrentUserId(user: StoredUser | null) {
  if (!user) return "";
  return user.role === "driver" ? user.driver_id || user.username : user.username;
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Now";

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageThread({
  currentUser,
  recipient,
  messages,
  draft,
  sending,
  onDraftChange,
  onSend,
}: MessageThreadProps) {
  const currentUserId = getCurrentUserId(currentUser);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSend();
  }

  if (!recipient) {
    return (
      <section className="flex min-h-[520px] items-center justify-center rounded-2xl border border-app bg-card p-8 text-center text-muted shadow-xl">
        Select a person to open messages.
      </section>
    );
  }

  return (
    <section className="flex min-h-[520px] flex-col rounded-2xl border border-app bg-card shadow-xl">
      <header className="border-b border-app px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-400">
          Conversation
        </p>
        <h2 className="mt-1 text-xl font-black text-main">{recipient.name}</h2>
        <p className="text-sm capitalize text-muted">{recipient.role}</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.length === 0 && (
          <p className="rounded-xl border border-app bg-app/70 p-4 text-sm text-muted">
            No messages yet.
          </p>
        )}

        {messages.map((message) => {
          const isMine =
            message.sender_id === currentUserId &&
            message.sender_role === currentUser?.role;

          return (
            <div
              key={message.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                  isMine
                    ? "bg-blue-600 text-white"
                    : "border border-app bg-app/80 text-main"
                }`}
              >
                <p className="text-sm">{message.body}</p>
                <p className={`mt-2 text-xs ${isMine ? "text-blue-100" : "text-muted"}`}>
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-app p-4">
        <div className="flex gap-3">
          <input
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Type a message"
            className="min-w-0 flex-1 rounded-xl border border-app bg-card-soft px-4 py-3 text-main outline-none transition focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </section>
  );
}
