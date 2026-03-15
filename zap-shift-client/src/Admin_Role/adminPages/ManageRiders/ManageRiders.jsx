import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Eye, RefreshCw, Search, UserCheck, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { riderProfileKey } from "../../../RiderRole/pages/Rider/RiderProfile";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("You must be logged in.");
  return await user.getIdToken();
};

// ─────────────────────────────────────────────
export const ManageRiders = () => {
  const queryClient  = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [search,     setSearch]     = useState("");   // debounced

  // debounce search
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchText(val);
    clearTimeout(window._riderSearchTimer);
    window._riderSearchTimer = setTimeout(() => setSearch(val.trim()), 500);
  };

  // ── Fetch riders ─────────────────────────────
  const {
    data:      riders = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-riders", search],
    queryFn: async () => {
      const token = await getToken();
      const qs    = search ? `?search=${encodeURIComponent(search)}` : "";
      const res   = await fetch(`${API_BASE_URL}/admin/riders${qs}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch riders");
      return Array.isArray(data) ? data : [];
    },
    refetchInterval:      15_000,   // ✅ auto-poll every 15s
    refetchOnWindowFocus: true,
    staleTime:            0,
  });

  // ── Approval mutation ─────────────────────────
  const {
    mutate:    updateApproval,
    variables: approvalVars,
    isPending: approvalPending,
  } = useMutation({
    mutationFn: async ({ riderId, approvalStatus }) => {
      const token = await getToken();
      const res   = await fetch(`${API_BASE_URL}/admin/riders/${riderId}/approval`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
        body:    JSON.stringify({ approvalStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update approval");
      return { ...data, riderId, approvalStatus };
    },
    onSuccess: (_, variables) => {
      // ✅ Optimistically update rider list immediately
      queryClient.setQueryData(["admin-riders", search], (old = []) =>
        old.map((r) =>
          r._id === variables.riderId
            ? {
                ...r,
                approvalStatus: variables.approvalStatus,
                workStatus: variables.approvalStatus === "approved" ? "free" : r.workStatus,
              }
            : r
        )
      );

      // ✅ Invalidate the rider's own profile query so RiderProfile
      //    page updates instantly when the admin approves/declines
      const rider = riders.find((r) => r._id === variables.riderId);
      if (rider?.email) {
        queryClient.invalidateQueries({ queryKey: riderProfileKey(rider.email) });
      }

      // Also refetch the full list to stay in sync
      queryClient.invalidateQueries({ queryKey: ["admin-riders", search] });
    },
  });

  // ── Stats ─────────────────────────────────────
  const stats = {
    total:    riders.length,
    pending:  riders.filter((r) => normalize(r.approvalStatus) === "pending").length,
    approved: riders.filter((r) => normalize(r.approvalStatus) === "approved").length,
    declined: riders.filter((r) => normalize(r.approvalStatus) === "declined").length,
  };

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 md:text-2xl">Manage Riders</h2>
          <p className="text-sm text-slate-500">Approve, decline and view rider details</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              value={searchText}
              onChange={handleSearchChange}
              placeholder="Search by name, email, phone..."
              className="w-full bg-transparent text-sm outline-none sm:w-72"
            />
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Total Riders" value={stats.total}    icon={<UserCheck size={20} />} />
        <StatCard title="Pending"      value={stats.pending}  icon={<RefreshCw size={20} />} />
        <StatCard title="Approved"     value={stats.approved} icon={<Check size={20} />}     />
        <StatCard title="Declined"     value={stats.declined} icon={<X size={20} />}         />
      </div>

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load riders. Please refresh.
        </div>
      )}

      {/* ── Rider list ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 md:px-5">
          <h3 className="text-base font-semibold text-slate-800">Rider Directory</h3>
          <p className="text-sm text-slate-500">Review rider applications and manage rider approval</p>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : riders.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-4 py-10 text-center">
            <p className="text-base font-semibold text-slate-700">No riders found</p>
            <p className="mt-1 text-sm text-slate-500">Try a different keyword or refresh.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 md:p-5">
            {riders.map((rider) => {
              const approvalStatus  = rider.approvalStatus || "pending";
              const isApproving     = approvalPending && approvalVars?.riderId === rider._id && approvalVars?.approvalStatus === "approved";
              const isDeclining     = approvalPending && approvalVars?.riderId === rider._id && approvalVars?.approvalStatus === "declined";

              return (
                <div key={rider._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    {/* Rider info */}
                    <div className="min-w-0 flex items-center gap-3">
                      <Avatar
                        src={rider.picture || rider.photoURL}
                        alt={rider.name || rider.email || "Rider"}
                        fallback={getInitials(rider.name || rider.email)}
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          {rider.name || "Unnamed Rider"}
                        </h3>
                        <p className="text-sm text-slate-500">Email: {rider.email || "N/A"}</p>
                        <p className="text-sm text-slate-500">Phone: {rider.phone || "N/A"}</p>
                        <p className="text-sm text-slate-500">Vehicle: {rider.vehicleType || "N/A"}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <ApprovalBadge status={approvalStatus} />
                      <WorkBadge     status={rider.workStatus || "free"} />

                      <button
                        onClick={() => updateApproval({ riderId: rider._id, approvalStatus: "approved" })}
                        disabled={isApproving || approvalStatus === "approved"}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isApproving ? "Approving…" : "Approve"}
                      </button>

                      <button
                        onClick={() => updateApproval({ riderId: rider._id, approvalStatus: "declined" })}
                        disabled={isDeclining || approvalStatus === "declined"}
                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDeclining ? "Declining…" : "Decline"}
                      </button>

                      <Link
                        to={`/Md.Mesbhaul_Alam_Toha/manage-rider/${rider._id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        <Eye size={16} />
                        Details
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MiniInfo label="Region"  value={rider.region || "N/A"}           />
                    <MiniInfo label="Hub"     value={rider.hub    || "N/A"}            />
                    <MiniInfo label="Age"     value={rider.age    || "N/A"}            />
                    <MiniInfo label="Created" value={formatDate(rider.created_at || rider.createdAt)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
const Avatar = ({ src, alt, fallback }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-700">
      {src && !imgError ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      ) : fallback}
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

const ApprovalBadge = ({ status }) => {
  const s = normalize(status);
  const style =
    s === "approved" ? "bg-emerald-100 text-emerald-700" :
    s === "declined" ? "bg-red-100 text-red-700"         :
                       "bg-amber-100 text-amber-700";
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium capitalize ${style}`}>
      {status}
    </span>
  );
};

const WorkBadge = ({ status }) => {
  const s = normalize(status);
  const style =
    s === "free" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700";
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium capitalize ${style}`}>
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

const TableSkeleton = () => (
  <div className="p-4 md:p-5">
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  </div>
);

const normalize   = (s = "") => String(s).trim().toLowerCase();
const getInitials = (text = "") =>
  text.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
const formatDate  = (date) => {
  if (!date) return "N/A";
  try { return new Date(date).toLocaleDateString(); } catch { return "N/A"; }
};