import MessagesPage from "@/components/messages/MessagesPage";

// Renders the dispatcher messages page component.
export default function DispatcherMessagesPage() {
  return <MessagesPage role="dispatcher" fallbackHref="/dispatcher/menu" />;
}
