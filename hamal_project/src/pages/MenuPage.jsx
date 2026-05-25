const menuItems = [
  {
    title: "Drivers",
    description: "View all registered drivers",
    page: "drivers",
  },
];

export default function MenuPage({ onNavigate }) {
  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold mb-2">Menu</h1>

        <p className="text-gray-500 mb-6">
          Choose a section to manage
        </p>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className="text-left bg-white rounded-xl shadow border p-5 hover:shadow-md transition"
            >
              <h2 className="text-lg font-bold mb-2">
                {item.title}
              </h2>

              <p className="text-sm text-gray-500">
                {item.description}
              </p>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}