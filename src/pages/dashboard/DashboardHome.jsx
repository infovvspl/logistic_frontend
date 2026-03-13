import { motion } from 'framer-motion'
import { FiClipboard, FiTruck, FiUsers } from 'react-icons/fi'
import { USE_MOCKS } from '../../utils/constants.js'

function StatCard({ icon, label, value, note }) {
  const Icon = icon
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-600">{label}</div>
        <Icon className="text-zinc-700" />
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {note ? <div className="mt-1 text-xs text-zinc-500">{note}</div> : null}
    </div>
  )
}

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Quick visibility into your fleet operations.
        </p>
        {USE_MOCKS ? (
          <p className="mt-2 text-xs text-emerald-600">
            Mock mode enabled via `VITE_USE_MOCKS=true`.
          </p>
        ) : null}
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0, y: 10 },
          show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } },
        }}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
        >
          <StatCard
            icon={FiUsers}
            label="Drivers"
            value="12"
            note="Active this month"
          />
        </motion.div>
        <motion.div
          variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
        >
          <StatCard icon={FiTruck} label="Vehicles" value="7" note="2 in maintenance" />
        </motion.div>
        <motion.div
          variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
        >
          <StatCard
            icon={FiClipboard}
            label="Assignments"
            value="19"
            note="Last 7 days"
          />
        </motion.div>
      </motion.div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="text-sm font-semibold">Next steps</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
          <li>Connect your API base URL via `VITE_API_BASE_URL`.</li>
          <li>Replace mock data in feature APIs with real endpoints.</li>
          <li>Add role-based permissions in `usePermissions`.</li>
        </ul>
      </div>
    </div>
  )
}
