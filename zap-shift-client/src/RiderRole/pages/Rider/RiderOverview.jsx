import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { FiCheckCircle, FiClock, FiDollarSign, FiTruck } from "react-icons/fi";
import useAuth from "../../../hooks/useAuth";
import useAxiosSecure from "../../../hooks/useAxiosSecure";

// ─────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────
const StatCard = ({ title, value, icon, subtitle, accent }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h3 className={`mt-2 text-3xl font-bold ${accent ?? "text-[#083c46]"}`}>
          {value}
        </h3>
        {subtitle && <p className="mt-2 text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className="rounded-xl bg-lime-100 p-3 text-lime-700">{icon}</div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────
const STATUS_STYLE = {
  assigned:           "bg-indigo-100 text-indigo-700",
  taken:              "bg-blue-100 text-blue-700",
  shifted:            "bg-violet-100 text-violet-700",
  "out for delivery": "bg-amber-100 text-amber-700",
  completed:          "bg-emerald-100 text-emerald-700",
  cancelled:          "bg-red-100 text-red-700",
};

const StatusBadge = ({ status }) => (
  <span
    className={`rounded-full px-3 py-1 text-xs font-medium capitalize
      ${STATUS_STYLE[status] ?? "bg-gray-100 text-gray-700"}`}
  >
    {status?.replace(/_/g, " ")}
  </span>
);

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const RiderOverview = () => {
  const { user }    = useAuth();
  const axiosSecure = useAxiosSecure();

  // ─────────────────────────────────────────
  // ✅ KEY INSIGHT: This queryKey ["rider-tasks", email] is the SAME key
  //    used in RiderTasks.jsx. When the rider updates a task status,
  //    RiderTasks calls queryClient.invalidateQueries(["rider-tasks", email])
  //    which ALSO invalidates this query — so counts update instantly
  //    without any extra wiring.
  // ─────────────────────────────────────────
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    isError: tasksError,
    isFetching: tasksFetching,
  } = useQuery({
    queryKey: ["rider-tasks", user?.email],
    queryFn: async () => {
      const res = await axiosSecure.get(`/rider-tasks/rider/${user.email}`);
      return res.data || [];
    },
    enabled:              !!user?.email,
    refetchInterval:      10_000,  // poll every 10s
    refetchOnWindowFocus: true,    // re-fetch on tab focus
    staleTime:            0,       // always treat as stale → invalidation fires instantly
  });

  // ── Earnings summary ─────────────────────
  const {
    data: summary = null,
    isLoading: earningsLoading,
  } = useQuery({
    queryKey: ["rider-earnings-summary", user?.email],
    queryFn: async () => {
      const res = await axiosSecure.get(`/rider-earnings-summary/${user.email}`);
      return res.data || null;
    },
    enabled:              !!user?.email,
    refetchInterval:      30_000,
    refetchOnWindowFocus: true,
  });

  // ── Stats ────────────────────────────────
  const stats = useMemo(() => ({
    assigned: tasks.filter((t) => t.status === "assigned").length,

    inTransit: tasks.filter((t) =>
      ["taken", "shifted", "out for delivery"].includes(t.status)
    ).length,

    // ✅ "completed" — correct backend status
    completed: tasks.filter((t) => t.status === "completed").length,

    totalEarnings:  summary?.totalEarnings  ?? 0,
    paidEarnings:   summary?.paidEarnings   ?? 0,
    unpaidEarnings: summary?.unpaidEarnings ?? 0,
  }), [tasks, summary]);

  const recentTasks = tasks.slice(0, 5);

  if (tasksLoading || earningsLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <span className="loading loading-spinner loading-lg text-lime-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Live sync indicator */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live
        </span>
        {tasksFetching && (
          <span className="text-xs text-slate-400">Syncing…</span>
        )}
      </div>

      {tasksError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">
          Failed to load rider overview.
        </p>
      )}

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Assigned Tasks"
          value={stats.assigned}
          subtitle="Waiting to start"
          icon={<FiClock size={22} />}
        />
        <StatCard
          title="In Transit"
          value={stats.inTransit}
          subtitle="Taken · Shifted · Out for delivery"
          icon={<FiTruck size={22} />}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          subtitle="Successfully delivered"
          accent="text-emerald-600"
          icon={<FiCheckCircle size={22} />}
        />
        <StatCard
          title="Total Earnings"
          value={`৳ ${stats.totalEarnings}`}
          subtitle={`Paid ৳${stats.paidEarnings} · Due ৳${stats.unpaidEarnings}`}
          icon={<FiDollarSign size={22} />}
        />
      </div>

      {/* ── Recent tasks table ── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#083c46]">Recent Tasks</h2>
          <p className="text-sm text-gray-500">
            Your latest assigned and active deliveries.
          </p>
        </div>

        {recentTasks.length === 0 ? (
          <p className="text-sm text-gray-500">No task data available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="text-gray-500">
                  <th>Tracking ID</th>
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task) => (
                  <tr key={task._id}>
                    <td className="font-mono text-sm font-medium">
                      {task.trackingId || task.parcelId}
                    </td>
                    <td>{task.customerName || "N/A"}</td>
                    <td>
                      {task.deliveryLocation || task.pickupLocation || "N/A"}
                    </td>
                    <td>
                      <StatusBadge status={task.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderOverview;