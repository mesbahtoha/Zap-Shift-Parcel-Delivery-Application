import { useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw, Search, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { getAuth } from "firebase/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const Order = () => {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchOrders = async ({ isRefresh = false } = {}) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError("");

      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("You must be logged in.");
      }

      const token = await currentUser.getIdToken();

      const query = new URLSearchParams();
      if (debouncedSearch) {
        query.append("search", debouncedSearch);
      }

      const url = query.toString()
        ? `${API_BASE_URL}/admin/orders?${query.toString()}`
        : `${API_BASE_URL}/admin/orders`;

      const response = await fetch(url, {
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

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [debouncedSearch]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const completedOrders = orders.filter(
      (order) => normalizeStatus(order.deliveryStatus) === "completed"
    ).length;
    const pendingOrders = orders.filter((order) => {
      const status = normalizeStatus(order.deliveryStatus);
      return status === "pending" || status === "processing" || status === "assigned";
    }).length;

    return {
      totalOrders,
      completedOrders,
      pendingOrders,
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
            Orders
          </h2>
          <p className="text-sm text-slate-500">
            View all parcel orders from users
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by tracking id, sender, receiver..."
              className="w-full bg-transparent text-sm outline-none sm:w-72"
            />
          </div>

          <button
            onClick={() => fetchOrders({ isRefresh: true })}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={<ShoppingBag size={20} />}
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={<RefreshCw size={20} className={loading ? "animate-spin" : ""} />}
        />
        <StatCard
          title="Completed Orders"
          value={stats.completedOrders}
          icon={<ShoppingBag size={20} />}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 md:px-5">
          <h3 className="text-base font-semibold text-slate-800">Order Directory</h3>
          <p className="text-sm text-slate-500">
            Latest parcel orders placed by users
          </p>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-4 py-10 text-center">
            <p className="text-base font-semibold text-red-600">Failed to load orders</p>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <button
              onClick={() => fetchOrders()}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-4 py-10 text-center">
            <p className="text-base font-semibold text-slate-700">No orders found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try a different keyword or refresh the list.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50">
                  <tr className="text-sm text-slate-600">
                    <th className="px-5 py-3">Order ID</th>
                    <th className="px-5 py-3">Sender</th>
                    <th className="px-5 py-3">Receiver</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-t border-slate-100 text-sm">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {order.trackingId || order._id}
                          </p>
                          <p className="text-xs text-slate-500">
                            {order.parcelName || "Unnamed Parcel"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {order.senderName || "N/A"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {order.receiverName || "N/A"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        ৳ {Number(order.cost || order.amountTaka || 0).toLocaleString()}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={order.deliveryStatus || "pending"} />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/Md.Mesbhaul_Alam_Toha/orders/${order._id}`}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
                        >
                          <Eye size={14} />
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {order.trackingId || order._id}
                      </p>
                      <p className="text-sm text-slate-500">
                        {order.parcelName || "Unnamed Parcel"}
                      </p>
                    </div>

                    <StatusBadge status={order.deliveryStatus || "pending"} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <MiniInfo label="Sender" value={order.senderName || "N/A"} />
                    <MiniInfo label="Receiver" value={order.receiverName || "N/A"} />
                    <MiniInfo
                      label="Amount"
                      value={`৳ ${Number(
                        order.cost || order.amountTaka || 0
                      ).toLocaleString()}`}
                    />
                    <MiniInfo
                      label="Created"
                      value={formatDate(order.createdAt)}
                    />
                  </div>

                  <div className="mt-4">
                    <Link
                      to={`/Md.Mesbhaul_Alam_Toha/orders/${order._id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      <Eye size={16} />
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }) => {
  return (
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
};

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
    <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${styles}`}>
      {status}
    </span>
  );
};

const MiniInfo = ({ label, value }) => (
  <div className="rounded-xl bg-white p-3">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="mt-1 font-medium text-slate-800">{value}</p>
  </div>
);

const TableSkeleton = () => {
  return (
    <div className="p-4 md:p-5">
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-xl bg-slate-100"
          />
        ))}
      </div>
    </div>
  );
};

const normalizeStatus = (status = "") => String(status).trim().toLowerCase();

const formatDate = (date) => {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return "N/A";
  }
};