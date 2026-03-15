import { useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw, Search, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { getAuth } from "firebase/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const ManageUSers = () => {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchUsers = async ({ isRefresh = false } = {}) => {
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
        ? `${API_BASE_URL}/admin/users?${query.toString()}`
        : `${API_BASE_URL}/admin/users`;

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

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch]);

  const totalUsers = useMemo(() => users.length, [users]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
            Manage Users
          </h2>
          <p className="text-sm text-slate-500">
            Check accounts, search users, and view full details
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full bg-transparent text-sm outline-none sm:w-72"
            />
          </div>

          <button
            onClick={() => fetchUsers({ isRefresh: true })}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Total Users" value={totalUsers} icon={<Users size={20} />} />
        <StatCard
          title="Search Result"
          value={debouncedSearch ? totalUsers : "All"}
          icon={<Search size={20} />}
        />
        <StatCard
          title="Status"
          value={error ? "Error" : loading ? "Loading" : "Ready"}
          icon={<RefreshCw size={20} className={loading ? "animate-spin" : ""} />}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4 md:px-5">
          <h3 className="text-base font-semibold text-slate-800">User Directory</h3>
          <p className="text-sm text-slate-500">Latest registered and active users</p>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-4 py-10 text-center">
            <p className="text-base font-semibold text-red-600">Failed to load users</p>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <button
              onClick={() => fetchUsers()}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-4 py-10 text-center">
            <p className="text-base font-semibold text-slate-700">No users found</p>
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
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Total Parcels</th>
                    <th className="px-5 py-3">Account Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-t border-slate-100 text-sm">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={user.picture || user.photoURL}
                            alt={user.name || user.email || "User"}
                            fallback={getInitials(user.name || user.email)}
                          />
                          <div>
                            <p className="font-semibold text-slate-800">
                              {user.name || "Unnamed User"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Joined {formatDate(user.created_at || user.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">{user.email || "N/A"}</td>
                      <td className="px-5 py-4 text-slate-600">{user.totalParcels ?? 0}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={user.accountStatus || user.status || "active"} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/Md.Mesbhaul_Alam_Toha/manage-user/${user._id}`}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
                        >
                          <Eye size={14} />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.picture || user.photoURL}
                        alt={user.name || user.email || "User"}
                        fallback={getInitials(user.name || user.email)}
                      />
                      <div>
                        <p className="font-semibold text-slate-800">
                          {user.name || "Unnamed User"}
                        </p>
                        <p className="text-xs text-slate-500">{user.email || "N/A"}</p>
                      </div>
                    </div>
                    <StatusBadge status={user.accountStatus || user.status || "active"} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <MiniInfo label="Parcels" value={user.totalParcels ?? 0} />
                    <MiniInfo
                      label="Joined"
                      value={formatDate(user.created_at || user.createdAt)}
                    />
                  </div>

                  <div className="mt-4">
                    <Link
                      to={`/Md.Mesbhaul_Alam_Toha/manage-user/${user._id}`}
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

const Avatar = ({ src, alt, fallback }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-700">
      {src && !imgError ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        fallback
      )}
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
  const value = String(status).toLowerCase();

  const styles =
    value === "active"
      ? "bg-emerald-100 text-emerald-700"
      : value === "blocked"
      ? "bg-red-100 text-red-700"
      : value === "inactive"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700";

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

const getInitials = (text = "") => {
  return text
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
};

const formatDate = (date) => {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return "N/A";
  }
};