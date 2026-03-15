import { useQuery } from "@tanstack/react-query";
import useAuth from "../../../hooks/useAuth";
import useAxiosSecure from "../../../hooks/useAxiosSecure";

const PaymentHistory = () => {
  const { user } = useAuth();
  const axiosSecure = useAxiosSecure();

  const {
    data: payments = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["payment-history", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const res = await axiosSecure.get(`/payments/${user.email}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <span className="loading loading-spinner loading-lg text-success"></span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="alert alert-error shadow-md">
          <span>
            Failed to load payment history: {error?.message || "Unknown error"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 max-w-full">
      <div className="bg-base-100 shadow-xl rounded-2xl border border-base-200 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-base-200 bg-base-100">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-success">
            Payment History
          </h2>
          <p className="text-center text-sm text-gray-500 mt-2">
            Total Payments: {payments.length}
          </p>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-600">
              No payment history found
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Your completed payment records will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table table-zebra w-full min-w-[1050px]">
              <thead className="bg-base-200 text-base-content">
                <tr>
                  <th>#</th>
                  <th>Transaction ID</th>
                  <th>Parcel Name</th>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Date & Time</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment, index) => (
                  <tr key={payment._id || payment.transactionId}>
                    <td className="font-medium">{index + 1}</td>

                    {/* Transaction ID */}
                    <td>
                      <div
                        className="max-w-[220px] truncate font-mono text-xs"
                        title={payment.transactionId}
                      >
                        {payment.transactionId}
                      </div>
                    </td>

                    {/* Parcel Name */}
                    <td>
                      <div
                        className="max-w-[180px] truncate"
                        title={payment.parcelName}
                      >
                        {payment.parcelName || "N/A"}
                      </div>
                    </td>

                    {/* Email */}
                    <td>
                      <div
                        className="max-w-[220px] truncate"
                        title={payment.email}
                      >
                        {payment.email}
                      </div>
                    </td>

                    {/* Amount */}
                    <td>
                      <div className="space-y-1">
                        <p className="font-semibold text-success">
                          ৳ {payment.amountTaka ?? 0}
                        </p>
                        <p className="text-xs text-gray-500">
                          $ {Number(payment.amountUsd ?? 0).toFixed(2)}
                        </p>
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td>
                      <span className="badge badge-outline badge-info whitespace-nowrap py-3 px-3">
                        {payment.paymentMethod || "Card"}
                      </span>
                    </td>

                    {/* Date */}
                    <td>
                      <div className="whitespace-nowrap text-sm">
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleString("en-BD", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: true,
                            })
                          : "N/A"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;