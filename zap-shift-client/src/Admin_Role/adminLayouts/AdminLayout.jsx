import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminNavbar } from "../AdminComponents/AdminNavbar";
import { AdminSidebar } from "../AdminComponents/AdminSidebar";

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex min-h-screen flex-1 flex-col lg:ml-0">
          <AdminNavbar onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 md:p-6">
            <div className="min-h-[calc(100vh-100px)] rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};