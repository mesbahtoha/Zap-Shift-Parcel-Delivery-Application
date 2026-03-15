import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAuth from "../../../hooks/useAuth";
import useAxiosSecure from "../../../hooks/useAxiosSecure";

// ─────────────────────────────────────────────
// Shared query keys — export so RiderPayments
// (admin) can call invalidateQueries on them
// after paying a rider.
// ─────────────────────────────────────────────
export const riderEarningsSummaryKey = (email) => ["rider-earnings-summary", email];
export const riderEarningsKey        = (email) => ["rider-earnings", email];

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
const EarningsCard = ({ title, value, accent }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <p className="text-sm text-gray-500">{title}</p>
    <h3 className={`mt-2 text-3xl font-bold ${accent ?? "text-[#083c46]"}`}>
      {typeof value === "number" ? `৳ ${value}` : value}
    </h3>
  </div>
);

const StatusBadge = ({ status }) => {
  const isPaid = status === "paid";
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize
        ${isPaid
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700"}`}
    >
      {status || "unpaid"}
    </span>
  );
};

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const RiderEarnings = () => {
  const { user }      = useAuth();
  const axiosSecure   = useAxiosSecure();
  const queryClient   = useQueryClient();

  // ── Earnings summary ─────────────────────────
  // ✅ refetchInterval: 10s — auto-refreshes when
  //    admin pays the rider from the admin panel
  const {
    data: summary = null,
    isLoading: summaryLoading,
    isFetching: summaryFetching,
  } = useQuery({
    queryKey: riderEarningsSummaryKey(user?.email),
    queryFn: async () => {
      const res = await axiosSecure.get(`/rider-earnings-summary/${user.email}`);
      return res.data || null;
    },
    enabled:              !!user?.email,
    refetchInterval:      10_000,  // ✅ poll every 10s
    refetchOnWindowFocus: true,
    staleTime:            0,
  });

  // ── Earnings history ─────────────────────────
  const {
    data: earnings = [],
    isLoading: earningsLoading,
    isFetching: earningsFetching,
    isError,
  } = useQuery({
    queryKey: riderEarningsKey(user?.email),
    queryFn: async () => {
      const res = await axiosSecure.get(`/rider-earnings/${user.email}`);
      return res.data || [];
    },
    enabled:              !!user?.email,
    refetchInterval:      10_000,  // ✅ poll every 10s
    refetchOnWindowFocus: true,
    staleTime:            0,
  });

  const isSyncing = summaryFetching || earningsFetching;

  if (summaryLoading || earningsLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <span className="loading loading-spinner loading-lg text-lime-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live
        </span>
        {isSyncing && (
          <span className="text-xs text-slate-400">Syncing…</span>
        )}
      </div>

      {isError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">
          Failed to load earnings data.
        </p>
      )}

      {/* ── Summary cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <EarningsCard
          title="Total Earnings"
          value={summary?.totalEarnings ?? 0}
        />
        <EarningsCard
          title="Paid Earnings"
          value={summary?.paidEarnings ?? 0}
          accent="text-emerald-600"
        />
        <EarningsCard
          title="Unpaid Earnings"
          value={summary?.unpaidEarnings ?? 0}
          accent="text-amber-600"
        />
        <EarningsCard
          title="Total Records"
          value={summary?.totalRecords ?? 0}
          accent="text-slate-600"
        />
      </div>

      {/* ── Earnings history table ── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-[#083c46]">Earnings History</h2>
          <p className="mt-1 text-sm text-gray-500">
            Detailed earning records from your deliveries.
          </p>
        </div>

        {earnings.length === 0 ? (
          <p className="text-sm text-gray-500">No earnings history found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="text-gray-500">
                  <th>Tracking ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((item) => (
                  <tr key={item._id}>
                    <td className="font-mono text-sm font-medium">
                      {item.trackingId || item.parcelId || "N/A"}
                    </td>
                    <td className="font-semibold">৳ {item.amount ?? 0}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="text-sm text-slate-500">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("en-BD", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </td>
                    <td className="text-sm text-slate-500">
                      {item.note || "Delivery commission"}
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

export default RiderEarnings;