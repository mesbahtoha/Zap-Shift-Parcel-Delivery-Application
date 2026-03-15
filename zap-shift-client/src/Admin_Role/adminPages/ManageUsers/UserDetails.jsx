import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  Mail,
  Package,
  RefreshCw,
  User,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getAuth } from "firebase/auth";

// Base API URL – falls back to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const UserDetails = () => {
  const { id } = useParams(); // Get user ID from route params

  // State for user data, loading states, and errors
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /**
   * Fetches user details from the API.
   * @param {Object} options - Contains `isRefresh` to differentiate between initial load and refresh.
   */
  const fetchUserDetails = async ({ isRefresh = false } = {}) => {
    try {
      // Set appropriate loading state
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      // Get current Firebase user and ID token
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("You must be logged in.");

      const token = await currentUser.getIdToken();

      // API call
      const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
        method: "GET",
        headers: { authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || `Request failed with status ${response.status}`);
      }

      setDetails(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setDetails(null);
    } finally {
      // Reset loading states
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data when component mounts or `id` changes
  useEffect(() => {
    if (id) fetchUserDetails();
  }, [id]);

  // Memoized summary of user data, parcel history, and payment history
  const summary = useMemo(() => {
    const user = details?.user || {};
    const parcelHistory = details?.parcelHistory || [];
    const paymentHistory = details?.paymentHistory || [];

    const totalParcels = parcelHistory.length;
    const totalPaid = paymentHistory.reduce(
      (sum, item) => sum + Number(item.amountTaka || 0),
      0
    );

    return {
      user,
      totalParcels,
      totalPaid,
      parcelHistory,
      paymentHistory,
    };
  }, [details]);

  // Loading state – show skeleton
  if (loading) {
    return <UserDetailsSkeleton />;
  }

  // Error state – show error message with retry and back buttons
  if (error) {
    return (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-red-600">
          Failed to load user details
        </p>
        <p className="text-sm text-slate-500">{error}</p>
        <div className="flex gap-3">
          <Link
            to="/Md.Mesbhaul_Alam_Toha/manage-user"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back
          </Link>
          <button
            onClick={() => fetchUserDetails()}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Destructure summary for easy access
  const { user, totalParcels, totalPaid, parcelHistory, paymentHistory } = summary;

  return (
    <div className="space-y-5">
      {/* Header with back button, title, and refresh button */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/Md.Mesbhaul_Alam_Toha/manage-user"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Go back to user management"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
              User Details
            </h2>
            <p className="text-sm text-slate-500">
              Full account and activity overview
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchUserDetails({ isRefresh: true })}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          title="Total Parcels"
          value={totalParcels}
          icon={<Package size={20} />}
        />
        <SummaryCard
          title="Total Paid"
          value={`৳ ${totalPaid.toLocaleString()}`}
          icon={<CreditCard size={20} />}
        />
        <SummaryCard
          title="Account Status"
          value={user.status || "Active"}
          icon={<User size={20} />}
        />
      </div>

      {/* Main user info and status sections */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Left column: user profile and contact info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center gap-3">
            <Avatar
              src={user.picture || user.photoURL}
              alt={user.name || user.email || "User"}
              fallback={getInitials(user.name || user.email)}
            />
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                {user.name || "Unnamed User"}
              </h3>
              <p className="text-sm text-slate-500">{user.email || "N/A"}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoCard
              label="Full Name"
              value={user.name || "N/A"}
              icon={<User size={16} />}
            />
            <InfoCard
              label="Email"
              value={user.email || "N/A"}
              icon={<Mail size={16} />}
            />
            <InfoCard
              label="Joined"
              value={formatDate(user.created_at || user.createdAt)}
              icon={<User size={16} />}
            />
            <InfoCard
              label="Last Login"
              value={formatDateTime(user.last_login)}
              icon={<User size={16} />}
            />
          </div>
        </div>

        {/* Right column: status and quick stats */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">
            Account Status
          </h3>
          <div className="mt-4">
            <StatusBadge status={user.status || "active"} />
          </div>

          <div className="mt-5 space-y-3">
            <QuickMeta label="Role" value={user.role || "user"} />
            <QuickMeta label="Total Parcels" value={totalParcels} />
            <QuickMeta
              label="Total Paid"
              value={`৳ ${totalPaid.toLocaleString()}`}
            />
          </div>
        </div>
      </div>

      {/* Parcel and payment history tables */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Parcel History */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-800">
              Parcel History
            </h3>
            <p className="text-sm text-slate-500">Recent parcel activity</p>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-4">
            {parcelHistory.length === 0 ? (
              <EmptyState message="No parcel history found." />
            ) : (
              <div className="space-y-3">
                {parcelHistory.map((parcel) => (
                  <div
                    key={parcel._id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {parcel.trackingId || parcel._id}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Receiver: {parcel.receiverName || "N/A"}
                        </p>
                        <p className="text-sm text-slate-500">
                          Created: {formatDateTime(parcel.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={parcel.deliveryStatus || "pending"} />
                        <PaymentBadge status={parcel.paymentStatus || "unpaid"} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-800">
              Payment History
            </h3>
            <p className="text-sm text-slate-500">Recent payment records</p>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-4">
            {paymentHistory.length === 0 ? (
              <EmptyState message="No payment history found." />
            ) : (
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div
                    key={payment._id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">
                          Transaction: {payment.transactionId || "N/A"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Amount: ৳{" "}
                          {Number(payment.amountTaka || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-500">
                          Paid At: {formatDateTime(payment.paidAt)}
                        </p>
                      </div>
                      <PaymentBadge status={payment.status || "pending"} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== Helper Components ====================

/**
 * Avatar component with fallback on error.
 */
const Avatar = ({ src, alt, fallback }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-lg font-bold text-blue-700">
      {src && !imgError ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        fallback
      )}
    </div>
  );
};

/**
 * Card for displaying a summary statistic.
 */
const SummaryCard = ({ title, value, icon }) => (
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

/**
 * Card for displaying a piece of user information.
 */
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

/**
 * Simple key-value display (used in the status column).
 */
const QuickMeta = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 p-4">
    <p className="text-sm text-slate-500">{label}</p>
    <h4 className="mt-1 text-base font-semibold text-slate-800">{value}</h4>
  </div>
);

/**
 * Badge for user/parcel status with appropriate colors.
 */
const StatusBadge = ({ status }) => {
  const value = String(status).toLowerCase();

  // Define color styles based on status value
  const styles =
    value === "active" || value === "completed"
      ? "bg-emerald-100 text-emerald-700"
      : value === "blocked"
      ? "bg-red-100 text-red-700"
      : value === "pending"
      ? "bg-amber-100 text-amber-700"
      : value === "assigned" || value === "shifted" || value === "taken"
      ? "bg-blue-100 text-blue-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${styles}`}
    >
      {status}
    </span>
  );
};

/**
 * Badge for payment status (paid/succeeded vs others).
 */
const PaymentBadge = ({ status }) => {
  const value = String(status).toLowerCase();

  const styles =
    value === "paid" || value === "succeeded"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-amber-100 text-amber-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${styles}`}
    >
      {status}
    </span>
  );
};

/**
 * Placeholder for empty lists.
 */
const EmptyState = ({ message }) => (
  <div className="flex min-h-[220px] items-center justify-center text-center">
    <p className="text-sm text-slate-500">{message}</p>
  </div>
);

/**
 * Skeleton loader for the initial loading state.
 */
const UserDetailsSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="h-24 animate-pulse rounded-2xl bg-slate-100"
      />
    ))}
  </div>
);

// ==================== Helper Functions ====================

/**
 * Extracts initials from a name (first two letters of first two words).
 */
const getInitials = (text = "") => {
  return text
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
};

/**
 * Formats a date to locale date string (e.g., "4/15/2025").
 */
const formatDate = (date) => {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return "N/A";
  }
};

/**
 * Formats a date to locale date and time string.
 */
const formatDateTime = (date) => {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleString();
  } catch {
    return "N/A";
  }
};