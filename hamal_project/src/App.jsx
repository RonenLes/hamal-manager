import { useState } from "react";

import DashboardPage from "./pages/DashboardPage";
import MenuPage from "./pages/MenuPage";
import DriversPage from "./pages/DriversPage";
import BottomNav from "./components/layout/BottomNav";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  function renderPage() {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;

      case "menu":
        return <MenuPage onNavigate={setCurrentPage} />;

      case "drivers":
        return <DriversPage />;

      default:
        return <DashboardPage />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {renderPage()}

      <BottomNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />
    </div>
  );
}