import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Truck } from "lucide-react";
import { getAuth } from "firebase/auth";
import { userParcelsKey } from "../../../pages/Dashboard/TrackParcel/TrackParcel";

// Base URL for API calls – fallback to localhost during development
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// All possible delivery statuses that an admin can set
const STATUS_OPTIONS = [
  "pending",
  "assigned",
  "taken",
  "shifted",
  "out for delivery",
  "completed",
];

/**
 * Helper: retrieves the current Firebase user's ID token.
 * Throws if no user is logged in.
 */
const getToken = async () => {
  const user = getAuth().currentUser;
  if (!user) throw new Error("You must be logged in.");
  return user.getIdToken();
};

export const ParcelTracking = () => {
  const queryClient = useQueryClient();

  // ── Local UI state ───────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState("");           // raw search input
  const [debouncedSearch, setDebouncedSearch] = useState(""); // debounced value for API call
  const [statusMap, setStatusMap] = useState({});             // stores selected status per parcel (id → status)
  const [successId, setSuccessId] = useState("");             // id of parcel that was just updated (for UI feedback)
  const [errorMsg, setErrorMsg] = useState("");               // mutation error message

  // ── Debounce search input (500ms) ───────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText.trim()), 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  // ── Fetch parcels from API ───────────────────────────────────────────────
  const {
    data: parcels = [],          // default to empty array
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    // Query key includes search term so it refetches when debouncedSearch changes
    queryKey: ["admin-parcel-tracking", debouncedSearch],
    queryFn: async () => {
      const token = await getToken();
      const queryString = debouncedSearch
        ? `?search=${encodeURIComponent(debouncedSearch)}`
        : "";

      const res = await fetch(`${API_BASE_URL}/admin/parcel-tracking${queryString}`, {
        headers: { authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch parcels");

      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    },
    // Auto‑refresh every 20 seconds and on window focus for real‑time feel
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
    staleTime: 0, // data is considered stale immediately
  });

  // ── Seed the local statusMap with the current deliveryStatus of each parcel ──
  // This preserves the selected status even after re‑fetching, and only adds
  // new parcels without overwriting existing selections.
  useEffect(() => {
    if (!parcels.length) return;

    setStatusMap((prev) => {
      const next = { ...prev };
      let changed = false;

      parcels.forEach((parcel) => {
        if (!(parcel._id in next)) {
          next[parcel._id] = parcel.deliveryStatus || "pending";
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [parcels]);

  // ── Mutation: update a parcel's delivery status ──────────────────────────
  const {
    mutate: updateStatus,
    isPending: isUpdating,
    variables: updatingVars, // contains the parcelId currently being updated
  } = useMutation({
    mutationFn: async ({ parcelId, status }) => {
      const token = await getToken();

      const res = await fetch(
        `${API_BASE_URL}/admin/parcel-tracking/${parcelId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update");
      return data;
    },

    // Optimistic update: immediately reflect the new status in the UI
    onMutate: async ({ parcelId, status }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({
        queryKey: ["admin-parcel-tracking", debouncedSearch],
      });

      // Snapshot the current data
      const previousParcels = queryClient.getQueryData([
        "admin-parcel-tracking",
        debouncedSearch,
      ]);

      // Optimistically update the cached data
      queryClient.setQueryData(
        ["admin-parcel-tracking", debouncedSearch],
        (old = []) =>
          old.map((parcel) =>
            parcel._id === parcelId
              ? { ...parcel, deliveryStatus: status, parcelCurrentStatus: status }
              : parcel
          )
      );

      // Return context with the snapshot for rollback
      return { previousParcels };
    },

    // If the mutation fails, roll back to the previous data
    onError: (err, _variables, context) => {
      if (context?.previousParcels) {
        queryClient.setQueryData(
          ["admin-parcel-tracking", debouncedSearch],
          context.previousParcels
        );
      }
      setErrorMsg(err.message || "Failed to update status");
    },

    onSuccess: (_data, { parcelId, userEmail }) => {
      setErrorMsg(""); // clear any previous error

      // If the parcel is linked to a user, invalidate that user's personal parcel list
      if (userEmail) {
        queryClient.invalidateQueries({
          queryKey: userParcelsKey(userEmail),
        });
      }

      // Invalidate the admin list so it refetches the latest data
      queryClient.invalidateQueries({
        queryKey: ["admin-parcel-tracking", debouncedSearch],
      });

      // Show a success indicator for this parcel (green border for 3 seconds)
      setSuccessId(parcelId);
      setTimeout(() => setSuccessId(""), 3000);
    },
  });

  /**
   * Handles the "Update" button click.
   * Takes the currently selected status from statusMap and triggers the mutation.
   */
  const handleUpdate = (parcel) => {
    const status = statusMap[parcel._id];
    if (!status) return;

    setErrorMsg(""); // clear previous error before new attempt

    updateStatus({
      parcelId: parcel._id,
      status,
      userEmail: parcel.userEmail,
    });
  };

  // ── Compute summary statistics from the parcel list ──────────────────────
  const stats = useMemo(
    () => ({
      total: parcels.length,
      // Pending includes everything except "completed"
      pending: parcels.filter((p) =>
        ["pending", "assigned", "taken", "shifted", "out for delivery"].includes(
          normalizeStatus(p.deliveryStatus)
        )
      ).length,
      completed: parcels.filter(
        (p) => normalizeStatus(p.deliveryStatus) === "completed"
      ).length,
    }),
    [parcels]
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 bg-base-200 p-4 rounded-box">
      {/* Header with title, search, and refresh button */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-bold text-base-content md:text-2xl">
            Parcel Tracking
          </h2>
          <p className="text-sm text-base-content/60">
            Update delivery status — changes reflect on the user's screen
            instantly
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="input input-bordered flex items-center gap-2">
            <Search size={18} className="text-base-content/50" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by tracking id, sender, receiver..."
              className="grow"
            />
          </label>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn btn-ghost btn-sm gap-2"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Total Parcels"
          value={stats.total}
          icon={<Truck size={20} />}
          color="text-primary bg-primary/10"
        />
        <StatCard
          title="Pending In Flow"
          value={stats.pending}
          icon={<Truck size={20} />}
          color="text-warning bg-warning/10"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={<Truck size={20} />}
          color="text-success bg-success/10"
        />
      </div>

      {/* Error message from mutation */}
      {errorMsg && (
        <div className="alert alert-error shadow-lg">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Error message from query */}
      {isError && (
        <div className="alert alert-error shadow-lg">
          <span>Failed to load parcels. Please refresh.</span>
        </div>
      )}

      {/* Parcel list card */}
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body p-0">
          {/* Card header with count and sync indicator */}
          <div className="flex items-center justify-between border-b border-base-300 px-4 py-4 md:px-5">
            <div>
              <h3 className="text-base font-semibold text-base-content">
                Parcel List
              </h3>
              <p className="text-sm text-base-content/60">
                {isFetching && !isLoading
                  ? "Syncing…"
                  : `${parcels.length} parcel${parcels.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {isFetching && !isLoading && (
              <span className="flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
            )}
          </div>

          {/* Loading / empty / content */}
          {isLoading ? (
            <TableSkeleton />
          ) : parcels.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-4 py-10 text-center">
              <p className="text-base font-semibold text-base-content">
                No parcels found
              </p>
              <p className="mt-1 text-sm text-base-content/60">
                Try a different keyword or refresh.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 md:p-5">
              {parcels.map((parcel) => {
                const isThisUpdating =
                  isUpdating && updatingVars?.parcelId === parcel._id;
                const isSuccess = successId === parcel._id;
                const currentSelectedStatus =
                  statusMap[parcel._id] || parcel.deliveryStatus || "pending";

                return (
                  <div
                    key={parcel._id}
                    className={`card border transition-all duration-300 ${
                      isSuccess
                        ? "border-success bg-success/5"
                        : "border-base-300 bg-base-200"
                    }`}
                  >
                    <div className="card-body p-4">
                      {/* Main row: tracking info + status controls */}
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-bold text-base-content">
                            {parcel.trackingId || parcel._id}
                          </p>
                          <p className="mt-0.5 text-sm text-base-content/70">
                            {parcel.parcelName || "Unnamed"} &bull; Sender:{" "}
                            <span className="font-medium text-base-content">
                              {parcel.senderName || "N/A"}
                            </span>{" "}
                            {" → "}Receiver:{" "}
                            <span className="font-medium text-base-content">
                              {parcel.receiverName || "N/A"}
                            </span>
                          </p>
                          {parcel.userEmail && (
                            <p className="mt-0.5 text-xs text-base-content/50">
                              Customer: {parcel.userEmail}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          {/* Current status badge */}
                          <StatusBadge status={parcel.deliveryStatus || "pending"} />

                          {/* Status dropdown */}
                          <select
                            value={currentSelectedStatus}
                            onChange={(e) =>
                              setStatusMap((prev) => ({
                                ...prev,
                                [parcel._id]: e.target.value,
                              }))
                            }
                            disabled={isThisUpdating}
                            className="select select-bordered select-sm w-full sm:w-auto"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>

                          {/* Update button */}
                          <button
                            onClick={() => handleUpdate(parcel)}
                            disabled={isThisUpdating}
                            className={`btn btn-sm ${
                              isSuccess ? "btn-success" : "btn-primary"
                            }`}
                          >
                            {isThisUpdating
                              ? "Updating…"
                              : isSuccess
                              ? "Updated ✓"
                              : "Update"}
                          </button>
                        </div>
                      </div>

                      {/* Additional mini info grid */}
                      <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4">
                        <MiniInfo
                          label="Payment"
                          value={capitalize(parcel.paymentStatus || "unpaid")}
                        />
                        <MiniInfo
                          label="Created"
                          value={formatDateTime(parcel.createdAt)}
                        />
                        <MiniInfo
                          label="Rider"
                          value={
                            parcel.assignedRiderName ||
                            parcel.assignedRiderEmail ||
                            "Not assigned"
                          }
                        />
                        <MiniInfo
                          label="Current Status"
                          value={capitalize(parcel.deliveryStatus || "pending")}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== Helper Components ====================

/**
 * Badge that displays a delivery status with appropriate DaisyUI colour.
 */
const StatusBadge = ({ status }) => {
  const normalized = normalizeStatus(status);
  let badgeClass = "badge badge-ghost"; // default

  if (normalized === "completed") badgeClass = "badge badge-success";
  else if (normalized === "assigned") badgeClass = "badge badge-info";
  else if (normalized === "taken") badgeClass = "badge badge-primary";
  else if (normalized === "shifted") badgeClass = "badge badge-secondary";
  else if (normalized === "out for delivery") badgeClass = "badge badge-warning";
  else if (normalized === "pending") badgeClass = "badge badge-ghost";
  else if (normalized === "cancelled") badgeClass = "badge badge-error";

  return <span className={`${badgeClass} capitalize`}>{status}</span>;
};

/**
 * Statistic card used in the top section.
 */
const StatCard = ({ title, value, icon, color = "text-primary bg-primary/10" }) => (
  <div className="card bg-base-100 border border-base-300 shadow-sm">
    <div className="card-body p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-base-content/60">{title}</p>
          <h3 className="mt-1 text-2xl font-bold text-base-content">{value}</h3>
        </div>
        <div className={`rounded-xl p-3 ${color}`}>{icon}</div>
      </div>
    </div>
  </div>
);

/**
 * Small info box used in the parcel row (payment, created, rider, etc.).
 */
const MiniInfo = ({ label, value }) => (
  <div className="bg-base-100 border border-base-300 rounded-xl p-3">
    <p className="text-[10px] uppercase tracking-wide text-base-content/50">{label}</p>
    <p className="mt-0.5 break-words text-sm font-medium text-base-content">{value}</p>
  </div>
);

/**
 * Skeleton loader displayed while initial data is loading.
 */
const TableSkeleton = () => (
  <div className="space-y-3 p-4 md:p-5">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-28 animate-pulse rounded-2xl bg-base-300" />
    ))}
  </div>
);

// ==================== Helper Functions ====================

/**
 * Normalizes a status string: trims, lowercases.
 */
const normalizeStatus = (s = "") => String(s).trim().toLowerCase();

/**
 * Capitalizes each word of a string (e.g., "out for delivery" → "Out For Delivery").
 */
const capitalize = (text = "") =>
  String(text)
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

/**
 * Formats a date/time to a locale string, or returns "—" if invalid/missing.
 */
const formatDateTime = (date) => {
  try {
    return date ? new Date(date).toLocaleString() : "—";
  } catch {
    return "—";
  }
};