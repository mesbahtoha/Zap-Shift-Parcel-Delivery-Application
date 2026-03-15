import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import {
  Home,
  Package,
  CreditCard,
  MapPinned,
  Menu,
  LogOut,
  LayoutDashboard,
  User,
  PlusCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ProfastLogo from "../pages/shared/ProfastLogo/ProfastLogo";
import useAuth from "../hooks/useAuth";
import useAxiosSecure from "../hooks/useAxiosSecure";

const DashboardLayout = () => {
  const { user, logOut } = useAuth();
  const axiosSecure = useAxiosSecure();
  const navigate = useNavigate();

  const defaultAvatar =
    "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp";

  const avatarSrc = user?.photoURL || defaultAvatar;

  /**
   * Shared sidebar nav link styles
   */
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
      isActive
        ? "bg-primary text-primary-content shadow-sm"
        : "text-base-content/80 hover:bg-base-300 hover:text-base-content"
    }`;

  /**
   * Fetch unread notification count
   * This is currently kept because the original logic exists,
   * even though the notification UI is commented out.
   */
  const { data: unreadData } = useQuery({
    queryKey: ["unreadCount", user?.email],
    queryFn: async () => {
      const res = await axiosSecure.get("/user/notification/unread-count");
      return res.data || { count: 0 };
    },
    enabled: !!user?.email,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const unreadCount = unreadData?.count ?? 0;

  /**
   * Logout handler
   */
  const handleLogout = () => {
    logOut()
      .then(() => navigate("/"))
      .catch(() => {});
  };

  return (
    <div className="drawer min-h-screen bg-base-100 lg:drawer-open">
      <input id="dashboard-drawer" type="checkbox" className="drawer-toggle" />

      {/* Main content area */}
      <div className="drawer-content flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <label
                htmlFor="dashboard-drawer"
                className="btn btn-ghost btn-square lg:hidden"
                aria-label="open sidebar"
              >
                <Menu className="h-6 w-6" />
              </label>

              <div>
                <h1 className="text-lg font-bold text-base-content md:text-xl">
                  Dashboard
                </h1>
                <p className="hidden text-sm text-base-content/60 sm:block">
                  Manage your parcels, payments and tracking
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/"
                className="hidden rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-content transition hover:opacity-90 md:inline-block"
              >
                Back to Home
              </Link>

              {/* User dropdown */}
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost btn-circle avatar"
                >
                  <div className="w-9 rounded-full ring ring-primary/30 ring-offset-2 ring-offset-base-100 md:w-10">
                    <img
                      alt="User avatar"
                      src={avatarSrc}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                <ul
                  tabIndex={0}
                  className="menu menu-sm dropdown-content z-[100] mt-3 w-56 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-lg"
                >
                  <li className="pointer-events-none mb-1 px-2 py-2">
                    <div className="flex flex-col">
                      <span className="font-semibold text-base-content">
                        {user?.displayName || "User"}
                      </span>
                      <span className="break-all text-xs text-base-content/60">
                        {user?.email || "No email"}
                      </span>
                    </div>
                  </li>

                  <li>
                    <Link to="/profile">
                      <User className="h-4 w-4" /> Profile
                    </Link>
                  </li>

                  <li>
                    <button type="button" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </header>

        {/* Routed page content */}
        <main className="flex-1 bg-base-200 p-4 text-base-content md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-40">
        <label
          htmlFor="dashboard-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        />

        <aside className="flex min-h-full w-80 flex-col border-r border-base-300 bg-base-100">
          {/* Sidebar top logo */}
          <div className="border-b border-base-300 px-5 py-5">
            <ProfastLogo />
          </div>

          {/* User summary */}
          <div className="border-b border-base-300 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="w-12 rounded-full ring ring-primary/30 ring-offset-2 ring-offset-base-100">
                  <img
                    src={avatarSrc}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <div className="min-w-0">
                <h3 className="truncate font-semibold text-base-content">
                  {user?.displayName || "User"}
                </h3>
                <p className="truncate text-sm text-base-content/60">
                  {user?.email || "No email"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-base-content/40">
              Main Menu
            </div>

            <nav className="space-y-1">
              <NavLink to="/" end className={navLinkClass}>
                <Home className="h-5 w-5" />
                <span>Home</span>
              </NavLink>

              <NavLink to="/dashboard/overview" className={navLinkClass}>
                <LayoutDashboard className="h-5 w-5" />
                <span>Overview</span>
              </NavLink>

              <NavLink to="/dashboard/addParcel" className={navLinkClass}>
                <PlusCircle className="h-5 w-5" />
                <span>Add Parcel</span>
              </NavLink>

              <NavLink to="/dashboard/myParcels" className={navLinkClass}>
                <Package className="h-5 w-5" />
                <span>My Parcels</span>
              </NavLink>

              <NavLink to="/dashboard/paymentHistory" className={navLinkClass}>
                <CreditCard className="h-5 w-5" />
                <span>Payment History</span>
              </NavLink>

              <NavLink to="/dashboard/trackParcel" className={navLinkClass}>
                <MapPinned className="h-5 w-5" />
                <span>Track Parcel</span>
              </NavLink>
            </nav>
          </div>

          {/* Sidebar logout button */}
          <div className="border-t border-base-300 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-error/10 px-4 py-3 text-sm font-semibold text-error transition hover:bg-error/20"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DashboardLayout;