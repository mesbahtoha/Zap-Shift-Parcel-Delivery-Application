import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  Bike,
  ClipboardList,
  Wallet,
  Bell,
  X,
} from "lucide-react";

/**
 * Sidebar navigation items for admin panel
 */
const navItems = [
  {
    name: "Overview",
    path: "/Md.Mesbhaul_Alam_Toha/overview",
    icon: LayoutDashboard,
  },
  {
    name: "Manage User",
    path: "/Md.Mesbhaul_Alam_Toha/manage-user",
    icon: Users,
  },
  {
    name: "Orders",
    path: "/Md.Mesbhaul_Alam_Toha/orders",
    icon: ClipboardList,
  },
  {
    name: "Parcel Tracking",
    path: "/Md.Mesbhaul_Alam_Toha/parcel-tracking",
    icon: Package,
  },
  {
    name: "Payment Receive",
    path: "/Md.Mesbhaul_Alam_Toha/payment-receive",
    icon: CreditCard,
  },
  {
    name: "Manage Rider",
    path: "/Md.Mesbhaul_Alam_Toha/manage-rider",
    icon: Bike,
  },
  {
    name: "Rider Assign",
    path: "/Md.Mesbhaul_Alam_Toha/rider-assign",
    icon: ClipboardList,
  },
  {
    name: "Rider Payment",
    path: "/Md.Mesbhaul_Alam_Toha/rider-payment",
    icon: Wallet,
  },
  {
    name: "Rider Task Update",
    path: "/Md.Mesbhaul_Alam_Toha/rider-task-update",
    icon: Package,
  },
  {
    name: "Notifications",
    path: "/Md.Mesbhaul_Alam_Toha/notifications",
    icon: Bell,
  },
];

/**
 * Shared nav link style
 */
const getNavLinkClass = (isActive) =>
  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
    isActive
      ? "bg-blue-600 text-white shadow-md"
      : "text-gray-300 hover:bg-white/10 hover:text-white"
  }`;

export const AdminSidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sidebar
          - Mobile: fixed slide drawer
          - Large screen: sticky sidebar that stays visible while scrolling
      */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-gray-900 text-white shadow-xl transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold tracking-wide">Admin Panel</h2>
            <p className="text-xs text-gray-300">Parcel Management System</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => getNavLinkClass(isActive)}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Admin Route</p>
            <p className="mt-1 break-all text-xs text-gray-300">
              /Md.Mesbhaul_Alam_Toha
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};