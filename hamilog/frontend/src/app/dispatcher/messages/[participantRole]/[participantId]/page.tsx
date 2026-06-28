import MessageConversationPage from "@/components/messages/MessageConversationPage";

type DispatcherConversationPageProps = {
  params: Promise<{
    participantRole: string;
    participantId: string;
  }>;
};

// Renders the dispatcher conversation page component.
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
