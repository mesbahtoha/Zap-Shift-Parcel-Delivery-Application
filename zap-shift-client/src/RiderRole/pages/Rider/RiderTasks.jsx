import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";
import useAuth from "../../../hooks/useAuth";
import useAxiosSecure from "../../../hooks/useAxiosSecure";

// ─────────────────────────────────────────────
// Status config — matches backend parcelStatusMap exactly
// ─────────────────────────────────────────────
const STATUS_FLOW = [
  { value: "assigned",        label: "Assigned",         color: "bg-indigo-100 text-indigo-700 border-indigo-200"  },
  { value: "taken",           label: "Taken",            color: "bg-blue-100 text-blue-700 border-blue-200"        },
  { value: "shifted",         label: "Shifted to Hub",   color: "bg-violet-100 text-violet-700 border-violet-200"  },
  { value: "out for delivery",label: "Out for Delivery", color: "bg-amber-100 text-amber-700 border-amber-200"     },
  { value: "completed",       label: "Completed",        color: "bg-emerald-100 text-emerald-700 border-emerald-200"},
];

// Rider can move forward from their current status; "assigned" is set by admin
const UPDATABLE_STATUSES = [
  { value: "taken",            label: "Taken"            },
  { value: "shifted",          label: "Shifted to Hub"   },
  { value: "out for delivery", label: "Out for Delivery" },
  { value: "completed",        label: "Completed"        },
  { value: "cancelled",        label: "Cancel Task"      },
];

const getStatusStyle = (status) => {
  const found = STATUS_FLOW.find((s) => s.value === status);
  return found?.color ?? "bg-slate-100 text-slate-600 border-slate-200";
};

const getStepIndex = (status) =>
  STATUS_FLOW.findIndex((s) => s.value === status);

// ─────────────────────────────────────────────
// Progress stepper
// ─────────────────────────────────────────────
const ProgressStepper = ({ currentStatus }) => {
  const currentIdx = getStepIndex(currentStatus);

  return (
    <div className="flex items-center gap-0 overflow-x-auto py-1">
      {STATUS_FLOW.map((step, idx) => {
        const done    = idx < currentIdx;
        const active  = idx === currentIdx;
        const pending = idx > currentIdx;

        return (
          <div key={step.value} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-all
                  ${done    ? "border-emerald-500 bg-emerald-500 text-white"          : ""}
                  ${active  ? "border-blue-500 bg-blue-500 text-white shadow-md"      : ""}
                  ${pending ? "border-slate-200 bg-white text-slate-400"              : ""}`}
              >
                {done ? <CheckCircle2 size={14} /> : idx + 1}
              </div>
              <span
                className={`mt-1 whitespace-nowrap text-[10px] font-medium
                  ${done    ? "text-emerald-600" : ""}
                  ${active  ? "text-blue-600"    : ""}
                  ${pending ? "text-slate-400"   : ""}`}
              >
                {step.label}
              </span>
            </div>

            {idx < STATUS_FLOW.length - 1 && (
              <div
                className={`mb-4 h-0.5 w-8 flex-shrink-0 transition-all
                  ${idx < currentIdx ? "bg-emerald-400" : "bg-slate-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────
// Single Task Row
// ─────────────────────────────────────────────
const TaskCard = ({ task, onStatusChange, isUpdating }) => {
  const isCancelled = task.status === "cancelled";
  const isCompleted = task.status === "completed";
  const isTerminal  = isCancelled || isCompleted;

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm transition-all
        ${isCancelled ? "border-red-200 opacity-70" : "border-slate-200"}
        ${isCompleted ? "border-emerald-200"         : ""}`}
    >
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <Package size={20} className="text-slate-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Parcel ID</p>
            <p className="font-mono text-sm font-bold text-slate-800">
              {task.trackingId || task.parcelId}
            </p>
          </div>
        </div>

        <span
          className={`self-start rounded-full border px-3 py-1 text-xs font-semibold capitalize sm:self-auto
            ${getStatusStyle(task.status)}`}
        >
          {task.status?.replace(/_/g, " ")}
        </span>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem
          icon={<Phone size={13} />}
          label="Customer"
          value={task.customerName || "N/A"}
          sub={task.customerPhone}
        />
        <InfoItem
          icon={<MapPin size={13} />}
          label="Pickup"
          value={task.pickupLocation || "N/A"}
        />
        <InfoItem
          icon={<Truck size={13} />}
          label="Delivery"
          value={task.deliveryLocation || "N/A"}
        />
        <InfoItem
          icon={<Clock size={13} />}
          label="Assigned"
          value={
            task.assignedAt
              ? new Date(task.assignedAt).toLocaleDateString("en-BD", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "N/A"
          }
        />
      </div>

      {/* Admin message if present */}
      {task.adminMessage && (
        <div className="mx-4 mb-3 rounded-xl bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <span className="font-semibold">Admin note: </span>
          {task.adminMessage}
        </div>
      )}

      {/* Progress stepper */}
      {!isCancelled && (
        <div className="overflow-x-auto border-t border-slate-100 px-4 py-3">
          <ProgressStepper currentStatus={task.status} />
        </div>
      )}

      {isCancelled && (
        <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
          <XCircle size={14} />
          This task has been cancelled.
        </div>
      )}

      {/* Status update selector */}
      {!isTerminal && (
        <div className="border-t border-slate-100 p-4">
          <p className="mb-2 text-xs font-medium text-slate-500">
            Update delivery status
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {UPDATABLE_STATUSES.map((opt) => {
              const currentIdx = getStepIndex(task.status);
              const optIdx     = getStepIndex(opt.value);

              // Only show statuses ahead of current (or cancel)
              const isForward  = optIdx > currentIdx || opt.value === "cancelled";
              if (!isForward) return null;

              const isCancel = opt.value === "cancelled";

              return (
                <button
                  key={opt.value}
                  disabled={isUpdating}
                  onClick={() => onStatusChange(task._id, opt.value)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all hover:shadow-sm disabled:opacity-50
                    ${isCancel
                      ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
                >
                  {isUpdating ? "Updating…" : `→ ${opt.label}`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="border-t border-emerald-100 p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 size={16} />
            <span className="font-semibold">
              Delivery completed! You are now free for the next task.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ icon, label, value, sub }) => (
  <div className="rounded-xl bg-slate-50 p-3">
    <div className="mb-1 flex items-center gap-1 text-slate-400">
      {icon}
      <span className="text-[10px] uppercase tracking-wide">{label}</span>
    </div>
    <p className="text-sm font-semibold text-slate-800 leading-tight">{value}</p>
    {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
  </div>
);

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const RiderTasks = () => {
  const { user }       = useAuth();
  const axiosSecure    = useAxiosSecure();
  const queryClient    = useQueryClient();
  const QUERY_KEY      = ["rider-tasks", user?.email];

  // ── Fetch tasks ──────────────────────────────
  const {
    data: tasks = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await axiosSecure.get(`/rider-tasks/rider/${user.email}`);
      return res.data || [];
    },
    enabled: !!user?.email,
    refetchInterval: 30_000,      // auto-refresh every 30s
    refetchOnWindowFocus: true,
  });

  // ── Update status mutation ───────────────────
  const { mutate: updateStatus, variables: updatingVars, isPending } =
    useMutation({
      mutationFn: async ({ taskId, status }) => {
        const res = await axiosSecure.patch(`/rider-tasks/${taskId}`, {
          riderEmail: user.email,
          status,
        });
        return res.data;
      },
      onSuccess: () => {
        // Immediately refetch this rider's tasks so UI reflects new status
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      },
      onError: (err) => {
        // console.error("Status update failed:", err);
      },
    });

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <span className="loading loading-spinner loading-lg text-blue-500" />
      </div>
    );
  }

  const activeTasks    = tasks.filter((t) => !["completed", "cancelled"].includes(t.status));
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const cancelledTasks = tasks.filter((t) => t.status === "cancelled");

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#083c46]">My Delivery Tasks</h2>
          <p className="mt-1 text-sm text-slate-500">
            Update parcel status as you progress through each delivery.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {isError && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load tasks. Please refresh.
        </div>
      )}

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active",    count: activeTasks.length,    color: "text-blue-600 bg-blue-50"       },
          { label: "Completed", count: completedTasks.length, color: "text-emerald-600 bg-emerald-50" },
          { label: "Cancelled", count: cancelledTasks.length, color: "text-red-500 bg-red-50"         },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs font-medium opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 text-slate-400">
          <Package size={36} className="mb-3 opacity-40" />
          <p className="font-medium">No tasks assigned yet.</p>
          <p className="mt-1 text-sm">Check back later for new deliveries.</p>
        </div>
      ) : (
        <>
          {/* ── Active tasks ── */}
          {activeTasks.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Active ({activeTasks.length})
              </h3>
              {activeTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  isUpdating={isPending && updatingVars?.taskId === task._id}
                  onStatusChange={(taskId, status) =>
                    updateStatus({ taskId, status })
                  }
                />
              ))}
            </section>
          )}

          {/* ── Completed tasks ── */}
          {completedTasks.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-500">
                Completed ({completedTasks.length})
              </h3>
              {completedTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  isUpdating={false}
                  onStatusChange={() => {}}
                />
              ))}
            </section>
          )}

          {/* ── Cancelled tasks ── */}
          {cancelledTasks.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400">
                Cancelled ({cancelledTasks.length})
              </h3>
              {cancelledTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  isUpdating={false}
                  onStatusChange={() => {}}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default RiderTasks;