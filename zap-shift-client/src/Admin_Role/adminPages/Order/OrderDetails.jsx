import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  User,
  Weight,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getAuth } from "firebase/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const OrderDetails = () => {
  const { id } = useParams();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchOrderDetails = async ({ isRefresh = false } = {}) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError("");

      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("You must be logged in.");
      }

      const token = await currentUser.getIdToken();

      const response = await fetch(`${API_BASE_URL}/admin/orders/${id}`, {
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

      setDetails(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setDetails(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  if (loading) {
    return <OrderDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-red-600">
          Failed to load order details
        </p>
        <p className="text-sm text-slate-500">{error}</p>
        <div className="flex gap-3">
          <Link
            to="/Md.Mesbhaul_Alam_Toha/orders"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back
          </Link>
          <button
            onClick={() => fetchOrderDetails()}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const order = details?.order || {};
  const payment = details?.payment || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/Md.Mesbhaul_Alam_Toha/orders"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
              Order Details
            </h2>
            <p className="text-sm text-slate-500">
              Complete parcel order information
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchOrderDetails({ isRefresh: true })}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          title="Order ID"
          value={order.trackingId || order._id || "N/A"}
          icon={<Package size={20} />}
        />
        <SummaryCard
          title="Delivery Charge"
          value={`৳ ${Number(order.cost || order.amountTaka || 0).toLocaleString()}`}
          icon={<CreditCard size={20} />}
        />
        <SummaryCard
          title="Status"
          value={order.deliveryStatus || "pending"}
          icon={<Package size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            Parcel Information
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoCard
              label="Order ID"
              value={order.trackingId || order._id || "N/A"}
              icon={<Package size={16} />}
            />
            <InfoCard
              label="Parcel Name"
              value={order.parcelName || "N/A"}
              icon={<Package size={16} />}
            />
            <InfoCard
              label="Parcel Type"
              value={
                order.type === "document"
                  ? "Document"
                  : order.type || order.parcelType || "N/A"
              }
              icon={<Package size={16} />}
            />
            <InfoCard
              label="Parcel Weight"
              value={
                order.parcelWeight
                  ? `${order.parcelWeight} kg`
                  : order.weight
                  ? `${order.weight} kg`
                  : "N/A"
              }
              icon={<Weight size={16} />}
            />
            <InfoCard
              label="Delivery Address"
              value={order.receiverAddress || order.address || "N/A"}
              icon={<MapPin size={16} />}
            />
            <InfoCard
              label="Delivery Charge"
              value={`৳ ${Number(order.cost || order.amountTaka || 0).toLocaleString()}`}
              icon={<CreditCard size={16} />}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge status={order.deliveryStatus || "pending"} />
            <PaymentBadge status={order.paymentStatus || "unpaid"} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            Sender & Receiver
          </h3>

          <div className="space-y-5">
            <div className="rounded-xl bg-slate-50 p-4">
              <h4 className="mb-3 font-semibold text-slate-800">Sender Information</h4>
              <div className="space-y-3">
                <InfoRow
                  icon={<User size={16} />}
                  label="Sender"
                  value={order.senderName || "N/A"}
                />
                <InfoRow
                  icon={<Phone size={16} />}
                  label="Sender Phone"
                  value={order.senderPhone || order.senderContact || "N/A"}
                />
                <InfoRow
                  icon={<MapPin size={16} />}
                  label="Sender Address"
                  value={order.senderAddress || "N/A"}
                />
                <InfoRow
                  icon={<Mail size={16} />}
                  label="User Email"
                  value={order.userEmail || "N/A"}
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <h4 className="mb-3 font-semibold text-slate-800">Receiver Information</h4>
              <div className="space-y-3">
                <InfoRow
                  icon={<User size={16} />}
                  label="Receiver"
                  value={order.receiverName || "N/A"}
                />
                <InfoRow
                  icon={<Phone size={16} />}
                  label="Receiver Phone"
                  value={order.receiverPhone || order.receiverContact || "N/A"}
                />
                <InfoRow
                  icon={<MapPin size={16} />}
                  label="Receiver Address"
                  value={order.receiverAddress || "N/A"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">
          Payment Information
        </h3>

        {payment ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              label="Transaction ID"
              value={payment.transactionId || "N/A"}
              icon={<CreditCard size={16} />}
            />
            <InfoCard
              label="Amount (BDT)"
              value={`৳ ${Number(payment.amountTaka || 0).toLocaleString()}`}
              icon={<CreditCard size={16} />}
            />
            <InfoCard
              label="Payment Method"
              value={payment.paymentMethod || "Card"}
              icon={<CreditCard size={16} />}
            />
            <InfoCard
              label="Paid At"
              value={formatDateTime(payment.paidAt)}
              icon={<CreditCard size={16} />}
            />
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            No payment record found for this order.
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{title}</p>
        <h3 className="mt-2 truncate text-lg font-bold text-slate-800 md:text-2xl">
          {value}
        </h3>
      </div>
      <div className="rounded-xl bg-blue-50 p-3 text-blue-600">{icon}</div>
    </div>
  </div>
);

const InfoCard = ({ label, value, icon }) => (
  <div className="rounded-xl bg-slate-50 p-4">
    <div className="flex items-center gap-2 text-slate-500">
      {icon}
      <p className="text-sm">{label}</p>
    </div>
    <h4 className="mt-2 break-words text-base font-semibold text-slate-800">
      {value}
    </h4>
  </div>
);

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-slate-500">{icon}</div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="break-words font-medium text-slate-800">{value}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const value = normalizeStatus(status);

  const styles =
    value === "completed"
      ? "bg-emerald-100 text-emerald-700"
      : value === "processing" ||
        value === "assigned" ||
        value === "shifted" ||
        value === "taken" ||
        value === "out for delivery"
      ? "bg-blue-100 text-blue-700"
      : "bg-amber-100 text-amber-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${styles}`}
    >
      {status}
    </span>
  );
};

const PaymentBadge = ({ status }) => {
  const value = String(status).toLowerCase();

  const styles =
    value === "paid" || value === "succeeded"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-red-100 text-red-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${styles}`}
    >
      {status}
    </span>
  );
};

const OrderDetailsSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="h-24 animate-pulse rounded-2xl bg-slate-100"
      />
    ))}
  </div>
);

const normalizeStatus = (status = "") => String(status).trim().toLowerCase();

const formatDateTime = (date) => {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleString();
  } catch {
    return "N/A";
  }
};