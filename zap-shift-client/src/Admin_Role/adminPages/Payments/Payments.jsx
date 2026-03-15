import { useEffect, useMemo, useState } from "react";
import { CreditCard, RefreshCw, Search, Wallet } from "lucide-react";
import { getAuth } from "firebase/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const Payments = () => {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalCashIn: 0,
    paidCount: 0,
    pendingAdminReceive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [receivingId, setReceivingId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText.trim().toLowerCase());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchPayments = async ({ isRefresh = false } = {}) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError("");
      setSuccessMessage("");

      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("You must be logged in.");
      }

      const token = await currentUser.getIdToken();

      const response = await fetch(`${API_BASE_URL}/admin/payments`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || `Request failed with status ${response.status}`
        );
      }

      setPayments(Array.isArray(data?.payments) ? data.payments : []);
      setSummary(
        data?.summary || {
          totalCashIn: 0,
          paidCount: 0,
          pendingAdminReceive: 0,
        }
      );
    } catch (err) {
      setError(err.message || "Something went wrong");
      setPayments([]);
      setSummary({
        totalCashIn: 0,
        paidCount: 0,
        pendingAdminReceive: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    if (!debouncedSearch) return payments;

    return payments.filter((payment) => {
      const parcel = payment.parcel || {};
      const fields = [
        payment.transactionId,
        payment.email,
        payment.paymentMethod,
        parcel.trackingId,
        parcel.parcelName,
        parcel.senderName,
        parcel.receiverName,
      ];

      return fields.some((field) =>
        String(field || "").toLowerCase().includes(debouncedSearch)
      );
    });
  }, [payments, debouncedSearch]);

  const uiStats = useMemo(() => {
    return {
      totalRows: filteredPayments.length,
      totalCashIn: filteredPayments.reduce(
        (sum, item) => sum + Number(item.amountTaka || 0),
        0
      ),
      pendingReceive: filteredPayments.filter(
        (item) => item.cashInStatus === "pending_admin_receive"
      ).length,
    };
  }, [filteredPayments]);

  const handleReceivePayment = async (paymentId) => {
    try {
      setReceivingId(paymentId);
      setError("");
      setSuccessMessage("");

      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("You must be logged in.");
      }

      const token = await currentUser.getIdToken();

      const response = await fetch(
        `${API_BASE_URL}/admin/payments/${paymentId}/receive`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || `Request failed with status ${response.status}`
        );
      }

      setPayments((prev) =>
        prev.map((payment) =>
          payment._id === paymentId
            ? {
                ...payment,
                cashInStatus: "received_by_admin",
                cashReceivedAt: new Date().toISOString(),
              }
            : payment
        )
      );

      setSummary((prev) => ({
        ...prev,
        pendingAdminReceive: Math.max(
          0,
          Number(prev.pendingAdminReceive || 0) - 1
        ),
      }));

      setSuccessMessage("Payment marked as received successfully.");
    } catch (err) {
      setError(err.message || "Failed to receive payment");
    } finally {
      setReceivingId("");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
            Payment Receive
          </h2>
          <p className="text-sm text-slate-500">
            Receive parcel payment and calculate total amount
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by parcel, sender, receiver..."
              className="w-full bg-transparent text-sm outline-none sm:w-72"
            />
          </div>

          <button
            onClick={() => fetchPayments({ isRefresh: true })}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          title="Total Cash In"
          value={`৳ ${Number(summary.totalCashIn || 0).toLocaleString()}`}
          icon={<Wallet size={20} />}
        />
        <StatCard
          title="Successful Payments"
          value={summary.paidCount || 0}
          icon={<CreditCard size={20} />}
        />
        <StatCard
          title="Pending Receive"
          value={summary.pendingAdminReceive || 0}
          icon={<RefreshCw size={20} />}
        />
        <StatCard
          title="Filtered Results"
          value={uiStats.totalRows}
          icon={<Search size={20} />}
        />
      </div>

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-800">
            Payment Records
          </h3>
          <p className="text-sm text-slate-500">
            Parcel payment list with sender and receiver details
          </p>
        </div>

        {loading ? (
          <PaymentSkeleton />
        ) : filteredPayments.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-4 py-10 text-center">
            <p className="text-base font-semibold text-slate-700">
              No payment records found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try a different keyword or refresh the list.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 md:p-5">
            {filteredPayments.map((payment) => {
              const parcel = payment.parcel || {};
              const deliveryCharge = Number(
                parcel.deliveryCharge || parcel.cost || payment.amountTaka || 0
              );
              const extraCharge = Number(parcel.extraCharge || 0);
              const totalAmount = Number(payment.amountTaka || 0) || deliveryCharge + extraCharge;
              const receivedByAdmin =
                payment.cashInStatus === "received_by_admin";
              const isReceiving = receivingId === payment._id;

              return (
                <div
                  key={payment._id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                >
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
                    <InfoBox
                      label="Parcel ID"
                      value={parcel.trackingId || parcel._id || payment.parcelId || "N/A"}
                    />
                    <InfoBox
                      label="Parcel Name"
                      value={parcel.parcelName || "N/A"}
                    />
                    <InfoBox
                      label="Sender"
                      value={parcel.senderName || "N/A"}
                    />
                    <InfoBox
                      label="Receiver"
                      value={parcel.receiverName || "N/A"}
                    />
                    <InfoBox
                      label="Delivery"
                      value={`৳ ${deliveryCharge.toLocaleString()}`}
                    />
                    <InfoBox
                      label="Extra"
                      value={`৳ ${extraCharge.toLocaleString()}`}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
                    <InfoBox
                      label="Total"
                      value={`৳ ${totalAmount.toLocaleString()}`}
                    />
                    <InfoBox
                      label="Transaction ID"
                      value={payment.transactionId || "N/A"}
                    />
                    <InfoBox
                      label="User Email"
                      value={payment.email || "N/A"}
                    />
                    <InfoBox
                      label="Payment Method"
                      value={payment.paymentMethod || "Card"}
                    />
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        status={payment.status || "pending"}
                        type="payment"
                      />
                      <StatusBadge
                        status={
                          receivedByAdmin ? "received by admin" : "pending receive"
                        }
                        type="cash"
                      />
                    </div>

                    <button
                      onClick={() => handleReceivePayment(payment._id)}
                      disabled={receivedByAdmin || isReceiving}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {receivedByAdmin
                        ? "Received"
                        : isReceiving
                        ? "Receiving..."
                        : "Receive Payment"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const InfoBox = ({ label, value }) => (
  <div className="rounded-xl bg-white p-3">
    <p className="text-xs text-slate-500">{label}</p>
    <h4 className="mt-1 break-words text-sm font-semibold text-slate-800">
      {value}
    </h4>
  </div>
);

const StatCard = ({ title, value, icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <h3 className="mt-2 text-2xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className="rounded-xl bg-blue-50 p-3 text-blue-600">{icon}</div>
    </div>
  </div>
);

const StatusBadge = ({ status, type = "payment" }) => {
  const value = String(status).toLowerCase();

  let styles = "bg-slate-100 text-slate-700";

  if (type === "payment") {
    styles =
      value === "paid" || value === "succeeded"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-amber-100 text-amber-700";
  }

  if (type === "cash") {
    styles =
      value === "received by admin"
        ? "bg-blue-100 text-blue-700"
        : "bg-amber-100 text-amber-700";
  }

  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-sm font-medium capitalize ${styles}`}
    >
      {status}
    </span>
  );
};

const PaymentSkeleton = () => (
  <div className="p-4 md:p-5">
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-40 animate-pulse rounded-2xl bg-slate-100"
        />
      ))}
    </div>
  </div>
);