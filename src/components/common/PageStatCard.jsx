/**
 * Shared stat card used across all dashboard pages.
 * Matches the SummaryCard style from DashboardHome:
 * full gradient background, white text, frosted icon, decorative blob.
 */
export default function PageStatCard({ title, value, sub, icon, gradient }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br ${gradient} shadow-lg`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest opacity-80">{title}</p>
          <p className="mt-1 text-3xl font-black">{value}</p>
          {sub && <p className="mt-1 text-xs opacity-70">{sub}</p>}
        </div>
        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm text-white">
          {icon}
        </div>
      </div>
      {/* decorative blob */}
      <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-white/10" />
    </div>
  )
}
