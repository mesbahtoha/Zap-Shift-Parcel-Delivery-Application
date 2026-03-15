import { Outlet } from "react-router";
import Navbar from "../pages/shared/Navbar/Navbar";
import Footer from "../pages/shared/Footer/Footer";

const RootLayout = () => {
  return (
    <div className="bg-base-200 text-base-content">
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>

      <main className="min-h-screen py-3">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default RootLayout;