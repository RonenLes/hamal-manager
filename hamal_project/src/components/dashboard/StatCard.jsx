export default function StatCard({ title, value, subtitle }) {
  return (
    <div className="bg-white rounded-xl shadow border p-4">
      <p className="text-sm text-gray-500">{title}</p>

      <h2 className="text-3xl font-bold mt-2">
        {value}
      </h2>

      {subtitle && (
        <p className="text-sm text-gray-500 mt-2">
          {subtitle}
        </p>
      )}
    </div>
  );
}