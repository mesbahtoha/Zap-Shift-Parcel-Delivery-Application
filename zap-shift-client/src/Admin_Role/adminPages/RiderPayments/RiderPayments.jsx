import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, CreditCard } from "lucide-react";
import { getAuth } from "firebase/auth";

// Base API URL – you may want to replace this with an environment variable later
const API_BASE_URL = "http://localhost:3000";

/**
 * Retrieves the current Firebase user's ID token.
 * @throws {Error} If no user is logged in.
 */
const getToken = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("You must login first.");
  }
  return await currentUser.getIdToken();
};

export const RiderPAyments = () => {
  // ── State ───────────────────────────────────────────────────────────────
  const [riders, setRiders] = useState([]);               // List of riders with payment data
  const [loading, setLoading] = useState(true);           // Initial loading
  const [refreshing, setRefreshing] = useState(false);    // Refresh indicator (manual refresh)
  const [payingRider, setPayingRider] = useState("");     // Email of rider currently being paid (for button state)
  const [error, setError] = useState("");                  // Error message
  const [successMessage, setSuccessMessage] = useState(""); // Success message after payment
  const [searchText, setSearchText] = useState("");        // Search input

  // ── Fetch rider payments from API ───────────────────────────────────────
  const fetchRiderPayments = async (showRefreshLoader = false) => {
    try {
      // Set the appropriate loading indicator
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Clear previous messages
      setError("");
      setSuccessMessage("");

      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/admin/rider-payments`, {
        headers: { authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load rider payments");
      }

      // Ensure data is an array (API might return an object on error)
      setRiders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load rider payments");
      setRiders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchRiderPayments();
  }, []);

  // ── Handle "Pay Now" button click ───────────────────────────────────────
  const handlePayNow = async (riderEmail) => {
    try {
      if (!riderEmail) {
        setError("Rider email is missing.");
        return;
      }

      // Set paying state for this rider (disables button)
      setPayingRider(riderEmail);
      setError("");
      setSuccessMessage("");

      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/admin/rider-payments/pay`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ riderEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to pay rider");
      }

      // Show success message with the amount paid
      setSuccessMessage(
        `Payment completed for ${riderEmail}. Paid now: ৳ ${data?.totalPaidNow || 0}`
      );

      // Refresh the list to reflect updated due/paid amounts
      await fetchRiderPayments(true);
    } catch (err) {
      setError(err.message || "Failed to pay rider");
    } finally {
      setPayingRider(""); // Clear paying state
    }
  };

  // ── Filter riders based on search text ───────────────────────────────────
  const filteredRiders = useMemo(() => {
    const searchTerm = searchText.trim().toLowerCase();
    if (!searchTerm) return riders;

    return riders.filter((rider) =>
      // Search across several fields (ignore undefined/null)
      [
        rider.riderName,
        rider.riderEmail,
        rider.approvalStatus,
        rider.workStatus,
        rider.hub,
        rider.region,
      ]
        .filter(Boolean) // Remove falsy values
        .some((value) => String(value).toLowerCase().includes(searchTerm))
    );
  }, [riders, searchText]);

  // ── Calculate summary totals for the filtered riders ────────────────────
  const summary = useMemo(() => {
    return filteredRiders.reduce(
      (acc, rider) => {
        acc.completed += Number(rider.completedParcels || 0);
        acc.total += Number(rider.totalPayment || 0);
        acc.paid += Number(rider.paidAmount || 0);
        acc.due += Number(rider.dueAmount || 0);
        return acc;
      },
      { completed: 0, total: 0, paid: 0, due: 0 }
    );
  }, [filteredRiders]);

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading rider payments...
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header with title and refresh button */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
            Rider Payments
          </h2>
          <p className="text-sm text-slate-500">
            Calculate due earnings and complete rider payments
          </p>
        </div>

        <button
          onClick={() => fetchRiderPayments(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Error and success alerts */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* Summary cards (totals for filtered riders) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard label="Completed Parcels" value={summary.completed} />
        <SummaryCard label="Total Earnings" value={`৳ ${summary.total}`} />
        <SummaryCard label="Paid Amount" value={`৳ ${summary.paid}`} />
        <SummaryCard label="Due Amount" value={`৳ ${summary.due}`} highlight />
      </div>

      {/* Search input */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by rider name, email, region, hub..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* List of riders */}
      <div className="grid grid-cols-1 gap-4">
        {filteredRiders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            No rider payment data found
          </div>
        ) : (
          filteredRiders.map((rider) => {
            const riderEmail = rider.riderEmail || "";
            const dueAmount = Number(rider.dueAmount || 0);
            const isPaying = payingRider === riderEmail;

            return (
              <div
                key={riderEmail}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                {/* Rider header with name, email, and status badges */}
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      {rider.riderName || "Unnamed Rider"}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {rider.riderEmail || "No email"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge
                      label={rider.approvalStatus || "unknown"}
                      type={
                        rider.approvalStatus === "approved"
                          ? "success"
                          : rider.approvalStatus === "pending"
                          ? "warning"
                          : "default"
                      }
                    />
                    <StatusBadge
                      label={rider.workStatus || "unknown"}
                      type={
                        rider.workStatus === "free"
                          ? "success"
                          : rider.workStatus === "busy"
                          ? "warning"
                          : "default"
                      }
                    />
                  </div>
                </div>

                {/* Rider statistics */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                  <InfoBox
                    label="Completed Parcels"
                    value={rider.completedParcels || 0}
                  />
                  <InfoBox
                    label="Total Earnings"
                    value={`৳ ${Number(rider.totalPayment || 0)}`}
                  />
                  <InfoBox
                    label="Paid Amount"
                    value={`৳ ${Number(rider.paidAmount || 0)}`}
                  />
                  <InfoBox
                    label="Due Amount"
                    value={`৳ ${Number(rider.dueAmount || 0)}`}
                  />
                  <InfoBox
                    label="Approval"
                    value={rider.approvalStatus || "N/A"}
                  />
                </div>

                {/* Pay button */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handlePayNow(riderEmail)}
                    disabled={dueAmount <= 0 || isPaying}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CreditCard size={16} />
                    {isPaying ? "Paying..." : dueAmount <= 0 ? "No Due" : "Pay Now"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ==================== Helper Components ====================

/**
 * Card for displaying a summary statistic (used in the top row).
 * @param {string} label - Description of the statistic.
 * @param {string|number} value - The value to display.
 * @param {boolean} highlight - If true, applies a different background (for "Due Amount").
 */
const SummaryCard = ({ label, value, highlight = false }) => (
  <div
    className={`rounded-2xl border p-4 shadow-sm ${
      highlight
        ? "border-amber-200 bg-amber-50"
        : "border-slate-200 bg-white"
    }`}
  >
    <p className="text-xs text-slate-500">{label}</p>
    <h4 className="mt-1 text-lg font-semibold text-slate-800">{value}</h4>
  </div>
);

/**
 * Small box for displaying a single piece of rider data.
 */
const InfoBox = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 p-3">
    <p className="text-xs text-slate-500">{label}</p>
    <h4 className="mt-1 text-sm font-semibold text-slate-800">{value}</h4>
  </div>
);

/**
 * Status badge with predefined styles based on the `type` prop.
 * @param {string} label - Text to display inside the badge.
 * @param {'success'|'warning'|'default'} type - Determines the badge color.
 */
const StatusBadge = ({ label, type = "default" }) => {
  const styles = {
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    default: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[type] || styles.default
      }`}
    >
      {label}
    </span>
  );
};