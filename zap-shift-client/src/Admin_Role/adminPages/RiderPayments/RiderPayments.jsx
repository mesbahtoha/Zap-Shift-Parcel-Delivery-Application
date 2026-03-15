import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, CreditCard } from "lucide-react";
import { getAuth } from "firebase/auth";

const API_BASE_URL = "http://localhost:3000";

const getToken = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must login first.");
  }

  return await currentUser.getIdToken();
};

export const RiderPAyments = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingRider, setPayingRider] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchText, setSearchText] = useState("");

  const fetchRiderPayments = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setSuccessMessage("");

      const token = await getToken();

      const res = await fetch(`${API_BASE_URL}/admin/rider-payments`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load rider payments");
      }

      setRiders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load rider payments");
      setRiders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRiderPayments();
  }, []);

  const handlePayNow = async (riderEmail) => {
    try {
      if (!riderEmail) {
        setError("Rider email is missing.");
        return;
      }

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

      setSuccessMessage(
        `Payment completed for ${riderEmail}. Paid now: ৳ ${data?.totalPaidNow || 0}`
      );

      await fetchRiderPayments(true);
    } catch (err) {
      setError(err.message || "Failed to pay rider");
    } finally {
      setPayingRider("");
    }
  };

  const filteredRiders = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    if (!q) return riders;

    return riders.filter((rider) =>
      [
        rider.riderName,
        rider.riderEmail,
        rider.approvalStatus,
        rider.workStatus,
        rider.hub,
        rider.region,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [riders, searchText]);

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

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading rider payments...
      </div>
    );
  }

  return (
    <div className="space-y-5">
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard label="Completed Parcels" value={summary.completed} />
        <SummaryCard label="Total Earnings" value={`৳ ${summary.total}`} />
        <SummaryCard label="Paid Amount" value={`৳ ${summary.paid}`} />
        <SummaryCard label="Due Amount" value={`৳ ${summary.due}`} highlight />
      </div>

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

const InfoBox = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 p-3">
    <p className="text-xs text-slate-500">{label}</p>
    <h4 className="mt-1 text-sm font-semibold text-slate-800">{value}</h4>
  </div>
);

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