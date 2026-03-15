import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  MapPin,
  Package,
  PackageCheck,
  Search,
  Truck,
  Warehouse,
  X,
} from "lucide-react";
import useAuth from "../../../hooks/useAuth";
import useAxiosSecure from "../../../hooks/useAxiosSecure";

/* -------------------------------------------------------------------------- */
/*                               Query Key Export                             */
/* -------------------------------------------------------------------------- */

export const userParcelsKey = (email) => ["user-parcels", email];

/* -------------------------------------------------------------------------- */
/*                           Delivery Pipeline Config                         */
/* -------------------------------------------------------------------------- */

const STEPS = [
  {
    status: "pending",
    label: "Order Placed",
    desc: "We have received your order",
    Icon: Package,
    active: {
      dot: "bg-slate-500",
      bar: "bg-slate-300",
      ring: "ring-slate-300",
      text: "text-slate-600 dark:text-slate-300",
      icon: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
    },
  },
  {
    status: "assigned",
    label: "Rider Assigned",
    desc: "A rider is heading to pick up",
    Icon: Truck,
    active: {
      dot: "bg-indigo-500",
      bar: "bg-indigo-300",
      ring: "ring-indigo-300",
      text: "text-indigo-600 dark:text-indigo-300",
      icon: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300",
    },
  },
  {
    status: "taken",
    label: "Picked Up",
    desc: "Parcel collected by rider",
    Icon: PackageCheck,
    active: {
      dot: "bg-blue-500",
      bar: "bg-blue-300",
      ring: "ring-blue-300",
      text: "text-blue-600 dark:text-blue-300",
      icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
    },
  },
  {
    status: "shifted",
    label: "At Hub",
    desc: "Arrived at sorting facility",
    Icon: Warehouse,
    active: {
      dot: "bg-violet-500",
      bar: "bg-violet-300",
      ring: "ring-violet-300",
      text: "text-violet-600 dark:text-violet-300",
      icon: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300",
    },
  },
  {
    status: "out for delivery",
    label: "Out for Delivery",
    desc: "On the way to your address",
    Icon: Truck,
    active: {
      dot: "bg-amber-500",
      bar: "bg-amber-300",
      ring: "ring-amber-300",
      text: "text-amber-600 dark:text-amber-300",
      icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
    },
  },
  {
    status: "completed",
    label: "Delivered",
    desc: "Successfully delivered!",
    Icon: CheckCircle2,
    active: {
      dot: "bg-emerald-500",
      bar: "bg-emerald-300",
      ring: "ring-emerald-400",
      text: "text-emerald-600 dark:text-emerald-300",
      icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
  },
];

const CANCELLED_STEP = {
  status: "cancelled",
  label: "Cancelled",
  desc: "This delivery was cancelled",
  Icon: X,
  active: {
    dot: "bg-red-500",
    bar: "bg-red-300",
    ring: "ring-red-300",
    text: "text-red-600 dark:text-red-300",
    icon: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300",
  },
};

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const norm = (value = "") => String(value).trim().toLowerCase();

const fmtDate = (date) => {
  try {
    return date
      ? new Date(date).toLocaleDateString("en-BD", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";
  } catch {
    return "—";
  }
};

/* -------------------------------------------------------------------------- */
/*                             Progress Stepper UI                            */
/* -------------------------------------------------------------------------- */

const Stepper = ({ status }) => {
  const normalizedStatus = norm(status);
  const isCancelled = normalizedStatus === "cancelled";
  const steps = isCancelled ? [...STEPS, CANCELLED_STEP] : STEPS;
  const activeIndex = steps.findIndex((step) => step.status === normalizedStatus);

  return (
    <>
      {/* Mobile: vertical stepper */}
      <ol className="sm:hidden flex flex-col gap-0">
        {steps.map((step, index) => {
          const done = index < activeIndex;
          const current = index === activeIndex;
          const config = step.active;

          return (
            <li key={step.status} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ring-2 transition-all duration-300
                  ${
                    current
                      ? `${config.icon} ${config.ring} shadow-md scale-110`
                      : done
                      ? `${config.icon} ${config.ring}`
                      : "bg-slate-100 ring-slate-200 text-slate-300 dark:bg-slate-800 dark:ring-slate-700 dark:text-slate-500"
                  }`}
                >
                  {done ? <CheckCircle2 size={15} /> : <step.Icon size={15} />}
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`my-1 w-0.5 flex-1 min-h-[20px] rounded-full transition-all duration-500
                    ${done ? config.bar : "bg-slate-200 dark:bg-slate-700"}`}
                  />
                )}
              </div>

              <div className="pb-4 pt-1 min-w-0">
                <p
                  className={`text-sm font-semibold leading-tight transition-colors
                  ${
                    current
                      ? config.text
                      : done
                      ? "text-slate-700 dark:text-slate-300"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {step.label}
                </p>
                <p
                  className={`mt-0.5 text-xs transition-colors
                  ${
                    current || done
                      ? "text-slate-500 dark:text-slate-400"
                      : "text-slate-300 dark:text-slate-600"
                  }`}
                >
                  {step.desc}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Desktop: horizontal stepper */}
      <ol className="hidden sm:flex items-start w-full">
        {steps.map((step, index) => {
          const done = index < activeIndex;
          const current = index === activeIndex;
          const config = step.active;

          return (
            <li key={step.status} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {index > 0 && (
                  <div
                    className={`h-0.5 flex-1 rounded-full transition-all duration-500
                    ${
                      index <= activeIndex
                        ? steps[index - 1].active.bar
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                )}

                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ring-2 transition-all duration-300
                  ${
                    current
                      ? `${config.icon} ${config.ring} shadow-lg scale-110`
                      : done
                      ? `${config.icon} ${config.ring}`
                      : "bg-slate-100 ring-slate-200 text-slate-300 dark:bg-slate-800 dark:ring-slate-700 dark:text-slate-500"
                  }`}
                >
                  {done ? <CheckCircle2 size={15} /> : <step.Icon size={15} />}
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 rounded-full transition-all duration-500
                    ${done ? config.bar : "bg-slate-200 dark:bg-slate-700"}`}
                  />
                )}
              </div>

              <p
                className={`mt-2 px-1 text-center text-[11px] font-semibold leading-tight
                ${
                  current
                    ? config.text
                    : done
                    ? "text-slate-600 dark:text-slate-300"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {step.label}
              </p>
            </li>
          );
        })}
      </ol>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Status Badge                                */
/* -------------------------------------------------------------------------- */

const BADGE_STYLES = {
  pending:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  assigned:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  taken: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  shifted:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  "out for delivery":
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  completed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelled:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const StatusBadge = ({ status }) => {
  const normalizedStatus = norm(status);

  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold capitalize tracking-wide
      ${
        BADGE_STYLES[normalizedStatus] ??
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {status}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Detail Chip                                 */
/* -------------------------------------------------------------------------- */

const Chip = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
    <Icon
      size={14}
      className="mt-0.5 flex-shrink-0 text-slate-400 dark:text-slate-500"
    />
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 break-words text-sm font-medium text-slate-700 dark:text-slate-200">
        {value || "—"}
      </p>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*                              Single Parcel Card                            */
/* -------------------------------------------------------------------------- */

const ParcelCard = ({ parcel, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  const status = norm(parcel.deliveryStatus);
  const isCompleted = status === "completed";
  const isCancelled = status === "cancelled";
  const isActive = !isCompleted && !isCancelled;

  const trackingText =
    parcel.trackingId || parcel._id?.slice(-10).toUpperCase();

  const senderText = `${parcel.senderName || "—"}${
    parcel.senderAddress ? ` · ${parcel.senderAddress}` : ""
  }`;

  const receiverText = `${parcel.receiverName || "—"}${
    parcel.receiverAddress ? ` · ${parcel.receiverAddress}` : ""
  }`;

  const riderText =
    parcel.assignedRiderName ||
    parcel.assignedRiderEmail ||
    "Not yet assigned";

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900
      ${
        isCompleted
          ? "border-emerald-200 dark:border-emerald-800"
          : isCancelled
          ? "border-red-200 dark:border-red-800"
          : isActive
          ? "border-slate-200 dark:border-slate-700"
          : "border-slate-200 dark:border-slate-700"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left sm:items-center sm:p-5"
      >
        <div className="flex items-start gap-3 sm:items-center">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl
            ${
              isCompleted
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
                : isCancelled
                ? "bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-300"
                : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
            }`}
          >
            <Package size={18} />
          </div>

          <div>
            <p className="font-mono text-sm font-bold leading-none text-slate-800 dark:text-slate-100">
              {trackingText}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {parcel.parcelName || "Parcel"} &bull; Ordered{" "}
              {fmtDate(parcel.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <StatusBadge status={parcel.deliveryStatus || "pending"} />
          <ChevronDown
            size={16}
            className={`flex-shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      <div
        className={`border-t px-4 py-5 sm:px-5
        ${
          isCancelled
            ? "border-red-100 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/20"
            : "border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40"
        }`}
      >
        <Stepper status={parcel.deliveryStatus || "pending"} />
      </div>

      {open && (
        <div className="border-t border-slate-100 p-4 sm:p-5 dark:border-slate-800">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Chip icon={MapPin} label="Sender" value={senderText} />
            <Chip icon={MapPin} label="Recipient" value={receiverText} />
            <Chip icon={Truck} label="Assigned Rider" value={riderText} />
            <Chip
              icon={Package}
              label="Weight"
              value={parcel.weight ? `${parcel.weight} kg` : "—"}
            />
            <Chip icon={Clock} label="Placed On" value={fmtDate(parcel.createdAt)} />
            <Chip
              icon={CheckCircle2}
              label="Payment"
              value={parcel.paymentStatus === "paid" ? "✓ Paid" : "Unpaid"}
            />
          </div>

          {parcel.adminMessage && (
            <div className="mt-3 flex gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>
                <span className="font-semibold">Note: </span>
                {parcel.adminMessage}
              </span>
            </div>
          )}
        </div>
      )}
    </article>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 Empty State                                */
/* -------------------------------------------------------------------------- */

const Empty = ({ searching }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-20 text-center dark:border-slate-700">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
      <Package size={28} className="text-slate-300 dark:text-slate-500" />
    </div>
    <p className="font-semibold text-slate-600 dark:text-slate-300">
      {searching ? "No results found" : "No parcels yet"}
    </p>
    <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
      {searching
        ? "Try a different keyword"
        : "Your orders will appear here once placed."}
    </p>
  </div>
);

/* -------------------------------------------------------------------------- */
/*                              Main Track Parcel                             */
/* -------------------------------------------------------------------------- */

export const TrackParcel = () => {
  const { user } = useAuth();
  const axiosSecure = useAxiosSecure();
  const [search, setSearch] = useState("");

  const {
    data: parcels = [],
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: userParcelsKey(user?.email),
    queryFn: async () => {
      const res = await axiosSecure.get(`/parcels/user/${user.email}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!user?.email,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  /**
   * Filter parcels based on search input
   */
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return parcels;

    return parcels.filter((parcel) =>
      [
        parcel.trackingId,
        parcel.parcelName,
        parcel.senderName,
        parcel.receiverName,
        parcel.deliveryStatus,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [parcels, search]);

  /**
   * Split parcels into groups for display
   */
  const active = filtered.filter(
    (parcel) => !["completed", "cancelled"].includes(norm(parcel.deliveryStatus))
  );
  const completed = filtered.filter(
    (parcel) => norm(parcel.deliveryStatus) === "completed"
  );
  const cancelled = filtered.filter(
    (parcel) => norm(parcel.deliveryStatus) === "cancelled"
  );

  const totalActive = parcels.filter(
    (parcel) => !["completed", "cancelled"].includes(norm(parcel.deliveryStatus))
  ).length;

  const totalCompleted = parcels.filter(
    (parcel) => norm(parcel.deliveryStatus) === "completed"
  ).length;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <span className="loading loading-spinner loading-lg text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-[#083c46] dark:text-slate-100">
            Track My Parcels
          </h1>

          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>

          {isFetching && !isLoading && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Syncing…
            </span>
          )}
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Real-time status updates for all your deliveries
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {parcels.length}
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Orders
          </p>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {totalActive}
          </p>
          <p className="mt-0.5 text-xs font-medium text-blue-600 dark:text-blue-300">
            In Progress
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {totalCompleted}
          </p>
          <p className="mt-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-300">
            Delivered
          </p>
        </div>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by tracking ID, name or status…"
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-900/40"
        />

        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          Failed to load parcels. Will retry automatically.
        </div>
      )}

      {/* Parcel sections */}
      {filtered.length === 0 ? (
        <Empty searching={!!search} />
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section className="space-y-4">
              {active.length > 0 && parcels.length > active.length && (
                <div className="flex items-center gap-2">
                  <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500 dark:text-blue-300">
                    In Progress
                  </p>
                  <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>
              )}

              {active.map((parcel, index) => (
                <ParcelCard
                  key={parcel._id}
                  parcel={parcel}
                  defaultOpen={index === 0 && active.length === 1}
                />
              ))}
            </section>
          )}

          {completed.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-500 dark:text-emerald-300">
                  Delivered
                </p>
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>

              {completed.map((parcel) => (
                <ParcelCard key={parcel._id} parcel={parcel} />
              ))}
            </section>
          )}

          {cancelled.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-red-400 dark:text-red-300">
                  Cancelled
                </p>
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>

              {cancelled.map((parcel) => (
                <ParcelCard key={parcel._id} parcel={parcel} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackParcel;