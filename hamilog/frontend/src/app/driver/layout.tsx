import ThemeProvider from "@/components/ThemeProvider";
import DriverNavbar from "@/components/driver/shared/DriverNavbar";
import ChatBot from "@/components/shared/ChatBot";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-app text-main">
        <DriverNavbar />
        {children}
        <ChatBot />
      </div>
    </ThemeProvider>
  );
}
