import type {
  MessageConversation,
  MessageParticipant,
  StoredUser,
  UserRole,
} from "@/lib/api-client";

export type ParticipantTab = "drivers" | "dispatchers";
export type PresenceFilter = "all" | "online" | "offline" | "on_mission";

export type ParticipantWithConversation = MessageParticipant & {
  unread_count: number;
  conversation?: MessageConversation;
};

export type MessagesPageRole = StoredUser["role"];

export type MessageRecipient = {
  id: string;
  role: UserRole;
  name: string;
};
