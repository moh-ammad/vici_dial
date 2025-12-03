export default function MetricCard({ title, value, color = 'blue' }) {
  const isEmpty = value === null || value === undefined;
  // Color palette tuned to match the dashboard image (image 3)
  const colorStyles = {
    // deep blue card (Total Campaigns blue)
    blue: 'bg-gradient-to-br from-sky-700 to-blue-600 text-white',
    // bright green card
    green: 'bg-gradient-to-br from-emerald-500 to-green-600 text-white',
    // dark slate / indigo card
    dark: 'bg-gradient-to-br from-slate-800 to-slate-700 text-white',
    // fallback purple (used elsewhere)
    purple: 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white',
    // keep older aliases for compatibility
    pink: 'bg-gradient-to-br from-pink-500 to-rose-600 text-white',
    orange: 'bg-gradient-to-br from-orange-500 to-amber-600 text-white',
    gray: 'bg-gradient-to-br from-slate-600 to-gray-700 text-white',
    indigo: 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white',
    cyan: 'bg-gradient-to-br from-cyan-500 to-teal-600 text-white',
    teal: 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white'
  }[color] || 'bg-white text-gray-900 border border-gray-200';

  return (
    <div className={`rounded-lg shadow-md p-6 ${colorStyles} hover:shadow-lg transition-all`}>
      <div className="text-sm font-medium opacity-90 mb-2">{title}</div>
      <div className="text-4xl font-bold">
        {isEmpty ? <span className="inline-block w-16 h-10 bg-white/20 rounded animate-pulse" /> : value}
      </div>
    </div>
  );
}
