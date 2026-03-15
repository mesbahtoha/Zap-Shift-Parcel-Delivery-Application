import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import Swal from "sweetalert2";

const MyParcels = () => {
  const { user } = useAuth();
  const axiosSecure = useAxiosSecure();
  const navigate = useNavigate();

  const { data: parcels = [], refetch } = useQuery({
    queryKey: ["my-parcels", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const res = await axiosSecure.get(`/parcels/user/${user.email}`);
      return res.data;
    },
  });

  const handleDelete = (id, parcelName) => {
    Swal.fire({
      title: `Delete "${parcelName}"?`,
      text: "This parcel will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      background: "#1f2937",
      color: "#f9fafb",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    }).then((result) => {
      if (result.isConfirmed) {
        axiosSecure.delete(`/parcels/${id}`).then((res) => {
          if (res.data.deletedCount > 0) {
            Swal.fire({
              title: "Deleted!",
              text: `"${parcelName}" has been removed.`,
              icon: "success",
              background: "#1f2937",
              color: "#f9fafb",
              confirmButtonColor: "#84cc16",
            });
            refetch();
          }
        });
      }
    });
  };

  return (
    <div className="p-6 text-base-content">
      <h2 className="text-2xl font-bold mb-6">
        My Parcels ({parcels.length})
      </h2>

      <div className="overflow-x-auto bg-base-100 rounded-xl shadow border border-base-300">
        <table className="table text-base-content">
          <thead className="bg-base-200 text-base-content">
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Type</th>
              <th>Created</th>
              <th>Cost</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {parcels.map((parcel, index) => (
              <tr key={parcel._id} className="hover:bg-base-200/60">
                <td>{index + 1}</td>
                <td>{parcel.parcelName || "Untitled"}</td>
                <td>
                  {parcel.type === "document" ? "Document" : "Non-Document"}
                </td>
                <td>{new Date(parcel.createdAt).toLocaleDateString()}</td>
                <td>৳{parcel.cost || 0}</td>
                <td>
                  {parcel.paymentStatus === "paid" ? (
                    <span className="badge badge-success">Paid</span>
                  ) : (
                    <span className="badge badge-error">Unpaid</span>
                  )}
                </td>
                <td className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => navigate(`/dashboard/parcel/${parcel._id}`)}
                    className="btn btn-sm btn-info"
                  >
                    View
                  </button>

                  {parcel.paymentStatus === "unpaid" && (
                    <button
                      onClick={() =>
                        navigate(`/dashboard/payment/${parcel._id}`)
                      }
                      className="btn btn-sm btn-success"
                    >
                      Pay
                    </button>
                  )}

                  <button
                    onClick={() =>
                      handleDelete(parcel._id, parcel.parcelName || "Untitled")
                    }
                    className="btn btn-sm btn-error"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyParcels;