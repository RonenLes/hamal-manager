"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type Message,
  type MessageParticipant,
  type StoredUser,
  getMessageParticipants,
  getMessages,
  getStoredUser,
  getToken,
  markMessagesRead,
  sendMessage,
} from "@/lib/api-client";
import BackToMenuButton from "@/components/shared/BackToMenuButton";
import MessageThread from "./MessageThread";
import type { MessageRecipient, MessagesPageRole } from "./types";

type MessageConversationPageProps = {
  role: MessagesPageRole;
  fallbackHref: string;
  params: Promise<{
    participantRole: string;
    participantId: string;
  }>;
};

// Checks whether the value is message role.
function isMessageRole(value: string): value is MessageRecipient["role"] {
  return value === "dispatcher" || value === "driver";
}

// Finds the participant.
function findParticipant(
  participants: { drivers: MessageParticipant[]; dispatchers: MessageParticipant[] },
  participantRole: MessageRecipient["role"],
  participantId: string
) {
  const list =
    participantRole === "driver" ? participants.drivers : participants.dispatchers;

  return list.find((participant) => participant.id === participantId) || null;
}

// Renders the message conversation page component.
export default function MessageConversationPage({
  role,
  fallbackHref,
  params,
}: MessageConversationPageProps) {
  const { participantRole, participantId } = use(params);
  const router = useRouter();
  const [user] = useState<StoredUser | null>(() => getStoredUser());
  const [participant, setParticipant] = useState<MessageRecipient | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser || storedUser.role !== role) {
      router.replace(`/login?role=${role}`);
    }
  }, [role, router]);

  const normalizedRole = useMemo(() => {
    return isMessageRole(participantRole) ? participantRole : null;
  }, [participantRole]);

  const fetchThread = useCallback(async () => {
    if (!normalizedRole) {
      setLoading(false);
      return;
    }

    try {
      const [participantData, thread] = await Promise.all([
        getMessageParticipants(),
        getMessages(normalizedRole, participantId),
      ]);
      const found = findParticipant(participantData, normalizedRole, participantId);

      setParticipant({
        id: participantId,
        role: normalizedRole,
        name: found?.name || participantId,
      });
      setMessages(thread);
      await markMessagesRead(normalizedRole, participantId);
    } finally {
      setLoading(false);
    }
  }, [normalizedRole, participantId]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void fetchThread();
    }, 0);

    const interval = setInterval(fetchThread, 10000);
    return () => {
      window.clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [fetchThread]);

  // Handles the send action.
  async function handleSend() {
    if (!participant || !draft.trim()) return;

    setSending(true);
    try {
      await sendMessage(participant.role, participant.id, draft.trim());
      setDraft("");
      await fetchThread();
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app text-main">
        Loading conversation...
      </main>
    );
  }

  if (!normalizedRole) {
    return (
      <main className="min-h-screen bg-app p-6 text-main">
        <div className="mx-auto max-w-4xl">
          <BackToMenuButton href={fallbackHref} />
          <div className="mt-6 rounded-2xl border border-app bg-card p-8 text-center text-muted">
            Conversation not found.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <BackToMenuButton href={fallbackHref} />
          <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-blue-400">
            Conversation
          </p>
          <h1 className="mt-1 text-3xl font-black">
            {participant?.name || participantId}
          </h1>
        </header>

        <MessageThread
          currentUser={user}
          recipient={participant}
          messages={messages}
          draft={draft}
          sending={sending}
          onDraftChange={setDraft}
          onSend={handleSend}
        />
      </div>
    </main>
  );
}
