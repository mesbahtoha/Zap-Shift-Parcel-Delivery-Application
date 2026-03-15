import { useState } from "react";
import { Outlet } from "react-router-dom";
import RiderSidebar from "../components/Rider/RiderSidebar";
import RiderTopbar from "../components/Rider/RiderTopbar";

const RiderDashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <RiderSidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar Drawer */}
        <div
          className={`fixed left-0 top-0 z-50 h-full w-72 transform bg-white transition-transform duration-300 lg:hidden ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <RiderSidebar onNavigate={() => setSidebarOpen(false)} mobile />
        </div>

        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
          <RiderTopbar onMenuClick={() => setSidebarOpen(true)} />
          <div className="mt-4 sm:mt-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default RiderDashboardLayout;