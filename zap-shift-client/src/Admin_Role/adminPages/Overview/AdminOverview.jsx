import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Bike,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  Bell,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { getAuth } from "firebase/auth";

// Base API URL – falls back to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Retrieves the current Firebase user's ID token.
 * @throws {Error} If no user is logged in.
 */
const getToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("You must login first.");
  return await user.getIdToken();
};

export const AdminOverview = () => {
  // ── State ───────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({});               // Dashboard statistics
  const [recentActivities, setRecentActivities] = useState([]); // Notifications
  const [loading, setLoading] = useState(true);          // Initial loading
  const [refreshing, setRefreshing] = useState(false);   // Manual refresh indicator

  // ── Fetch dashboard data from API ───────────────────────────────────────
  const fetchOverview = useCallback(async (refresh = false) => {
    try {
      // Set the appropriate loading state
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/admin/dashboard-overview`, {
        headers: { authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load dashboard");
      }

      // Update state with fetched data
      setStats(data.stats || {});
      setRecentActivities(data.notifications || []);
    } catch (error) {
      // Errors are silently ignored (no UI feedback) – matches original behaviour.
      // (Original had console.error, which we removed as requested.)
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Initial fetch and auto‑refresh setup ───────────────────────────────
  useEffect(() => {
    fetchOverview();

    // Auto‑refresh every 5 seconds
    const interval = setInterval(() => {
      fetchOverview(true);
    }, 5000);

    // Refresh when the user returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchOverview(true);
      }
    };

    // Custom event for instant refresh from other components
    const handleDashboardRefresh = () => {
      fetchOverview(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("admin-overview-refresh", handleDashboardRefresh);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("admin-overview-refresh", handleDashboardRefresh);
    };
  }, [fetchOverview]);

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500 dark:text-slate-400">
        Loading dashboard...
      </div>
    );
  }

  // ── Prepare statistics cards ────────────────────────────────────────────
  const statCards = [
    { title: "Total Users", value: stats.totalUsers || 0, icon: Users },
    { title: "Total Riders", value: stats.totalRiders || 0, icon: Bike },
    { title: "Total Parcels", value: stats.totalParcels || 0, icon: Package },
    { title: "Completed Parcels", value: stats.completedParcels || 0, icon: CheckCircle2 },
    {
      title: "Cash In",
      value: `৳ ${Number(stats.totalCashIn || 0).toLocaleString()}`,
      icon: ArrowDownCircle,
    },
    {
      title: "Cash Out",
      value: `৳ ${Number(stats.totalCashOut || 0).toLocaleString()}`,
      icon: ArrowUpCircle,
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header with title and refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 md:text-2xl">
            Overview
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome back, admin dashboard summary
          </p>
        </div>

        <button
          onClick={() => fetchOverview(true)}
          className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Main statistics cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {item.title}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {item.value}
                  </h3>
                </div>
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom row: quick summary + notifications */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Quick summary box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Quick Summary
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <SummaryBox label="Pending Riders" value={stats.pendingRiders || 0} />
            <SummaryBox label="Pending Parcels" value={stats.pendingParcels || 0} />
            <SummaryBox label="Available Riders" value={stats.availableRiders || 0} />
            <SummaryBox label="Unpaid Orders" value={stats.unpaidOrders || 0} />
          </div>
        </div>

        {/* Notifications box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Bell className="text-blue-600 dark:text-blue-300" size={20} />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Recent Notifications
            </h3>
          </div>
          <div className="mt-4 space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No recent notifications
              </p>
            ) : (
              recentActivities.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {item.message || item.title}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== Helper Components ====================

/**
 * Small box for displaying a quick summary statistic.
 */
const SummaryBox = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    <h4 className="mt-1 text-xl font-bold text-slate-800 dark:text-slate-100">
      {value}
    </h4>
  </div>
);