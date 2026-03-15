import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import {
  FaBox,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaArrowLeft,
  FaCreditCard,
  FaUser,
  FaMapMarkerAlt,
  FaWeightHanging,
  FaTruck,
} from "react-icons/fa";

const ViewMyParcel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const axiosSecure = useAxiosSecure();

  const {
    data: parcel,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["parcel", id],
    queryFn: async () => {
      const res = await axiosSecure.get(`/parcels/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        Error fetching parcel!
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100"
      >
        <FaArrowLeft /> Back
      </button>

      <div className="space-y-6 rounded-2xl bg-white p-5 shadow-lg md:p-6">
        <div className="border-b pb-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            <FaBox />
            {parcel.parcelName || "Untitled Parcel"} Details
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Full parcel information, sender/receiver details, payment status,
            and delivery status
          </p>
        </div>

        {/* Parcel Information */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">
            Parcel Information
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoCard
              label="Parcel Name"
              value={parcel.parcelName || "N/A"}
              icon={<FaBox />}
            />
            <InfoCard
              label="Parcel Type"
              value={
                parcel.type === "document"
                  ? "Document"
                  : parcel.type || "N/A"
              }
              icon={<FaBox />}
            />
            <InfoCard
              label="Parcel Weight"
              value={
                parcel.parcelWeight
                  ? `${parcel.parcelWeight} kg`
                  : parcel.weight
                  ? `${parcel.weight} kg`
                  : "N/A"
              }
              icon={<FaWeightHanging />}
            />
            <InfoCard
              label="Created At"
              value={
                parcel.createdAt
                  ? new Date(parcel.createdAt).toLocaleString()
                  : "N/A"
              }
              icon={<FaCalendarAlt />}
            />
            <InfoCard
              label="Cost"
              value={`৳${parcel.cost || 0}`}
              icon={<FaMoneyBillWave />}
            />
            <InfoCard
              label="Tracking Number"
              value={parcel.trackingId || parcel.trackingNumber || "N/A"}
              icon={<FaTruck />}
            />
          </div>
        </div>

        {/* Sender Information */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">
            Sender Information
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoCard
              label="Sender Name"
              value={parcel.senderName || "N/A"}
              icon={<FaUser />}
            />
            <InfoCard
              label="Sender Phone"
              value={parcel.senderContact || parcel.senderPhone || "N/A"}
              icon={<FaUser />}
            />
            <InfoCard
              label="Sender Address"
              value={parcel.senderAddress || "N/A"}
              icon={<FaMapMarkerAlt />}
            />
            <InfoCard
              label="Pickup Instruction"
              value={
                parcel.pickupInstruction ||
                parcel.pickupInstructions ||
                "N/A"
              }
              icon={<FaTruck />}
            />
          </div>
        </div>

        {/* Receiver Information */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-800">
            Receiver Information
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoCard
              label="Receiver Name"
              value={parcel.receiverName || "N/A"}
              icon={<FaUser />}
            />
            <InfoCard
              label="Receiver Phone"
              value={parcel.receiverContact || parcel.receiverPhone || "N/A"}
              icon={<FaUser />}
            />
            <InfoCard
              label="Receiver Address"
              value={parcel.receiverAddress || "N/A"}
              icon={<FaMapMarkerAlt />}
            />
            <InfoCard
              label="Delivery Instruction"
              value={
                parcel.deliveryInstruction ||
                parcel.deliveryInstructions ||
                "N/A"
              }
              icon={<FaTruck />}
            />
          </div>
        </div>

        {/* Status Section */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-800">
              Payment Status
            </h3>

            <div className="flex flex-wrap items-center gap-4">
              {parcel.paymentStatus === "paid" ? (
                <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                  Paid
                </span>
              ) : (
                <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
                  Unpaid
                </span>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-800">
              Delivery Status
            </h3>

            <div className="flex flex-wrap items-center gap-4">
              <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold capitalize text-blue-700">
                {parcel.deliveryStatus || "pending"}
              </span>
            </div>
          </div>
        </div>

        {/* Pay Now Button */}
        {parcel.paymentStatus === "unpaid" && (
          <div className="pt-2">
            <button
              onClick={() => navigate(`/dashboard/payment/${parcel._id}`)}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-green-700"
            >
              <FaCreditCard />
              Pay Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoCard = ({ label, value, icon }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-600">
        <span className="text-gray-500">{icon}</span>
        {label}
      </p>
      <p className="break-words text-base text-gray-800">{value}</p>
    </div>
  );
};

export default ViewMyParcel;