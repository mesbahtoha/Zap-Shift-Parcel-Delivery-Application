import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuth } from "firebase/auth";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Truck,
  User,
  Wifi,
} from "lucide-react";

/**
 * Use env URL in production, but keep localhost as fallback for development.
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/**
 * Task statuses shown in the UI.
 * Keeping them in one place makes badge styling easier to maintain.
 */
const STATUS_CONFIG = {
  assigned: {
    label: "Assigned",
    bg: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  taken: {
    label: "Taken",
    bg: "bg-blue-100 text-blue-700 border-blue-200",
  },
  shifted: {
    label: "Shifted to Hub",
    bg: "bg-violet-100 text-violet-700 border-violet-200",
  },
  "out for delivery": {
    label: "Out for Delivery",
    bg: "bg-amber-100 text-amber-700 border-amber-200",
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-red-100 text-red-700 border-red-200",
  },
};

/**
 * These are the steps used in the progress bar.
 * Cancelled is intentionally excluded because cancelled tasks do not show progress.
 */
const PROGRESS_STEPS = [
  "assigned",
  "taken",
  "shifted",
  "out for delivery",
  "completed",
];

/**
 * Helper to check if a task is in a final state.
 * Final states usually affect progress UI and availability logic.
 */
const isTerminalTaskStatus = (status) =>
  status === "completed" || status === "cancelled";

const isCompletedStatus = (status) => status === "completed";
const isCancelledStatus = (status) => status === "cancelled";

/**
 * Format date-time for Bangladesh locale.
 * Centralizing this avoids repeating the same code in many places.
 */
const formatDateTime = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("en-BD", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format query last-sync time for the live status area.
 */
const formatSyncTime = (timestamp) => {
  if (!timestamp) return null;

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleTimeString("en-BD", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

/**
 * Get Firebase token from the currently logged-in user.
 * This token is sent to the backend to verify the request.
 */
const getToken = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must login first.");
  }

  return currentUser.getIdToken();
};

/**
 * Fetch rider task updates from the backend.
 * This function is kept outside the component so the UI stays cleaner.
 */
const fetchRiderTaskUpdates = async () => {
  const token = await getToken();

  const response = await fetch(`${API_BASE_URL}/admin/rider-task-updates`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch rider tasks");
  }

  return Array.isArray(data) ? data : [];
};

/**
 * Small reusable info box used inside each task card.
 */
const InfoBox = ({ icon, label, value, sub }) => {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="mb-1 flex items-center gap-1 text-slate-400">
        {icon}
        <span className="text-[9px] uppercase tracking-wide">{label}</span>
      </div>

      <p className="truncate text-sm font-semibold text-slate-800">{value}</p>

      {sub ? (
        <p className="mt-0.5 truncate text-[10px] text-slate-400">{sub}</p>
      ) : null}
    </div>
  );
};

/**
 * Shows the task status with color.
 */
const StatusBadge = ({ status }) => {
  const fallbackConfig = {
    label: status || "Unknown",
    bg: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const config = STATUS_CONFIG[status] ?? fallbackConfig;

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${config.bg}`}
    >
      {config.label}
    </span>
  );
};

/**
 * Availability becomes "Free" if:
 * - backend says free
 * - task is completed
 * - task is cancelled
 */
const AvailabilityBadge = ({ availability, taskStatus }) => {
  const isFree =
    availability === "free" ||
    isCompletedStatus(taskStatus) ||
    isCancelledStatus(taskStatus);

  return (
    <span
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
        isFree
          ? "border-emerald-200 bg-emerald-100 text-emerald-700"
          : "border-red-200 bg-red-100 text-red-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isFree ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {isFree ? "Free" : "Busy"}
    </span>
  );
};

/**
 * Visual progress bar for active task statuses.
 * Cancelled tasks do not use this component.
 */
const ProgressBar = ({ currentStatus }) => {
  const currentIndex = PROGRESS_STEPS.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-0">
      {PROGRESS_STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold
                  ${isDone ? "border-emerald-500 bg-emerald-500 text-white" : ""}
                  ${isActive ? "border-blue-500 bg-blue-500 text-white" : ""}
                  ${isPending ? "border-slate-200 bg-white text-slate-400" : ""}`}
              >
                {isDone ? <CheckCircle2 size={12} /> : index + 1}
              </div>

              <span
                className={`mt-0.5 hidden whitespace-nowrap text-[9px] font-medium sm:block
                  ${isDone ? "text-emerald-600" : ""}
                  ${isActive ? "text-blue-600" : ""}
                  ${isPending ? "text-slate-400" : ""}`}
              >
                {step}
              </span>
            </div>

            {index < PROGRESS_STEPS.length - 1 ? (
              <div
                className={`mb-3 h-0.5 w-6 flex-shrink-0 sm:w-10 ${
                  index < currentIndex ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Single task card.
 * Keeping this separate makes the main page easier to read.
 */
const TaskCard = ({ task }) => {
  const isCancelled = isCancelledStatus(task.status);
  const isCompleted = isCompletedStatus(task.status);

  const trackingDisplay =
    task.trackingId || task.parcelName || task.parcelId || "N/A";

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md
        ${isCompleted ? "border-emerald-200" : ""}
        ${isCancelled ? "border-red-200 opacity-80" : ""}
        ${!isCompleted && !isCancelled ? "border-slate-200" : ""}`}
    >
      {/* Card header with parcel identity and current task state */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <Package size={18} className="text-slate-600" />
          </div>

          <div>
            <p className="text-xs text-slate-400">Tracking ID / Parcel</p>
            <p className="font-mono text-sm font-bold text-slate-800">
              {trackingDisplay}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          <AvailabilityBadge
            availability={task.availability}
            taskStatus={task.status}
          />
        </div>
      </div>

      {/* Main task details */}
      <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
        <InfoBox
          icon={<User size={12} />}
          label="Rider"
          value={task.riderName || "N/A"}
          sub={task.riderEmail}
        />

        <InfoBox
          icon={<User size={12} />}
          label="Customer"
          value={task.customerName || "N/A"}
        />

        <InfoBox
          icon={<MapPin size={12} />}
          label="Pickup"
          value={task.pickupLocation || "N/A"}
        />

        <InfoBox
          icon={<Truck size={12} />}
          label="Delivery"
          value={task.deliveryLocation || "N/A"}
        />
      </div>

      {/* Important timestamps */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-3 md:grid-cols-4">
        <InfoBox
          icon={<Clock size={12} />}
          label="Assigned"
          value={formatDateTime(task.assignedAt)}
        />

        <InfoBox
          icon={<Clock size={12} />}
          label="Last Updated"
          value={formatDateTime(task.updatedAt)}
        />

        {isCompleted && task.completedAt ? (
          <InfoBox
            icon={<CheckCircle2 size={12} />}
            label="Completed At"
            value={formatDateTime(task.completedAt)}
          />
        ) : null}
      </div>

      {/* Show progress only for tasks that were not cancelled */}
      {!isCancelled ? (
        <div className="overflow-x-auto border-t border-slate-100 px-4 py-3">
          <ProgressBar currentStatus={task.status} />
        </div>
      ) : null}
    </div>
  );
};

/**
 * Main page:
 * - fetches task updates
 * - auto-refreshes every 10 seconds
 * - supports searching
 * - shows summary stats
 */
export const RiderTaskUpdate = () => {
  const [searchText, setSearchText] = useState("");

  /**
   * Fetching data with TanStack Query.
   *
   * Why this setup:
   * - queryKey identifies this cache entry
   * - refetchInterval keeps admin UI near real-time
   * - refetchOnWindowFocus refreshes when returning to the tab
   * - retry helps recover from temporary network errors
   */
  const {
    data: tasks = [],
    isLoading,
    isFetching,
    isError,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["admin-rider-task-updates"],
    queryFn: fetchRiderTaskUpdates,
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  /**
   * Search filter:
   * This runs only when tasks or the search text changes.
   * useMemo helps avoid recalculating on every render.
   */
  const filteredTasks = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return tasks;
    }

    return tasks.filter((task) => {
      const searchableFields = [
        task.riderName,
        task.riderEmail,
        task.parcelName,
        task.trackingId,
        task.parcelId,
        task.status,
      ];

      return searchableFields
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [tasks, searchText]);

  /**
   * Summary stats for the small cards at the top.
   * These update automatically whenever query data changes.
   */
  const counts = useMemo(() => {
    return {
      active: tasks.filter((task) => !isTerminalTaskStatus(task.status)).length,
      completed: tasks.filter((task) => isCompletedStatus(task.status)).length,
      cancelled: tasks.filter((task) => isCancelledStatus(task.status)).length,
      free: tasks.filter(
        (task) =>
          isCompletedStatus(task.status) || isCancelledStatus(task.status) || task.availability === "free"
      ).length,
    };
  }, [tasks]);

  const lastUpdated = formatSyncTime(dataUpdatedAt);

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <span className="loading loading-spinner loading-lg text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
            Rider Task Updates
          </h2>

          <p className="text-sm text-slate-500">
            Live parcel progress — auto-refreshes every 10 seconds
          </p>

          {/* Live status indicator */}
          <div className="mt-1.5 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>

            {lastUpdated ? (
              <span className="text-xs text-slate-400">
                Last synced {lastUpdated}
              </span>
            ) : null}

            {isFetching && !isLoading ? (
              <span className="flex items-center gap-1 text-xs text-blue-400">
                <Wifi size={11} className="animate-pulse" />
                Syncing…
              </span>
            ) : null}
          </div>
        </div>

        {/* Manual refresh button */}
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error notice */}
      {isError ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to fetch rider tasks. Will retry automatically.
        </div>
      ) : null}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Active Tasks",
            count: counts.active,
            bg: "bg-blue-50 text-blue-700",
          },
          {
            label: "Completed",
            count: counts.completed,
            bg: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Cancelled",
            count: counts.cancelled,
            bg: "bg-red-50 text-red-600",
          },
          {
            label: "Riders Free",
            count: counts.free,
            bg: "bg-violet-50 text-violet-700",
          },
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl p-4 ${item.bg}`}>
            <p className="text-2xl font-bold">{item.count}</p>
            <p className="text-xs font-medium opacity-70">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Search input */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          placeholder="Search rider, parcel, tracking id, status…"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 text-slate-400">
          <Package size={36} className="mb-3 opacity-40" />
          <p className="font-medium">No rider task updates found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};