"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LoadingScreen } from "@/components/shared/Spinner";
import { useRouter } from "next/navigation";

import {
  type MessageConversation,
  type MessageParticipant,
  getMessageConversations,
  getMessageParticipants,
  getStoredUser,
  getToken,
} from "@/lib/api-client";
import BackToMenuButton from "@/components/shared/BackToMenuButton";
import MessageDirectory from "./MessageDirectory";
import MessageFilters from "./MessageFilters";
import type {
  MessagesPageRole,
  ParticipantTab,
  ParticipantWithConversation,
  PresenceFilter,
} from "./types";

type MessagesPageProps = {
  role: MessagesPageRole;
  fallbackHref: string;
};

// Returns the participant key.
function getParticipantKey(role: string, id: string) {
  return `${role}:${id}`;
}

// Returns the driver rank.
function getDriverRank(participant: MessageParticipant) {
  if (participant.status === "on_mission") return 0;
  if (participant.status === "available") return 1;
  if (participant.status === "offline") return 2;
  return 3;
}

// Returns the dispatcher rank.
function getDispatcherRank(participant: MessageParticipant) {
  return participant.is_online ? 0 : 1;
}

// Filters the by presence.
function filterByPresence(
  participant: MessageParticipant,
  filter: PresenceFilter
) {
  if (filter === "all") return true;
  if (filter === "on_mission") return participant.status === "on_mission";
  if (filter === "online") {
    return participant.is_online && participant.status !== "on_mission";
  }
  return !participant.is_online;
}

// Attaches the conversations.
function attachConversations(
  participants: MessageParticipant[],
  conversations: MessageConversation[]
): ParticipantWithConversation[] {
  const conversationMap = new Map(
    conversations.map((conversation) => [
      getParticipantKey(
        conversation.participant_role,
        conversation.participant_id
      ),
      conversation,
    ])
  );

  return participants.map((participant) => {
    const conversation = conversationMap.get(
      getParticipantKey(participant.role, participant.id)
    );

    return {
      ...participant,
      conversation,
      unread_count: conversation?.unread_count ?? 0,
    };
  });
}

// Renders the messages page component.
export default function MessagesPage({ role, fallbackHref }: MessagesPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ParticipantTab>("drivers");
  const [activeFilter, setActiveFilter] = useState<PresenceFilter>("all");
  const [participants, setParticipants] = useState<{
    drivers: MessageParticipant[];
    dispatchers: MessageParticipant[];
  }>({ drivers: [], dispatchers: [] });
  const [conversations, setConversations] = useState<MessageConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser || storedUser.role !== role) {
      router.replace(`/login?role=${role}`);
    }
  }, [role, router]);

  const fetchDirectory = useCallback(async () => {
    try {
      const [participantData, conversationData] = await Promise.all([
        getMessageParticipants(),
        getMessageConversations(),
      ]);

      setParticipants(participantData);
      setConversations(conversationData);
    } catch {
      setParticipants({ drivers: [], dispatchers: [] });
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void fetchDirectory();
    }, 0);

    const interval = setInterval(fetchDirectory, 10000);
    return () => {
      window.clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [fetchDirectory]);

  const visibleParticipants = useMemo(() => {
    const base =
      activeTab === "drivers" ? participants.drivers : participants.dispatchers;

    const withConversations = attachConversations(base, conversations).filter(
      (participant) => filterByPresence(participant, activeFilter)
    );

    return [...withConversations].sort((a, b) => {
      const rankDiff =
        activeTab === "drivers"
          ? getDriverRank(a) - getDriverRank(b)
          : getDispatcherRank(a) - getDispatcherRank(b);

      if (rankDiff !== 0) return rankDiff;
      return a.name.localeCompare(b.name);
    });
  }, [activeFilter, activeTab, conversations, participants]);

  // Handles the mission href for logic.
  function missionHrefFor(participant: ParticipantWithConversation) {
    const missionId = participant.current_mission_id;
    if (!missionId) {
      return role === "dispatcher" ? "/dispatcher/missions" : "/driver/my-missions";
    }

    return role === "dispatcher"
      ? `/dispatcher/missions?missionId=${missionId}`
      : `/driver/my-missions?missionId=${missionId}`;
  }

  // Handles the conversation href for logic.
  function conversationHrefFor(participant: ParticipantWithConversation) {
    return role === "dispatcher"
      ? `/dispatcher/messages/${participant.role}/${participant.id}`
      : `/driver/messages/${participant.role}/${participant.id}`;
  }

  if (loading) {
    return (
      <LoadingScreen label="Loading messages..." />
    );
  }

  return (
    <main className="min-h-screen bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <BackToMenuButton href={fallbackHref} />
          <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-blue-400">
            Team Communication
          </p>
          <h1 className="mt-1 text-3xl font-semibold">Messages</h1>
          <p className="mt-2 text-muted">
            Message drivers and dispatchers from one shared inbox.
          </p>
        </header>

        <section className="space-y-5">
          <MessageFilters
            activeTab={activeTab}
            activeFilter={activeFilter}
            onTabChange={setActiveTab}
            onFilterChange={setActiveFilter}
          />

          <MessageDirectory
            participants={visibleParticipants}
            missionHrefFor={missionHrefFor}
            conversationHrefFor={conversationHrefFor}
          />
        </section>
      </div>
    </main>
  );
}
