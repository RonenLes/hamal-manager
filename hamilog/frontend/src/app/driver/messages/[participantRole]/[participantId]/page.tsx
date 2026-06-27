import MessageConversationPage from "@/components/messages/MessageConversationPage";

type DriverConversationPageProps = {
  params: Promise<{
    participantRole: string;
    participantId: string;
  }>;
};

export default function DriverConversationPage({
  params,
}: DriverConversationPageProps) {
  return (
    <MessageConversationPage
      role="driver"
      fallbackHref="/driver/messages"
      params={params}
    />
  );
}
