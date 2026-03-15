import { useLoaderData, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import Swal from "sweetalert2";
import useAuth from "../../hooks/useAuth";
import useAxiosSecure from "../../hooks/useAxiosSecure";

const SendParcel = () => {
  const serviceCenter = useLoaderData();
  const { user } = useAuth();
  const axiosSecure = useAxiosSecure();
  const navigate = useNavigate();

  const { register, handleSubmit, control } = useForm();

  // Unique region list for sender/receiver region dropdowns
  const regions = [...new Set(serviceCenter.map((item) => item.region))];

  // Warehouse options for react-select
  const warehouseOptions = serviceCenter.map((center) => ({
    value: center.city,
    label: center.city,
  }));

  /**
   * Shared styles for react-select so both warehouse selectors
   * keep the same appearance without repeating code.
   */
  const selectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "hsl(var(--b1))",
      borderColor: "hsl(var(--b3))",
      color: "hsl(var(--bc))",
      minHeight: "48px",
    }),
    singleValue: (base) => ({
      ...base,
      color: "hsl(var(--bc))",
    }),
    input: (base) => ({
      ...base,
      color: "hsl(var(--bc))",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "hsl(var(--b1))",
      color: "hsl(var(--bc))",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused
        ? "hsl(var(--b2))"
        : "hsl(var(--b1))",
      color: "hsl(var(--bc))",
    }),
    placeholder: (base) => ({
      ...base,
      color: "hsl(var(--bc) / 0.5)",
    }),
  };

  /**
   * Generate a unique tracking number for the parcel
   */
  const generateTrackingNumber = () =>
    `PKG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  /**
   * Calculate delivery cost and estimated delivery date
   * based on parcel type, weight, and delivery region.
   */
  const calculateCostAndETA = (type, weight, senderRegion, receiverRegion) => {
    const withinCity = senderRegion === receiverRegion;

    let baseCost = 0;
    let extraCharge = 0;

    const deliveryZone = withinCity ? "Within City" : "Outside City";

    if (type === "document") {
      baseCost = withinCity ? 60 : 80;
    } else {
      if (weight <= 3) {
        baseCost = withinCity ? 110 : 150;
      } else {
        const extraWeight = weight - 3;
        baseCost = withinCity ? 110 : 150;
        extraCharge = extraWeight * 40 + (withinCity ? 0 : 40);
      }
    }

    const totalCost = baseCost + extraCharge;

    let etaDays = 0;

    if (type === "document") {
      etaDays = 1;
    } else if (weight <= 3) {
      etaDays = 2;
    } else {
      etaDays = 3;
    }

    if (!withinCity) {
      etaDays += 1;
    }

    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + etaDays);

    return {
      baseCost,
      extraCharge,
      totalCost,
      deliveryZone,
      estimatedDeliveryDate,
    };
  };

  /**
   * Show booking summary before final submission
   */
  const showBookingSummary = ({
    type,
    weight,
    deliveryZone,
    baseCost,
    extraCharge,
    totalCost,
    estimatedDeliveryDate,
  }) => {
    return Swal.fire({
      title: "Parcel Summary & Delivery Cost",
      html: `
        <table style="width:100%;text-align:left">
          <tr><td><b>Parcel Type:</b></td><td>${
            type === "document" ? "Document" : "Non Document"
          }</td></tr>
          <tr><td><b>Weight:</b></td><td>${weight} kg</td></tr>
          <tr><td><b>Delivery Zone:</b></td><td>${deliveryZone}</td></tr>
          <tr><td><b>Base Cost:</b></td><td>৳${baseCost}</td></tr>
          <tr><td><b>Extra Charge:</b></td><td>৳${extraCharge}</td></tr>
          <tr><td><b>Total Cost:</b></td><td><b style="color:green">৳${totalCost}</b></td></tr>
          <tr><td><b>Estimated Delivery:</b></td><td>${estimatedDeliveryDate.toLocaleDateString()}</td></tr>
        </table>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Proceed to Payment",
      cancelButtonText: "Edit Details",
      background: "#1f2937",
      color: "#f9fafb",
      confirmButtonColor: "#84cc16",
      cancelButtonColor: "#6b7280",
    });
  };

  /**
   * Show success message after successful booking
   */
  const showSuccessAlert = (trackingNumber) => {
    return Swal.fire({
      title: "Parcel booking successful 🚚",
      text: `Tracking Number: ${trackingNumber}`,
      icon: "success",
      confirmButtonText: "OK",
      background: "#1f2937",
      color: "#f9fafb",
      confirmButtonColor: "#84cc16",
    });
  };

  /**
   * Submit parcel booking form
   */
  const onSubmit = async (data) => {
    const weight = parseFloat(data.weight);

    const {
      baseCost,
      extraCharge,
      totalCost,
      deliveryZone,
      estimatedDeliveryDate,
    } = calculateCostAndETA(
      data.type,
      weight,
      data.senderRegion,
      data.receiverRegion
    );

    const finalData = {
      ...data,
      weight,
      senderWarehouse: data.senderWarehouse?.value,
      receiverWarehouse: data.receiverWarehouse?.value,
      userEmail: user?.email,
      createdAt: new Date().toISOString(),
      trackingNumber: generateTrackingNumber(),
      status: "pending",
      paymentStatus: "unpaid",
      cost: totalCost,
      baseCost,
      extraCharge,
      deliveryZone,
      estimatedDeliveryDate,
    };

    const result = await showBookingSummary({
      type: data.type,
      weight,
      deliveryZone,
      baseCost,
      extraCharge,
      totalCost,
      estimatedDeliveryDate,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axiosSecure.post("/parcels", finalData);

      if (res.data.insertedId) {
        await showSuccessAlert(finalData.trackingNumber);
        navigate("/dashboard/myParcels");
      }
    } catch {
      // Intentionally kept silent to preserve current behavior
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center p-10 bg-base-200 text-base-content">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-base-100 text-base-content w-full max-w-6xl rounded-2xl shadow-lg border border-base-300 p-10"
      >
        <h1 className="text-3xl font-bold mb-6 text-base-content">Add Parcel</h1>

        <hr className="mb-6 border-base-300" />

        <h2 className="font-semibold mb-4 text-base-content/80">
          Enter your parcel details
        </h2>

        {/* Parcel type */}
        <div className="flex gap-6 mb-6 flex-wrap">
          <label className="flex items-center gap-2 text-base-content">
            <input
              {...register("type", { required: true })}
              type="radio"
              value="document"
              className="radio radio-success"
            />
            Document
          </label>

          <label className="flex items-center gap-2 text-base-content">
            <input
              {...register("type", { required: true })}
              type="radio"
              value="not-document"
              className="radio radio-success"
            />
            Not Document
          </label>
        </div>

        {/* Basic parcel info */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <input
            {...register("parcelName", { required: true })}
            placeholder="Parcel Name"
            className="input input-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
          />

          <input
            {...register("weight", { required: true })}
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Parcel Weight (KG)"
            className="input input-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Sender details */}
          <div>
            <h3 className="font-semibold mb-4 text-base-content">
              Sender Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                {...register("senderName", { required: true })}
                placeholder="Sender Name"
                className="input input-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
              />

              <Controller
                name="senderWarehouse"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={warehouseOptions}
                    placeholder="Search Warehouse"
                    isSearchable
                    styles={selectStyles}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                {...register("senderAddress", { required: true })}
                placeholder="Address"
                className="input input-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
              />

              <input
                {...register("senderContact", { required: true })}
                placeholder="Sender Contact No"
                className="input input-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
              />
            </div>

            <select
              {...register("senderRegion", { required: true })}
              className="select select-bordered w-full mb-4 bg-base-100 text-base-content border-base-300"
            >
              <option value="">Select your region</option>

              {regions.map((region) => (
                <option key={region}>{region}</option>
              ))}
            </select>

            <textarea
              {...register("pickupInstruction", { required: true })}
              className="textarea textarea-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
              placeholder="Pickup Instruction"
            />
          </div>

          {/* Receiver details */}
          <div>
            <h3 className="font-semibold mb-4 text-base-content">
              Receiver Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                {...register("receiverName", { required: true })}
                placeholder="Receiver Name"
                className="input input-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
              />

              <Controller
                name="receiverWarehouse"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={warehouseOptions}
                    placeholder="Search Warehouse"
                    isSearchable
                    styles={selectStyles}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                {...register("receiverAddress", { required: true })}
                placeholder="Address"
                className="input input-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
              />

              <input
                {...register("receiverContact", { required: true })}
                placeholder="Receiver Contact No"
                className="input input-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
              />
            </div>

            <select
              {...register("receiverRegion", { required: true })}
              className="select select-bordered w-full mb-4 bg-base-100 text-base-content border-base-300"
            >
              <option value="">Select your region</option>

              {regions.map((region) => (
                <option key={region}>{region}</option>
              ))}
            </select>

            <textarea
              {...register("deliveryInstruction", { required: true })}
              className="textarea textarea-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
              placeholder="Delivery Instruction"
            />
          </div>
        </div>

        <div className="mt-6">
          <button type="submit" className="btn btn-primary">
            Proceed to Confirm Booking
          </button>
        </div>
      </form>
    </div>
  );
};

export default SendParcel;