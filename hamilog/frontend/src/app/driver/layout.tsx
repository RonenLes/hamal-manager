import ThemeProvider from "@/components/ThemeProvider";
import DriverNavbar from "@/components/driver/shared/DriverNavbar";

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
      </div>
    </ThemeProvider>
  );
}
