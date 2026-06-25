import ThemeProvider from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import ChatBot from "@/components/shared/ChatBot";

export default function DispatcherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-app text-main">
        <Navbar />
        {children}
        <ChatBot />
      </div>
    </ThemeProvider>
  );
}