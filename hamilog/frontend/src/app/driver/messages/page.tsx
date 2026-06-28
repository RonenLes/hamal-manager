import MessagesPage from "@/components/messages/MessagesPage";

// Renders the driver messages page component.
export default function DriverMessagesPage() {
  return <MessagesPage role="driver" fallbackHref="/driver/menu" />;
}
