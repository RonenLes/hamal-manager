export default function BottomNav({ currentPage, onNavigate }) {
  function getButtonClass(pageName) {
    const isActive = currentPage === pageName;

    return `flex flex-col items-center justify-center text-sm ${
      isActive ? "text-blue-600 font-bold" : "text-gray-500"
    }`;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
      <div className="relative mx-auto max-w-7xl h-16">

        {/* Home - center */}
        <button
          type="button"
          onClick={() => onNavigate("dashboard")}
          className={`${getButtonClass("dashboard")} absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}
        >
          <span className="text-2xl">⌂</span>
          <span>Home</span>
        </button>

        {/* Menu - right */}
        <button
          type="button"
          onClick={() => onNavigate("menu")}
          className={`${getButtonClass("menu")} absolute right-6 top-1/2 -translate-y-1/2`}
        >
          <span className="text-2xl">☰</span>
          <span>Menu</span>
        </button>

      </div>
    </nav>
  );
}