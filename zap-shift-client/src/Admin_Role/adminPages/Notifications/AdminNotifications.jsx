import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Bell,
  RefreshCw,
  Search,
  CheckCheck,
  Filter,
  Package,
  Truck,
  Wallet,
  UserCheck,
} from "lucide-react";
import { getAuth } from "firebase/auth";

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Retrieves Firebase auth token for authenticated API requests
 * @returns {Promise<string>} Firebase ID token
 * @throws {Error} If user is not authenticated
 */
const getToken = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("You must login first.");
  return await currentUser.getIdToken();
};

/**
 * AdminNotifications Component
 * Displays and manages admin notifications with:
 * - Auto-refresh (every 5 seconds + on tab focus)
 * - Search by title/message/type
 * - Filter by read/unread status
 * - Mark individual/all as read
 * - Display notification metadata
 */
export const AdminNotifications = () => {
  // State management
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [error, setError] = useState("");

  /**
   * Fetches notifications from API
   * @param {boolean} showRefresh - Whether to show refresh spinner
   */
  const fetchNotifications = useCallback(async (showRefresh = false) => {
    try {
      showRefresh ? setRefreshing(true) : setLoading(true);
      setError("");
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/admin/notifications`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch notifications");
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to fetch notifications");
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch + auto-refresh setup
  useEffect(() => {
    fetchNotifications();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => fetchNotifications(true), 5000);

    // Refresh when browser tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchNotifications(true);
    };

    // Manual refresh trigger from other components
    const handleNotificationsRefresh = () => fetchNotifications(true);

    // Event listeners setup
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("admin-notifications-refresh", handleNotificationsRefresh);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("admin-notifications-refresh", handleNotificationsRefresh);
    };
  }, [fetchNotifications]);

  /**
   * Marks a single notification as read
   * @param {string} id - Notification ID
   */
  const markAsRead = async (id) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/admin/notifications/${id}/read`, {
        method: "PATCH",
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      // Update local state
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
      );

      // Notify other components to refresh
      window.dispatchEvent(new Event("admin-overview-refresh"));
      window.dispatchEvent(new Event("admin-notifications-refresh"));
    } catch (err) {
      // Silent fail - notification will remain unread
    }
  };

  /**
   * Marks all unread notifications as read
   */
  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      const unreadItems = notifications.filter((item) => !item.isRead);
      const token = await getToken();

      // Mark each notification as read via API
      await Promise.all(
        unreadItems.map((item) =>
          fetch(`${API_BASE_URL}/admin/notifications/${item._id}/read`, {
            method: "PATCH",
            headers: { authorization: `Bearer ${token}` },
          })
        )
      );

      // Update local state
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));

      // Notify other components
      window.dispatchEvent(new Event("admin-overview-refresh"));
      window.dispatchEvent(new Event("admin-notifications-refresh"));
    } catch (err) {
      // Silent fail
    } finally {
      setMarkingAll(false);
    }
  };

  // Computed values using useMemo for performance
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return notifications.filter((item) => {
      // Search filter: match title, message, or type
      const matchesSearch =
        !query ||
        [item.title, item.message, item.type]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(query));

      // Type filter: all, unread, or read
      const matchesFilter =
        filterType === "all" ||
        (filterType === "unread" ? !item.isRead : item.isRead);

      return matchesSearch && matchesFilter;
    });
  }, [notifications, searchText, filterType]);

  /**
   * Returns appropriate icon based on notification type
   * @param {string} type - Notification type
   * @returns {JSX.Element} Icon component
   */
  const getNotificationIcon = (type) => {
    const t = String(type || "").toLowerCase();
    if (t.includes("parcel") || t.includes("order"))
      return <Package size={18} className="text-blue-600 dark:text-blue-300" />;
    if (t.includes("rider"))
      return <Truck size={18} className="text-emerald-600 dark:text-emerald-300" />;
    if (t.includes("cash") || t.includes("payment"))
      return <Wallet size={18} className="text-amber-600 dark:text-amber-300" />;
    if (t.includes("approval"))
      return <UserCheck size={18} className="text-purple-600 dark:text-purple-300" />;
    return <Bell size={18} className="text-slate-600 dark:text-slate-300" />;
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500 dark:text-slate-400">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Section */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-100 p-3 dark:bg-blue-900/30">
            <Bell className="text-blue-600 dark:text-blue-300" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 md:text-2xl">
              Notifications
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              All admin notifications in one place
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={markAllAsRead}
            disabled={markingAll || unreadCount === 0}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <CheckCheck size={16} />
            {markingAll ? "Marking..." : "Mark all read"}
          </button>

          <button
            onClick={() => fetchNotifications(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label="Total Notifications" value={notifications.length} />
        <SummaryCard label="Unread" value={unreadCount} highlight />
        <SummaryCard label="Read" value={notifications.length - unreadCount} />
      </div>

      {/* Search and Filter */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              type="text"
              placeholder="Search notifications by title, message, type..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
            <Filter size={16} className="text-slate-500 dark:text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-sm outline-none dark:text-slate-100"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            No notifications found
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item._id}
              onClick={() => !item.isRead && markAsRead(item._id)}
              className={`rounded-2xl border p-4 shadow-sm transition ${
                item.isRead
                  ? "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  : "cursor-pointer border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-xl bg-white p-2 shadow-sm dark:bg-slate-800">
                  {getNotificationIcon(item.type)}
                </div>

                <div className="flex-1">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 md:text-base">
                        {item.title || "Notification"}
                      </h4>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {item.message || "No message"}
                      </p>
                      {item.type && (
                        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          {item.type}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-start gap-2 md:items-end">
                      {!item.isRead && (
                        <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-medium text-white">
                          New
                        </span>
                      )}
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Display */}
                  {item.meta && Object.keys(item.meta).length > 0 && (
                    <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Details
                      </p>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {item.meta.trackingId && (
                          <SmallMeta label="Tracking ID" value={item.meta.trackingId} />
                        )}
                        {item.meta.riderEmail && (
                          <SmallMeta label="Rider Email" value={item.meta.riderEmail} />
                        )}
                        {item.meta.riderName && (
                          <SmallMeta label="Rider Name" value={item.meta.riderName} />
                        )}
                        {item.meta.transactionId && (
                          <SmallMeta label="Transaction ID" value={item.meta.transactionId} />
                        )}
                        {item.meta.amountTaka !== undefined && (
                          <SmallMeta label="Amount" value={`৳ ${item.meta.amountTaka}`} />
                        )}
                        {item.meta.status && (
                          <SmallMeta label="Status" value={item.meta.status} />
                        )}
                        {item.meta.totalPaidNow !== undefined && (
                          <SmallMeta label="Paid Now" value={`৳ ${item.meta.totalPaidNow}`} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * Summary Card Component - Displays notification statistics
 * @param {string} label - Card label
 * @param {number} value - Numeric value
 * @param {boolean} highlight - Whether to highlight (blue) the card
 */
const SummaryCard = ({ label, value, highlight = false }) => (
  <div
    className={`rounded-2xl border p-4 shadow-sm ${
      highlight
        ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
        : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
    }`}
  >
    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    <h4 className="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">
      {value}
    </h4>
  </div>
);

/**
 * Small Meta Component - Displays key-value pairs in notification details
 * @param {string} label - Field label
 * @param {string} value - Field value
 */
const SmallMeta = ({ label, value }) => (
  <div className="rounded-lg bg-white p-2 dark:bg-slate-900">
    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{value}</p>
  </div>
);