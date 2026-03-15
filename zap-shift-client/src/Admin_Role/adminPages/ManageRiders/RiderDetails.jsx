import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, UserCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getAuth } from "firebase/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const RiderDetails = () => {
  const { id: riderId } = useParams();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchRiderDetails = async ({ isRefresh = false } = {}) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError("");

      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("You must be logged in.");
      }

      const token = await currentUser.getIdToken();

      const response = await fetch(`${API_BASE_URL}/admin/riders/${riderId}`, {
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
    if (riderId) {
      fetchRiderDetails();
    }
  }, [riderId]);

  if (loading) {
    return <RiderDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-red-600">
          Failed to load rider details
        </p>
        <p className="text-sm text-slate-500">{error}</p>
        <div className="flex gap-3">
          <Link
            to="/Md.Mesbhaul_Alam_Toha/manage-rider"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back
          </Link>
          <button
            onClick={() => fetchRiderDetails()}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const rider = details?.rider || {};
  const tasks = details?.tasks || [];
  const earnings = details?.earnings || [];

  const totalEarnings = earnings.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/Md.Mesbhaul_Alam_Toha/manage-rider"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
              Rider Details
            </h2>
            <p className="text-sm text-slate-500">
              Full rider profile information
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchRiderDetails({ isRefresh: true })}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Tasks" value={tasks.length} icon={<UserCheck size={20} />} />
        <StatCard
          title="Earnings"
          value={`৳ ${totalEarnings.toLocaleString()}`}
          icon={<UserCheck size={20} />}
        />
        <StatCard
          title="Approval"
          value={capitalizeText(rider.approvalStatus || "pending")}
          icon={<UserCheck size={20} />}
        />
        <StatCard
          title="Work Status"
          value={capitalizeText(rider.workStatus || "free")}
          icon={<UserCheck size={20} />}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <Avatar
            src={rider.picture || rider.photoURL}
            alt={rider.name || rider.email || "Rider"}
            fallback={getInitials(rider.name || rider.email)}
            size="h-16 w-16 text-xl"
          />
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {rider.name || "Unnamed Rider"}
            </h3>
            <p className="text-sm text-slate-500">{rider.email || "N/A"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Name" value={rider.name || "N/A"} />
          <Info label="Email" value={rider.email || "N/A"} />
          <Info label="Phone" value={rider.phone || "N/A"} />
          <Info label="Address / Region" value={rider.region || "N/A"} />
          <Info label="Hub" value={rider.hub || "N/A"} />
          <Info label="Vehicle" value={rider.vehicleType || "N/A"} />
          <Info label="NID" value={rider.nid || "N/A"} />
          <Info label="Age" value={rider.age || "N/A"} />
          <Info
            label="Approval Status"
            value={capitalizeText(rider.approvalStatus || "pending")}
          />
          <Info
            label="Work Status"
            value={capitalizeText(rider.workStatus || "free")}
          />
          <Info
            label="Joined"
            value={formatDate(rider.created_at || rider.createdAt)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-800">Recent Tasks</h3>
            <p className="text-sm text-slate-500">Latest rider task history</p>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-4">
            {tasks.length === 0 ? (
              <EmptyState message="No task history found." />
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-800">
                      Parcel: {task.parcelId || "N/A"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Pickup: {task.pickupLocation || "N/A"}
                    </p>
                    <p className="text-sm text-slate-500">
                      Delivery: {task.deliveryLocation || "N/A"}
                    </p>
                    <div className="mt-3">
                      <StatusBadge status={task.status || "assigned"} type="approval" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-800">Earnings</h3>
            <p className="text-sm text-slate-500">Recent rider earning history</p>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-4">
            {earnings.length === 0 ? (
              <EmptyState message="No earning history found." />
            ) : (
              <div className="space-y-3">
                {earnings.map((earning) => (
                  <div
                    key={earning._id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-semibold text-slate-800">
                      Parcel: {earning.parcelId || "N/A"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Amount: ৳ {Number(earning.amount || 0).toLocaleString()}
                    </p>
                    <div className="mt-3">
                      <StatusBadge status={earning.status || "unpaid"} type="work" />
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

const Avatar = ({ src, alt, fallback, size = "h-11 w-11 text-sm" }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-full bg-blue-100 font-bold text-blue-700 ${size}`}
    >
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

const StatusBadge = ({ status, type = "approval" }) => {
  const value = normalizeStatus(status);

  let styles = "bg-slate-100 text-slate-700";

  if (type === "approval") {
    styles =
      value === "approved" || value === "completed"
        ? "bg-emerald-100 text-emerald-700"
        : value === "declined"
        ? "bg-red-100 text-red-700"
        : value === "assigned" || value === "taken" || value === "shifted"
        ? "bg-blue-100 text-blue-700"
        : "bg-amber-100 text-amber-700";
  }

  if (type === "work") {
    styles =
      value === "free" || value === "paid"
        ? "bg-emerald-100 text-emerald-700"
        : value === "busy"
        ? "bg-blue-100 text-blue-700"
        : "bg-amber-100 text-amber-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-sm font-medium capitalize ${styles}`}
    >
      {status}
    </span>
  );
};

const Info = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 p-4">
    <p className="text-sm text-slate-500">{label}</p>
    <h4 className="mt-1 break-words text-base font-semibold text-slate-800">
      {value}
    </h4>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="flex min-h-[220px] items-center justify-center text-center">
    <p className="text-sm text-slate-500">{message}</p>
  </div>
);

const RiderDetailsSkeleton = () => (
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

const capitalizeText = (text = "") =>
  String(text)
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getInitials = (text = "") => {
  return text
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
};

const formatDate = (date) => {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return "N/A";
  }
};