import { useQuery } from "@tanstack/react-query";
import { FiBell, FiMenu } from "react-icons/fi";
import { Link } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import { riderUnreadCountKey } from "../../pages/Rider/RiderNotification";

const RiderTopbar = ({ onMenuClick }) => {
  const { user }    = useAuth();
  const axiosSecure = useAxiosSecure();

  // ✅ Live unread count — same queryKey as sidebar so they share one request
  const { data: unreadData } = useQuery({
    queryKey: riderUnreadCountKey(user?.email),
    queryFn:  async () => {
      const res = await axiosSecure.get("/rider/notifications/unread-count");
      return res.data || { count: 0 };
    },
    enabled:              !!user?.email,
    refetchInterval:      15_000,
    refetchOnWindowFocus: true,
    staleTime:            0,
  });

  const unreadCount = unreadData?.count ?? 0;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm sm:px-5">
      <div className="flex items-center justify-between gap-4">

        {/* Left — hamburger + title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="btn btn-ghost btn-sm lg:hidden"
          >
            <FiMenu size={22} />
          </button>

          <div>
            <h1 className="text-lg font-bold text-[#083c46] sm:text-2xl">
              Rider Dashboard
            </h1>
            <p className="mt-0.5 hidden text-sm text-gray-500 sm:block">
              Manage deliveries, track progress, and view your earnings.
            </p>
          </div>
        </div>

        {/* Right — bell + avatar */}
        <div className="flex items-center gap-3">

          {/* Notification bell */}
          <Link
            to="/dashboard/rider/riderNotification"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-[#083c46]"
            aria-label="Notifications"
          >
            <FiBell size={20} />

            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white shadow">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}

            {/* Ping animation when there are unread */}
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-50" />
              </span>
            )}
          </Link>

          {/* User info — hidden on mobile */}
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-gray-800">
              {user?.displayName || "Rider"}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>

          {/* Avatar */}
          <img
            src={user?.photoURL || "https://i.ibb.co/4pDNDk1/avatar-placeholder.png"}
            alt="Rider"
            className="h-10 w-10 rounded-full border object-cover sm:h-11 sm:w-11"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
};

export default RiderTopbar;