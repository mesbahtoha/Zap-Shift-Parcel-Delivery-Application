import { createBrowserRouter } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import Home from "../pages/Home/Home";
import { Login } from "../pages/Authentication/Login/Login";
import { Register } from "../pages/Authentication/Register/Register";
import Coverage from "../coverage/Coverage";
import PrivateRoute from "../routes/PrivateRoute";
import PublicRoute from "../routes/PublicRoute";
import SendParcel from "../pages/SendParcel/SEndParcel";
import BeARider from "../pages/BeARider/BeARider";
import Profile from "../pages/shared/Navbar/Profile";
import DashboardLayout from "../layouts/DashboardLayout";
import MyParcels from "../pages/Dashboard/MyParcels/MyParcels";
import ViewMyParcel from "../pages/Dashboard/MyParcels/ViewMyParcel";
import Payment from "../pages/Dashboard/Payment/Payment";
import PaymentHistory from "../pages/Dashboard/Payment/PaymentHistory";
import Overview from "../pages/Dashboard/Overview/Overview";
import AddParcel from "../pages/Dashboard/AddParcel/AddParcel";
import RiderDashboardLayout from "../RiderRole/layouts/RiderDashboardLayout";
import RiderOverview from "../RiderRole/pages/Rider/RiderOverview";
import RiderTasks from "../RiderRole/pages/Rider/RiderTasks";
import RiderEarnings from "../RiderRole/pages/Rider/RiderEarnings";
import RiderProfile from "../RiderRole/pages/Rider/RiderProfile";
import PrivateRouteRider from "../RiderRole/routes/PrivateRouteRider";
import { AdminLayout } from "../Admin_Role/adminLayouts/AdminLayout";
import { AdminOverview } from "../Admin_Role/adminPages/Overview/AdminOverview";
import { ManageUSers } from "../Admin_Role/adminPages/ManageUsers/ManageUsers";
import { ParcelTracking } from "../Admin_Role/adminPages/ParcelTracking/ParcelTracking";
import { Payments } from "../Admin_Role/adminPages/Payments/Payments";
import { ManageRiders } from "../Admin_Role/adminPages/ManageRiders/ManageRiders";
import { AssignRider } from "../Admin_Role/adminPages/AssignRider/AssignRider";
import { RiderPAyments } from "../Admin_Role/adminPages/RiderPayments/RiderPayments";
import { RiderTaskUpdate } from "../Admin_Role/adminPages/RiderTaskUpdates/RiderTaskUpdates";
import { AdminNotifications } from "../Admin_Role/adminPages/Notifications/AdminNotifications";
import { Order } from "../Admin_Role/adminPages/Order/Order";
import { UserDetails } from "../Admin_Role/adminPages/ManageUsers/UserDetails";
import { OrderDetails } from "../Admin_Role/adminPages/Order/OrderDetails";
import { RiderDetails } from "../Admin_Role/adminPages/ManageRiders/RiderDetails";
import { RiderNotification } from "../RiderRole/pages/Rider/RiderNotification";
import { TrackParcel } from "../pages/Dashboard/TrackParcel/TrackParcel";
import About from "../pages/About/About";

export const router = createBrowserRouter([
  {
  path: "/",
  element: <RootLayout />,
  children: [
    { index: true, element: <Home /> },
    {
      path: "coverage",
      element: <Coverage />,
      loader: () => fetch("/serviceCenter.json"),
    },
    {
      path: "sendParcel",
      element: (
        <PrivateRoute>
          <SendParcel />
        </PrivateRoute>
      ),
      loader: () => fetch("/serviceCenter.json"),
    },
    {
      path: "profile",
      element: (
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      ),
    },
    {
      path: "beARider",
      element: (
        <PrivateRoute>
          <BeARider />
        </PrivateRoute>
      ),
    },
    {
      path: "about",
      Component: About
    }
  ],
},

  {
    path: "/login",
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },

  {
    path: "/register",
    element: (
      <PublicRoute>
        <Register />
      </PublicRoute>
    ),
  },

  {
    path: "/dashboard",
    element: (
      <PrivateRoute>
        <DashboardLayout />
      </PrivateRoute>
    ),
    children: [
      {
        path: "myParcels",
        element: <MyParcels />,
      },
      {
        path: "parcel/:id",
        element: <ViewMyParcel />,
      },
      {
        path: "payment/:id",
        element: <Payment />,
      },
      {
        path: "paymentHistory",
        element: <PaymentHistory />,
      },
      {
        path: "overview",
        element: <Overview />,
      },
      {
        path: "addParcel",
        element: <AddParcel />,
        loader: () => fetch("/serviceCenter.json"),
      },
      {
        path: "trackParcel",
        element: <TrackParcel />,
      },
    ],
  },

  {
    path: "/dashboard/rider",
    element: (
      <PrivateRouteRider>
        <RiderDashboardLayout />
      </PrivateRouteRider>
    ),
    children: [
      {
        path: "overview",
        element: <RiderOverview />,
      },
      {
        path: "tasks",
        element: <RiderTasks />,
      },

      {
        path: "earnings",
        element: <RiderEarnings />,
      },
      {
        path: "profile",
        element: <RiderProfile />,
      },
      {
        path: "riderNotification",
        element: <RiderNotification />,
      },
    ],
  },

  {
  path: "/Md.Mesbhaul_Alam_Toha",
  element: (
    <PrivateRoute>
      <AdminLayout />
    </PrivateRoute>
  ),
  children: [
    { index: true, element: <AdminOverview /> },
    { path: "overview", element: <AdminOverview /> },
    { path: "manage-user", element: <ManageUSers /> },
    { path: "manage-user/:id", element: <UserDetails /> },
    { path: "orders", element: <Order /> },
    { path: "orders/:id", element: <OrderDetails /> },
    { path: "parcel-tracking", element: <ParcelTracking /> },
    { path: "payment-receive", element: <Payments /> },
    { path: "manage-rider", element: <ManageRiders /> },
    {
      path: "manage-rider/:id",
      element: <RiderDetails />
    },
    { path: "rider-assign", element: <AssignRider /> },
    { path: "rider-payment", element: <RiderPAyments /> },
    { path: "rider-task-update", element: <RiderTaskUpdate /> },
    { path: "notifications", element: <AdminNotifications /> },
  ],
}

]);