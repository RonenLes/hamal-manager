import MessageConversationPage from "@/components/messages/MessageConversationPage";

type DispatcherConversationPageProps = {
  params: Promise<{
    participantRole: string;
    participantId: string;
  }>;
};

export default function DispatcherConversationPage({
  params,
}: DispatcherConversationPageProps) {
  return (
    <MessageConversationPage
      role="dispatcher"
      fallbackHref="/dispatcher/messages"
      params={params}
    />
  );
}
