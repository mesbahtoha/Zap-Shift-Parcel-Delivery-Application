import { useLoaderData, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import Swal from "sweetalert2";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import useAuth from "../../../hooks/useAuth";

const AddParcel = () => {
  const loadedServiceCenter = useLoaderData();
  const serviceCenter = Array.isArray(loadedServiceCenter)
    ? loadedServiceCenter
    : [];

  const { user } = useAuth();
  const axiosSecure = useAxiosSecure();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();

  const regions = [...new Set(serviceCenter.map((item) => item.region))];

  const warehouseOptions = serviceCenter.map((center) => ({
    value: center.city,
    label: center.city,
  }));

  const generateTrackingNumber = () =>
    `PKG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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
    if (type === "document") etaDays = 1;
    else if (weight <= 3) etaDays = 2;
    else etaDays = 3;

    if (!withinCity) etaDays += 1;

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

  const onSubmit = (data) => {
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

    Swal.fire({
      title: "Parcel Summary & Delivery Cost",
      html: `
        <table style="width:100%;text-align:left">
          <tr><td><b>Parcel Type:</b></td><td>${
            data.type === "document" ? "Document" : "Non Document"
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
    }).then((result) => {
      if (result.isConfirmed) {
        axiosSecure
          .post("/parcels", finalData)
          .then((res) => {
            if (res.data.insertedId) {
              Swal.fire({
                title: "Parcel booking successful 🚚",
                text: `Tracking Number: ${finalData.trackingNumber}`,
                icon: "success",
                confirmButtonText: "OK",
                background: "#1f2937",
                color: "#f9fafb",
                confirmButtonColor: "#84cc16",
              }).then(() => {
                navigate("/dashboard/myParcels");
              });
            }
          })
          .catch((err) => {
            console.error("Parcel booking error:", err);
            Swal.fire({
              title: "Error",
              text: "Failed to book parcel",
              icon: "error",
              background: "#1f2937",
              color: "#f9fafb",
              confirmButtonColor: "#ef4444",
            });
          });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="rounded-2xl bg-base-100 text-base-content shadow-sm border border-base-300 p-5 md:p-8 lg:p-10">
        <h1 className="text-2xl md:text-3xl font-bold text-base-content mb-2">
          Add Parcel
        </h1>
        <p className="text-sm text-base-content/60 mb-6">
          Fill in the parcel, sender and receiver details.
        </p>

        <hr className="mb-6 border-base-300" />

        <form onSubmit={handleSubmit(onSubmit)}>
          <h2 className="font-semibold text-base-content mb-4">
            Enter your parcel details
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6">
            <label className="flex items-center gap-2 text-base-content">
              <input
                {...register("type", { required: "Parcel type is required" })}
                type="radio"
                value="document"
                className="radio radio-success"
              />
              Document
            </label>

            <label className="flex items-center gap-2 text-base-content">
              <input
                {...register("type", { required: "Parcel type is required" })}
                type="radio"
                value="not-document"
                className="radio radio-success"
              />
              Not Document
            </label>
          </div>
          {errors.type && (
            <p className="text-error text-sm mb-4">{errors.type.message}</p>
          )}

          <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8">
            <div>
              <input
                {...register("parcelName", {
                  required: "Parcel name is required",
                })}
                placeholder="Parcel Name"
                className="input input-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
              />
              {errors.parcelName && (
                <p className="text-error text-sm mt-1">
                  {errors.parcelName.message}
                </p>
              )}
            </div>

            <div>
              <input
                {...register("weight", {
                  required: "Parcel weight is required",
                })}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Parcel Weight (KG)"
                className="input input-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
              />
              {errors.weight && (
                <p className="text-error text-sm mt-1">
                  {errors.weight.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
            <div>
              <h3 className="font-semibold text-base-content mb-4">
                Sender Details
              </h3>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <input
                    {...register("senderName", {
                      required: "Sender name is required",
                    })}
                    placeholder="Sender Name"
                    className="input input-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
                  />
                  {errors.senderName && (
                    <p className="text-error text-sm mt-1">
                      {errors.senderName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Controller
                    name="senderWarehouse"
                    control={control}
                    rules={{ required: "Sender warehouse is required" }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={warehouseOptions}
                        placeholder="Search Warehouse"
                        isSearchable
                        styles={{
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
                        }}
                      />
                    )}
                  />
                  {errors.senderWarehouse && (
                    <p className="text-error text-sm mt-1">
                      {errors.senderWarehouse.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <input
                    {...register("senderAddress", {
                      required: "Sender address is required",
                    })}
                    placeholder="Address"
                    className="input input-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
                  />
                  {errors.senderAddress && (
                    <p className="text-error text-sm mt-1">
                      {errors.senderAddress.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    {...register("senderContact", {
                      required: "Sender contact is required",
                    })}
                    placeholder="Sender Contact No"
                    className="input input-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
                  />
                  {errors.senderContact && (
                    <p className="text-error text-sm mt-1">
                      {errors.senderContact.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <select
                  {...register("senderRegion", {
                    required: "Sender region is required",
                  })}
                  className="select select-bordered w-full bg-base-100 text-base-content border-base-300"
                >
                  <option value="">Select your region</option>
                  {regions.map((region) => (
                    <option key={region}>{region}</option>
                  ))}
                </select>
                {errors.senderRegion && (
                  <p className="text-error text-sm mt-1">
                    {errors.senderRegion.message}
                  </p>
                )}
              </div>

              <div>
                <textarea
                  {...register("pickupInstruction", {
                    required: "Pickup instruction is required",
                  })}
                  className="textarea textarea-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
                  placeholder="Pickup Instruction"
                />
                {errors.pickupInstruction && (
                  <p className="text-error text-sm mt-1">
                    {errors.pickupInstruction.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-base-content mb-4">
                Receiver Details
              </h3>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <input
                    {...register("receiverName", {
                      required: "Receiver name is required",
                    })}
                    placeholder="Receiver Name"
                    className="input input-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
                  />
                  {errors.receiverName && (
                    <p className="text-error text-sm mt-1">
                      {errors.receiverName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Controller
                    name="receiverWarehouse"
                    control={control}
                    rules={{ required: "Receiver warehouse is required" }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={warehouseOptions}
                        placeholder="Search Warehouse"
                        isSearchable
                        styles={{
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
                        }}
                      />
                    )}
                  />
                  {errors.receiverWarehouse && (
                    <p className="text-error text-sm mt-1">
                      {errors.receiverWarehouse.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <input
                    {...register("receiverAddress", {
                      required: "Receiver address is required",
                    })}
                    placeholder="Address"
                    className="input input-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
                  />
                  {errors.receiverAddress && (
                    <p className="text-error text-sm mt-1">
                      {errors.receiverAddress.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    {...register("receiverContact", {
                      required: "Receiver contact is required",
                    })}
                    placeholder="Receiver Contact No"
                    className="input input-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
                  />
                  {errors.receiverContact && (
                    <p className="text-error text-sm mt-1">
                      {errors.receiverContact.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <select
                  {...register("receiverRegion", {
                    required: "Receiver region is required",
                  })}
                  className="select select-bordered w-full bg-base-100 text-base-content border-base-300"
                >
                  <option value="">Select your region</option>
                  {regions.map((region) => (
                    <option key={region}>{region}</option>
                  ))}
                </select>
                {errors.receiverRegion && (
                  <p className="text-error text-sm mt-1">
                    {errors.receiverRegion.message}
                  </p>
                )}
              </div>

              <div>
                <textarea
                  {...register("deliveryInstruction", {
                    required: "Delivery instruction is required",
                  })}
                  className="textarea textarea-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/50"
                  placeholder="Delivery Instruction"
                />
                {errors.deliveryInstruction && (
                  <p className="text-error text-sm mt-1">
                    {errors.deliveryInstruction.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button type="submit" className="btn btn-primary">
              Proceed to Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddParcel;