import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { getAuth } from "firebase/auth";

// Base API URL – hardcoded as per original, but you might want to use env variables
const API_BASE_URL = "http://localhost:3000";

/**
 * Retrieves the current Firebase user's ID token.
 * Throws an error if the user is not logged in.
 */
const getToken = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("You must login first");
  return await currentUser.getIdToken();
};

/**
 * Generic fetcher for authenticated GET requests.
 * @param {string} endpoint - API endpoint (e.g., "/admin/parcels/unassigned")
 * @returns {Promise<any>} Parsed JSON response
 */
const fetchData = async (endpoint) => {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "API Error");
  return data;
};

/**
 * Form component for assigning a rider to a specific parcel.
 * Uses react-hook-form and a mutation to send the assignment.
 */
const ParcelAssignForm = ({ parcel, riders, onSuccess }) => {
  const { register, handleSubmit, reset } = useForm();

  // Mutation to assign rider
  const assignMutation = useMutation({
    mutationFn: async ({ riderId, message }) => {
      const token = await getToken();
      const res = await fetch(
        `${API_BASE_URL}/admin/parcels/${parcel._id}/assign-rider`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ riderId, message }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to assign rider");
      return data;
    },
    onSuccess: () => {
      reset(); // Clear form fields
      onSuccess?.(); // Notify parent to refresh data
    },
  });

  // Handle form submission
  const onSubmit = (data) => {
    assignMutation.mutate({
      riderId: data.riderId,
      message: data.message,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border border-base-300 p-4 space-y-3 bg-base-100 shadow-sm"
    >
      {/* Parcel summary */}
      <div>
        <h4 className="font-semibold text-base-content">
          {parcel.trackingId || parcel.parcelName || "N/A"}
        </h4>
        <p className="text-sm text-base-content/70">
          Receiver: {parcel.receiverName || "N/A"}
        </p>
        <p className="text-sm text-base-content/50">
          Status: {parcel.deliveryStatus}
        </p>
      </div>

      {/* Optional message for rider */}
      <textarea
        placeholder="Message for rider (optional)"
        {...register("message")}
        rows={2}
        className="textarea textarea-bordered w-full bg-base-100"
      />

      {/* Rider selection dropdown */}
      <select
        {...register("riderId", { required: true })}
        className="select select-bordered w-full bg-base-100"
        defaultValue=""
      >
        <option value="" disabled>
          Select Rider
        </option>
        {riders.map((r) => (
          <option key={r._id} value={r._id}>
            {r.name} — {r.region || "N/A"} — {r.hub || "N/A"}
          </option>
        ))}
      </select>

      {/* Mutation feedback messages */}
      {assignMutation.isError && (
        <p className="text-error text-sm">{assignMutation.error?.message}</p>
      )}

      {assignMutation.isSuccess && (
        <p className="text-success text-sm">Rider assigned successfully!</p>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={assignMutation.isPending || riders.length === 0}
        className="btn btn-primary"
      >
        {assignMutation.isPending ? "Assigning..." : "Assign Rider"}
      </button>
    </form>
  );
};

export const AssignRider = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(""); // Search term for filtering riders

  // ── Queries ──────────────────────────────────────────────────────────────
  // Fetch unassigned parcels
  const parcelsQuery = useQuery({
    queryKey: ["unassigned-parcels"],
    queryFn: () => fetchData("/admin/parcels/unassigned"),
  });

  // Fetch available riders
  const ridersQuery = useQuery({
    queryKey: ["available-riders"],
    queryFn: () => fetchData("/admin/riders/available"),
  });

  // Fetch assigned tasks (riders with current assignments)
  const assignedQuery = useQuery({
    queryKey: ["assigned-riders"],
    queryFn: () => fetchData("/admin/rider-task-updates"),
  });

  // ── Filter riders based on search input ──────────────────────────────────
  const filteredRiders = useMemo(() => {
    if (!ridersQuery.data) return [];
    if (!search) return ridersQuery.data;

    const query = search.toLowerCase();
    return ridersQuery.data.filter((rider) =>
      // Search across multiple fields (if they exist)
      [rider.name, rider.email, rider.phone, rider.region, rider.hub, rider.vehicleType]
        .filter(Boolean) // Remove null/undefined
        .some((field) => field.toLowerCase().includes(query))
    );
  }, [search, ridersQuery.data]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  /** Refresh all data manually */
  const handleRefresh = () => {
    parcelsQuery.refetch();
    ridersQuery.refetch();
    assignedQuery.refetch();
  };

  /** Called after a successful assignment – invalidates queries to reflect new state */
  const handleAssignSuccess = () => {
    queryClient.invalidateQueries(["unassigned-parcels"]);
    queryClient.invalidateQueries(["available-riders"]);
    queryClient.invalidateQueries(["assigned-riders"]);
  };

  // ── Loading and error states ─────────────────────────────────────────────
  if (parcelsQuery.isLoading || ridersQuery.isLoading) {
    return (
      <div className="p-10 text-center text-base-content">
        Loading dashboard...
      </div>
    );
  }

  if (parcelsQuery.isError) {
    return (
      <div className="p-10 text-center text-error">
        Error: {parcelsQuery.error?.message}
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 bg-base-200 p-4 rounded-box">
      {/* Header with title and refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-base-content">Assign Rider</h2>
          <p className="text-sm text-base-content/60">
            Assign riders to pending parcels
          </p>
        </div>
        <button onClick={handleRefresh} className="btn btn-ghost btn-sm gap-2">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Search input for riders */}
      <input
        placeholder="Search rider by name, hub, region..."
        className="input input-bordered w-full bg-base-100"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Available riders list */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg text-base-content">
          Available Riders ({filteredRiders.length})
        </h3>

        {filteredRiders.length === 0 && (
          <p className="text-base-content/60 text-sm">
            {search
              ? "No riders match your search."
              : "No available riders at the moment."}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRiders.map((rider) => (
            <div
              key={rider._id}
              className="rounded-xl border border-base-300 p-4 bg-base-100 shadow-sm"
            >
              <h4 className="font-semibold text-base-content">{rider.name}</h4>
              <p className="text-sm text-base-content/70">
                Phone: {rider.phone || "N/A"}
              </p>
              <p className="text-sm text-base-content/70">
                Region: {rider.region || "N/A"}
              </p>
              <p className="text-sm text-base-content/70">
                Hub: {rider.hub || "N/A"}
              </p>
              <p className="text-sm text-base-content/70">
                Vehicle: {rider.vehicleType || "N/A"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Unassigned parcels – each gets an assignment form */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-base-content">
          Unassigned Parcels ({parcelsQuery.data?.length || 0})
        </h3>

        {parcelsQuery.data?.length === 0 && (
          <p className="text-base-content/60 text-sm">No unassigned parcels.</p>
        )}

        {parcelsQuery.data?.map((parcel) => (
          <ParcelAssignForm
            key={parcel._id}
            parcel={parcel}
            riders={filteredRiders}
            onSuccess={handleAssignSuccess}
          />
        ))}
      </div>

      {/* Currently assigned tasks */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-base-content">
          Assigned Tasks ({assignedQuery.data?.length || 0})
        </h3>

        {assignedQuery.isLoading && (
          <p className="text-base-content/60 text-sm">Loading...</p>
        )}

        {assignedQuery.data?.map((task) => (
          <div
            key={task._id}
            className="border border-base-300 rounded-xl p-4 bg-base-100 shadow-sm"
          >
            <h4 className="font-semibold text-base-content">{task.riderName}</h4>
            <p className="text-sm text-base-content/70">
              Email: {task.riderEmail}
            </p>
            <p className="text-sm text-base-content/70">
              Parcel: {task.parcelName || task.trackingId || "N/A"}
            </p>
            <p className="text-sm text-base-content/70">
              Status: {task.status}
            </p>
            <p className="text-sm text-base-content/70">
              Availability: {task.availability}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};