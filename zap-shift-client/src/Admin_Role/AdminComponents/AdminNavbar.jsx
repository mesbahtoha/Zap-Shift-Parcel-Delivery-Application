import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Menu,
  Search,
  ChevronDown,
  LogOut,
  User,
  RefreshCw,
} from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { Link } from "react-router";

const API_BASE_URL = "http://localhost:3000";

const getToken = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must login first.");
  }

  return await currentUser.getIdToken();
};

const getInitials = (name = "", email = "") => {
  if (name?.trim()) {
    return name
      .trim()
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }

  return email?.[0]?.toUpperCase() || "A";
};

export const AdminNavbar = ({
  onMenuClick,
  onSearch,
  onOpenNotifications,
}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [searchText, setSearchText] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const adminName = currentUser?.displayName || "Admin";
  const adminEmail = currentUser?.email || "admin@example.com";
  const adminPhoto = currentUser?.photoURL || "";
  const initials = getInitials(adminName, adminEmail);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);

      const token = await getToken();

      const res = await fetch(`${API_BASE_URL}/admin/notifications`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch notifications");
      }

      setNotifications(Array.isArray(data) ? data.slice(0, 6) : []);
    } catch (error) {
      console.error("Navbar notifications error:", error.message);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (typeof onSearch === "function") {
      onSearch(searchText.trim());
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = await getToken();

      const res = await fetch(`${API_BASE_URL}/admin/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, isRead: true } : item
        )
      );
    } catch (error) {
      // console.error("Failed to mark notification as read");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      // console.error("Logout failed:", error.message);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-lg font-semibold text-gray-800 md:text-xl">
            Admin Dashboard
          </h1>
          <p className="text-xs text-gray-500">
            Manage users, riders, parcels, and payments
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">

        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setNotificationOpen((prev) => !prev)}
            className="relative rounded-full p-2 text-gray-700 hover:bg-gray-100"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-[340px] rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Notifications
                  </h3>
                  <p className="text-xs text-gray-500">
                    {unreadCount} unread
                  </p>
                </div>

                <button
                  onClick={fetchNotifications}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <RefreshCw
                    size={16}
                    className={loadingNotifications ? "animate-spin" : ""}
                  />
                </button>
              </div>

              <div className="max-h-96 space-y-2 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
                    No notifications found
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => handleMarkAsRead(item._id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        item.isRead
                          ? "border-gray-200 bg-white"
                          : "border-blue-200 bg-blue-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {item.title || "Notification"}
                          </p>
                          <p className="mt-1 text-xs text-gray-600">
                            {item.message || "No message"}
                          </p>
                          <p className="mt-2 text-[11px] text-gray-400">
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleString()
                              : ""}
                          </p>
                        </div>

                        {!item.isRead && (
                          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="mt-3 border-t border-gray-100 pt-3">
                <Link
                to="/Md.Mesbhaul_Alam_Toha/notifications"
                  onClick={() => {
                    setNotificationOpen(false);
                    if (typeof onOpenNotifications === "function") {
                      onOpenNotifications();
                    }
                  }}
                  className="w-full rounded-xl bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2 hover:bg-gray-50"
          >
            {adminPhoto ? (
              <img
                src={adminPhoto}
                alt="Admin"
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {initials}
              </div>
            )}

            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-gray-800">{adminName}</p>
              <p className="max-w-[180px] truncate text-xs text-gray-500">
                {adminEmail}
              </p>
            </div>

            <ChevronDown size={16} className="hidden text-gray-500 sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-800">{adminName}</p>
                <p className="text-xs text-gray-500">{adminEmail}</p>
              </div>

              <div className="mt-2 space-y-1">
                {/* <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <User size={16} />
                  Profile
                </button> */}

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};