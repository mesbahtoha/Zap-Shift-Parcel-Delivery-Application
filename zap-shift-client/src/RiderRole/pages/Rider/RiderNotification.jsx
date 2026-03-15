import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BellOff,
  CheckCheck,
  Package,
  RefreshCw,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import useAuth from "../../../hooks/useAuth";
import useAxiosSecure from "../../../hooks/useAxiosSecure";

export const riderNotificationsKey = (email) => ["rider-notifications", email];
export const riderUnreadCountKey   = (email) => ["rider-notifications-unread", email];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const TYPE_CONFIG = {
  rider_task_assigned: {
    icon:   <Package size={18} />,
    label:  "New Task",
    color:  "bg-blue-100 text-blue-600",
    border: "border-l-blue-500",
  },
  rider_task_update: {
    icon:   <Zap size={18} />,
    label:  "Task Update",
    color:  "bg-violet-100 text-violet-600",
    border: "border-l-violet-500",
  },
  rider_approval: {
    icon:   <ShieldCheck size={18} />,
    label:  "Approval",
    color:  "bg-emerald-100 text-emerald-600",
    border: "border-l-emerald-500",
  },
  cash_out: {
    icon:   <Wallet size={18} />,
    label:  "Payment",
    color:  "bg-amber-100 text-amber-600",
    border: "border-l-amber-500",
  },
};

const getTypeConfig = (type) =>
  TYPE_CONFIG[type] ?? {
    icon:   <Bell size={18} />,
    label:  "Notification",
    color:  "bg-slate-100 text-slate-600",
    border: "border-l-slate-400",
  };

const timeAgo = (date) => {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-BD", { day: "numeric", month: "short" });
};

// ─────────────────────────────────────────────
// Notification card
// ─────────────────────────────────────────────
const NotificationCard = ({ notification, onRead }) => {
  const cfg      = getTypeConfig(notification.type);
  const isUnread = !notification.isRead;

  return (
    <div
      onClick={() => isUnread && onRead(notification._id)}
      className={`relative flex gap-4 rounded-2xl border-l-4 bg-white p-4 shadow-sm transition-all duration-200
        ${isUnread
          ? "cursor-pointer ring-1 ring-blue-100 hover:-translate-y-0.5 hover:shadow-md"
          : "opacity-70"}
        ${cfg.border}`}
    >
      {/* Unread pulsing dot */}
      {isUnread && (
        <span className="absolute right-4 top-4 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
        </span>
      )}

      {/* Icon */}
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${cfg.color}`}>
        {cfg.icon}
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.color}`}>
            {cfg.label}
          </span>
          <span className="text-xs text-slate-400">{timeAgo(notification.createdAt)}</span>
          {!isUnread && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
              Read
            </span>
          )}
        </div>

        <p className={`mt-1 text-sm font-semibold leading-snug ${isUnread ? "text-slate-800" : "text-slate-500"}`}>
          {notification.title}
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
          {notification.message}
        </p>

        {notification.meta?.trackingId && (
          <p className="mt-1.5 font-mono text-xs text-slate-400">
            Tracking: {notification.meta.trackingId}
          </p>
        )}
        {notification.meta?.adminMessage && (
          <div className="mt-2 rounded-xl bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
            <span className="font-semibold">Note: </span>
            {notification.meta.adminMessage}
          </div>
        )}
        {notification.meta?.amountTaka && (
          <p className="mt-1.5 text-xs font-semibold text-emerald-600">
            Amount: ৳ {notification.meta.amountTaka}
          </p>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────
const EmptyState = ({ filter }) => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
      <BellOff size={28} className="opacity-50" />
    </div>
    <p className="font-semibold text-slate-600">
      {filter === "unread" ? "You're all caught up!" : "No notifications yet"}
    </p>
    <p className="mt-1 text-sm">
      {filter === "unread"
        ? "No unread notifications remaining."
        : "Task assignments, approvals and payments will appear here."}
    </p>
  </div>
);

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export const RiderNotification = () => {
  const { user }    = useAuth();
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState("all");

  // ── Fetch notifications ──────────────────────
  const {
    data:      notifications = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: riderNotificationsKey(user?.email),
    queryFn:  async () => {
      const res = await axiosSecure.get("/rider/notifications");
      return res.data || [];
    },
    enabled:              !!user?.email,
    refetchInterval:      15_000,
    refetchOnWindowFocus: true,
    staleTime:            0,
  });

  // ─────────────────────────────────────────────
  // ✅ Mark ONE as read
  //    onMutate updates BOTH:
  //      1. the notifications list (card loses pulsing dot)
  //      2. the riderUnreadCountKey cache (badge decrements instantly)
  // ─────────────────────────────────────────────
  const { mutate: markRead } = useMutation({
    mutationFn: (id) => axiosSecure.patch(`/rider/notifications/${id}/read`),

    onMutate: async (id) => {
      // Cancel in-flight refetches so they don't clobber optimistic update
      await queryClient.cancelQueries({ queryKey: riderNotificationsKey(user?.email) });
      await queryClient.cancelQueries({ queryKey: riderUnreadCountKey(user?.email)   });

      // Snapshot previous values for rollback
      const prevList  = queryClient.getQueryData(riderNotificationsKey(user?.email));
      const prevCount = queryClient.getQueryData(riderUnreadCountKey(user?.email));

      // ✅ Optimistically mark notification as read
      queryClient.setQueryData(riderNotificationsKey(user?.email), (old = []) =>
        old.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );

      // ✅ Optimistically decrement badge count immediately
      queryClient.setQueryData(riderUnreadCountKey(user?.email), (old) => ({
        count: Math.max(0, (old?.count ?? 1) - 1),
      }));

      return { prevList, prevCount };
    },

    onError: (_err, _id, ctx) => {
      // Roll back both caches on error
      if (ctx?.prevList)  queryClient.setQueryData(riderNotificationsKey(user?.email), ctx.prevList);
      if (ctx?.prevCount) queryClient.setQueryData(riderUnreadCountKey(user?.email),   ctx.prevCount);
    },

    onSettled: () => {
      // Sync badge count with server after mutation completes
      queryClient.invalidateQueries({ queryKey: riderUnreadCountKey(user?.email) });
    },
  });

  // ─────────────────────────────────────────────
  // ✅ Mark ALL as read
  //    Zeros the badge and clears all pulsing dots instantly
  // ─────────────────────────────────────────────
  const { mutate: markAllRead, isPending: markingAll } = useMutation({
    mutationFn: () => axiosSecure.patch("/rider/notifications/read-all"),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: riderNotificationsKey(user?.email) });
      await queryClient.cancelQueries({ queryKey: riderUnreadCountKey(user?.email)   });

      const prevList  = queryClient.getQueryData(riderNotificationsKey(user?.email));
      const prevCount = queryClient.getQueryData(riderUnreadCountKey(user?.email));

      // ✅ Mark every notification as read instantly
      queryClient.setQueryData(riderNotificationsKey(user?.email), (old = []) =>
        old.map((n) => ({ ...n, isRead: true }))
      );

      // ✅ Zero the badge count instantly
      queryClient.setQueryData(riderUnreadCountKey(user?.email), { count: 0 });

      return { prevList, prevCount };
    },

    onError: (_err, _v, ctx) => {
      if (ctx?.prevList)  queryClient.setQueryData(riderNotificationsKey(user?.email), ctx.prevList);
      if (ctx?.prevCount) queryClient.setQueryData(riderUnreadCountKey(user?.email),   ctx.prevCount);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: riderUnreadCountKey(user?.email) });
    },
  });

  // ── Derived ───────────────────────────────────
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const filtered = useMemo(() => {
    if (filter === "unread")   return notifications.filter((n) => !n.isRead);
    if (filter === "task")     return notifications.filter((n) => ["rider_task_assigned","rider_task_update"].includes(n.type));
    if (filter === "payment")  return notifications.filter((n) => n.type === "cash_out");
    if (filter === "approval") return notifications.filter((n) => n.type === "rider_approval");
    return notifications;
  }, [notifications, filter]);

  const TABS = [
    { id: "all",      label: "All",       count: notifications.length },
    { id: "unread",   label: "Unread",    count: unreadCount },
    { id: "task",     label: "Tasks",     count: notifications.filter((n) => ["rider_task_assigned","rider_task_update"].includes(n.type)).length },
    { id: "payment",  label: "Payments",  count: notifications.filter((n) => n.type === "cash_out").length },
    { id: "approval", label: "Approvals", count: notifications.filter((n) => n.type === "rider_approval").length },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <span className="loading loading-spinner loading-lg text-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[#083c46]">Notifications</h2>
            {/* ✅ Badge hides automatically when count is 0 */}
            {unreadCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm text-slate-500">
              Stay updated on tasks, payments &amp; approvals
            </p>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
            {isFetching && !isLoading && (
              <span className="text-[10px] text-slate-400">Syncing…</span>
            )}
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex flex-shrink-0 items-center gap-2">
          {/* ✅ Only visible when there are unread notifications */}
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              disabled={markingAll}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <CheckCheck size={14} />
              {markingAll ? "Marking…" : "Mark all read"}
            </button>
          )}

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {isError && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load notifications. Will retry automatically.
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all
              ${filter === tab.id
                ? "bg-[#083c46] text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold
                  ${filter === tab.id
                    ? "bg-white/20 text-white"
                    : tab.id === "unread"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-slate-100 text-slate-500"}`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Notification list ── */}
      {filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <NotificationCard
              key={n._id}
              notification={n}
              onRead={markRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RiderNotification;