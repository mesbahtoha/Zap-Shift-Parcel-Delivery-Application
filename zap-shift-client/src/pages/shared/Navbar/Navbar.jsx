import { Link, NavLink, useNavigate } from "react-router-dom";
import ProfastLogo from "../ProfastLogo/ProfastLogo";
import useAuth from "../../../hooks/useAuth";
import {
  FiHome,
  FiBox,
  FiGrid,
  FiMapPin,
  FiInfo,
  FiUser,
  FiLogOut,
} from "react-icons/fi";
import { Bike } from "lucide-react";

const Navbar = () => {
  const { user, logOut, loading } = useAuth();
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 transition duration-200 ${
      isActive
        ? "text-primary font-semibold border-b-2 border-primary"
        : "text-base-content hover:text-primary"
    }`;

  const navItems = (
    <>
      <li>
        <NavLink to="/" className={navLinkClass}>
          <FiHome size={18} />
          Home
        </NavLink>
      </li>

      <li>
        <NavLink to="/sendParcel" className={navLinkClass}>
          <FiBox size={18} />
          Add Parcel
        </NavLink>
      </li>

      {user && (
        <li>
          <NavLink to="/dashboard/overview" className={navLinkClass}>
            <FiGrid size={18} />
            Dashboard
          </NavLink>
        </li>
      )}

      <li>
        <NavLink to="/coverage" className={navLinkClass}>
          <FiMapPin size={18} />
          Coverage
        </NavLink>
      </li>

      <li>
        <NavLink to="/beARider" className={navLinkClass}>
          <Bike size={18} />
          Be a Rider
        </NavLink>
      </li>

      <li>
        <NavLink to="/about" className={navLinkClass}>
          <FiInfo size={18} />
          About Us
        </NavLink>
      </li>
    </>
  );

  const handleLogout = () => {
    logOut()
      .then(() => {
        navigate("/", { replace: true });
      })
      .catch((error) => {
        // console.log(error);
      });
  };

  const renderAuthSection = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end gap-2">
            <div className="h-3 w-20 rounded-full bg-base-300 animate-pulse"></div>
            <div className="h-3 w-16 rounded-full bg-base-300 animate-pulse"></div>
          </div>
          <div className="w-10 h-10 rounded-full bg-base-300 animate-pulse border border-base-300"></div>
        </div>
      );
    }

    if (user) {
      return (
        <div className="dropdown dropdown-end relative">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
          >
            <div className="w-9 md:w-10 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100">
              <img
                alt="User avatar"
                src={
                  user?.photoURL ||
                  "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                }
              />
            </div>
          </div>

          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content absolute right-0 top-full mt-3 w-56 rounded-box bg-base-100 text-base-content p-2 shadow z-[100]"
          >
            <li>
              <Link className="font-bold flex items-center gap-2" to="/profile">
                <FiUser size={18} />
                Profile
              </Link>
            </li>
            <li>
              <button
                onClick={handleLogout}
                type="button"
                className="font-bold flex items-center gap-2"
              >
                <FiLogOut size={18} />
                Logout
              </button>
            </li>
          </ul>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Link to="/login" className="btn btn-sm md:btn-md btn-primary">
          🔐 <span className="hidden sm:inline">Sign In</span>
        </Link>

        <Link to="/register" className="btn btn-sm md:btn-md btn-outline btn-primary">
          👤 <span className="hidden sm:inline">Sign Up</span>
        </Link>
      </div>
    );
  };

  return (
    <div
      className="navbar relative z-50 bg-base-100 text-base-content shadow-sm rounded-xl max-w-11/12 mx-auto overflow-visible"
      data-aos="fade-down"
    >
      <div className="navbar-start">
        <div className="dropdown relative">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>

          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content absolute left-0 top-full mt-3 w-52 rounded-box bg-base-100 text-base-content p-2 shadow z-[100]"
          >
            {navItems}
          </ul>
        </div>

        <ProfastLogo className="btn btn-ghost text-xl" />
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">{navItems}</ul>
      </div>

      <div className="navbar-end">{renderAuthSection()}</div>
    </div>
  );
};

export default Navbar;