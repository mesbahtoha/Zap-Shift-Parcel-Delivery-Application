import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Truck,
  CheckCircle2,
  CreditCard,
  Send,
  MapPinned,
  History,
  PlusCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import useAxiosSecure from "../../../hooks/useAxiosSecure";

/**
 * Normalize status text for safe comparisons
 */
const norm = (value = "") => String(value).trim().toLowerCase();

/**
 * Format parcel date for display
 */
const formatDate = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const Overview = () => {
  const { user } = useAuth();
  const axiosSecure = useAxiosSecure();

  /**
   * Fetch all parcels of the logged-in user
   */
  const { data: parcels = [], isLoading } = useQuery({
    queryKey: ["overview-parcels", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const res = await axiosSecure.get(`/parcels/user/${user.email}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  /**
   * Build dashboard summary from parcel data
   */
  const summary = useMemo(() => {
    const totalParcels = parcels.length;

    const delivered = parcels.filter(
      (parcel) => norm(parcel.deliveryStatus) === "completed"
    ).length;

    // Fixed: "In Progress" means every parcel except completed or cancelled
    const inDelivery = parcels.filter(
      (parcel) =>
        !["completed", "cancelled"].includes(norm(parcel.deliveryStatus))
    ).length;

    const pending = parcels.filter(
      (parcel) => norm(parcel.deliveryStatus) === "pending"
    ).length;

    const totalPayments = parcels.reduce((sum, parcel) => {
      if (parcel.paymentStatus === "paid") {
        return sum + Number(parcel.cost || parcel.amountTaka || 0);
      }
      return sum;
    }, 0);

    return {
      totalParcels,
      delivered,
      inDelivery,
      totalPayments,
      pending,
    };
  }, [parcels]);

  /**
   * Show the latest 5 parcels first
   */
  const recentParcels = [...parcels]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  /**
   * Prevent divide-by-zero when calculating percentages
   */
  const safePercent = (value) => {
    if (!summary.totalParcels) return 0;
    return Math.round((value / summary.totalParcels) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <span className="loading loading-spinner loading-lg text-lime-500"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-3xl bg-gradient-to-r from-lime-100 to-lime-50 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
          Welcome back, {user?.displayName || "User"} 👋
        </h1>
        <p className="mt-2 text-sm text-gray-600 md:text-base">
          Here’s a quick summary of your parcels, payments, and recent activity.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-base-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Parcels</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">
                {summary.totalParcels}
              </h3>
            </div>
            <div className="rounded-2xl bg-lime-100 p-3 text-lime-700">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-base-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">
                {summary.inDelivery}
              </h3>
            </div>
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
              <Truck className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-base-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Delivered</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">
                {summary.delivered}
              </h3>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-base-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Payments</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-800">
                ৳ {summary.totalPayments}
              </h3>
            </div>
            <div className="rounded-2xl bg-orange-100 p-3 text-orange-700">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent parcels table */}
        <div className="xl:col-span-2 rounded-2xl bg-white p-5 shadow-sm border border-base-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Recent Parcels</h2>
            <Link
              to="/dashboard/myParcels"
              className="text-sm font-medium text-lime-600 hover:underline"
            >
              View all
            </Link>
          </div>

          {recentParcels.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-8 text-center text-gray-500">
              No parcels found yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full min-w-[700px]">
                <thead>
                  <tr className="text-gray-500">
                    <th>#</th>
                    <th>Parcel Name</th>
                    <th>Parcel Id</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {recentParcels.map((parcel, index) => (
                    <tr key={parcel._id} className="hover">
                      <td>{index + 1}</td>

                      <td className="font-medium text-gray-800">
                        {parcel.parcelName?.slice(-6) || "N/A"}
                      </td>

                      <td>{parcel._id || parcel.receiver || "N/A"}</td>

                      <td>
                        <span className="badge badge-outline">
                          {parcel.deliveryStatus || parcel.status || "Pending"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            parcel.paymentStatus === "paid"
                              ? "badge-success"
                              : "badge-warning"
                          }`}
                        >
                          {parcel.paymentStatus || "unpaid"}
                        </span>
                      </td>

                      <td>{formatDate(parcel.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right side widgets */}
        <div className="space-y-6">
          {/* Delivery progress */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-base-200">
            <h2 className="mb-4 text-xl font-bold text-gray-800">
              Delivery Status
            </h2>

            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-gray-600">Delivered</span>
                  <span className="font-semibold text-gray-800">
                    {safePercent(summary.delivered)}%
                  </span>
                </div>
                <progress
                  className="progress progress-success w-full"
                  value={summary.delivered}
                  max={summary.totalParcels || 1}
                ></progress>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-gray-600">In Progress</span>
                  <span className="font-semibold text-gray-800">
                    {safePercent(summary.inDelivery)}%
                  </span>
                </div>
                <progress
                  className="progress progress-info w-full"
                  value={summary.inDelivery}
                  max={summary.totalParcels || 1}
                ></progress>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-semibold text-gray-800">
                    {safePercent(summary.pending)}%
                  </span>
                </div>
                <progress
                  className="progress progress-warning w-full"
                  value={summary.pending}
                  max={summary.totalParcels || 1}
                ></progress>
              </div>
            </div>
          </div>

          {/* Quick action links */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-base-200">
            <h2 className="mb-4 text-xl font-bold text-gray-800">
              Quick Actions
            </h2>

            <div className="grid gap-3">
              <Link
                to="/dashboard/addParcel"
                className="flex items-center gap-3 rounded-xl bg-lime-50 px-4 py-3 text-gray-800 transition hover:bg-lime-100"
              >
                <PlusCircle className="h-5 w-5 text-lime-700" />
                <span className="font-medium">Add Parcel</span>
              </Link>

              <Link
                to="/sendParcel"
                className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-gray-800 transition hover:bg-emerald-100"
              >
                <Send className="h-5 w-5 text-emerald-700" />
                <span className="font-medium">Send Parcel</span>
              </Link>

              <Link
                to="/dashboard/trackParcel"
                className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-gray-800 transition hover:bg-blue-100"
              >
                <MapPinned className="h-5 w-5 text-blue-700" />
                <span className="font-medium">Track Parcel</span>
              </Link>

              <Link
                to="/dashboard/paymentHistory"
                className="flex items-center gap-3 rounded-xl bg-orange-50 px-4 py-3 text-gray-800 transition hover:bg-orange-100"
              >
                <History className="h-5 w-5 text-orange-700" />
                <span className="font-medium">Payment History</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;