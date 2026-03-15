import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../../assets/agent-pending.png";
import ProfastLogo from "../shared/ProfastLogo/ProfastLogo";
import useAuth from "../../hooks/useAuth";
import useAxiosSecure from "../../hooks/useAxiosSecure";

const BeARider = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const axiosSecure = useAxiosSecure();

  const [serviceCenters, setServiceCenters] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [checkingRider, setCheckingRider] = useState(true);
  const [profilePic, setProfilePic] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  /**
   * Load service center data from local JSON file
   */
  useEffect(() => {
    const loadServiceCenters = async () => {
      try {
        const response = await fetch("/serviceCenter.json");
        const data = await response.json();
        setServiceCenters(Array.isArray(data) ? data : []);
      } catch {
        setPageError("Failed to load service center data.");
      }
    };

    loadServiceCenters();
  }, []);

  /**
   * On page load:
   * 1. Redirect to login if user is not logged in
   * 2. Pre-fill form with signed-in user info
   * 3. Check whether the rider profile already exists
   *    If it exists, send user directly to rider overview
   */
  useEffect(() => {
    if (loading) return;

    if (!user?.email) {
      navigate("/login", { replace: true });
      return;
    }

    setValue("name", user?.displayName || "");
    setValue("email", user?.email || "");

    const checkRiderProfile = async () => {
      try {
        setCheckingRider(true);
        setPageError("");

        await axiosSecure.get(`/rider-accounts/${user.email}`);
        navigate("/dashboard/rider/overview", { replace: true });
      } catch (error) {
        if (error?.response?.status !== 404) {
          setPageError("Failed to verify rider profile. Please try again.");
        }
      } finally {
        setCheckingRider(false);
      }
    };

    checkRiderProfile();
  }, [user, loading, navigate, axiosSecure, setValue]);

  /**
   * Build unique region list from service center data
   */
  const uniqueRegions = useMemo(() => {
    return [...new Set(serviceCenters.map((item) => item.region).filter(Boolean))];
  }, [serviceCenters]);

  /**
   * Show only warehouses/hubs for the currently selected region
   */
  const warehouseOptions = useMemo(() => {
    if (!selectedRegion) return [];

    return [
      ...new Set(
        serviceCenters
          .filter((item) => item.region === selectedRegion)
          .map((item) => item.city)
          .filter(Boolean)
      ),
    ];
  }, [serviceCenters, selectedRegion]);

  /**
   * Upload rider image to ImgBB
   */
  const handleImgUpload = async (e) => {
    try {
      const imageFile = e.target.files[0];
      if (!imageFile) return;

      setUploading(true);
      setPageError("");

      const formData = new FormData();
      formData.append("image", imageFile);

      const imageUploadUrl = `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_img_upload_key}`;

      const response = await axios.post(imageUploadUrl, formData);
      setProfilePic(response.data.data.url);
    } catch {
      setPageError("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  /**
   * Submit rider profile creation form
   */
  const onSubmit = async (data) => {
    try {
      if (!user?.email) {
        setPageError("You must be logged in first.");
        return;
      }

      setSubmitting(true);
      setPageError("");
      setSuccessMessage("");

      const riderInfo = {
        name: data.name,
        email: user.email,
        age: data.age,
        nid: data.nid,
        phone: data.contact,
        region: data.region,
        hub: data.warehouse,
        vehicleType: data.vehicleType,
        picture: profilePic || user?.photoURL || "",
        role: "rider",
        status: "active",
      };

      const response = await axiosSecure.post("/rider-accounts", riderInfo);

      if (response.data?.riderExists || response.data?.inserted === false) {
        navigate("/dashboard/rider/overview", { replace: true });
        return;
      }

      setSuccessMessage("Your rider profile has been created successfully.");
      navigate("/dashboard/rider/overview", { replace: true });
    } catch (error) {
      setPageError(
        error?.response?.data?.message ||
          "Failed to create rider profile. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Show loading screen while auth is loading or while checking rider account
   */
  if (loading || checkingRider) {
    return (
      <section className="min-h-screen bg-base-200 px-3 py-4 text-base-content sm:px-4 sm:py-5 md:px-6 md:py-6">
        <div className="mx-auto max-w-7xl rounded-2xl bg-base-100 px-4 py-10 sm:px-6 md:px-10 lg:rounded-[28px] lg:px-14 lg:py-16">
          <ProfastLogo />
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="mt-4 text-sm text-base-content/60">
                Checking your rider access...
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-base-200 px-3 py-4 text-base-content sm:px-4 sm:py-5 md:px-6 md:py-6 w-[95%] mx-auto">
      <div className="mx-auto max-w-7xl rounded-2xl bg-base-100 px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10 lg:rounded-[28px] lg:px-14 lg:py-16">
        {/* <ProfastLogo /> */}

        <div className="max-w-4xl">
          <h1 className="text-2xl font-extrabold leading-tight text-base-content sm:text-3xl md:text-4xl lg:text-6xl">
            Become a Rider with Profast
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-base-content/70 sm:text-base md:text-lg">
            Join our delivery network and start earning with flexible delivery
            opportunities. Complete your rider profile once, and next time you
            will go directly to your rider dashboard.
          </p>
        </div>

        <div className="my-4 border-t border-base-300 sm:my-5 lg:my-6" />

        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
          {/* Left side: form */}
          <div className="order-2 lg:order-1">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-base-content sm:text-2xl md:text-3xl lg:text-4xl">
                Complete Your Rider Profile
              </h2>
              <p className="mt-2 text-sm text-base-content/70 sm:text-base">
                Tell us about yourself, your service region, and your preferred
                service center so we can activate your rider workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-base-content">
                  Rider Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImgUpload}
                  className="file-input file-input-bordered w-full rounded-xl border-base-300 bg-base-100 text-base-content"
                />

                {uploading && (
                  <p className="mt-2 text-sm text-info">Uploading image...</p>
                )}

                {(profilePic || user?.photoURL) && (
                  <img
                    src={profilePic || user?.photoURL}
                    alt="Preview"
                    className="mt-3 h-16 w-16 rounded-full border border-base-300 object-cover"
                  />
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-base-content">
                  Full Name
                </label>
                <input
                  {...register("name", { required: "Name is required" })}
                  type="text"
                  placeholder="Your full name"
                  className="input input-bordered w-full rounded-xl border-base-300 bg-base-100 text-base-content placeholder:text-base-content/50"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-error">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-base-content">
                  Email Address
                </label>
                <input
                  value={user?.email || ""}
                  readOnly
                  type="email"
                  className="input input-bordered w-full rounded-xl border-base-300 bg-base-200 text-base-content/60"
                />
                <p className="mt-1 text-xs text-base-content/60">
                  This comes from your signed-in account and cannot be changed here.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-base-content">
                    Age
                  </label>
                  <input
                    {...register("age", { required: "Age is required" })}
                    type="number"
                    placeholder="Your age"
                    className="input input-bordered w-full rounded-xl border-base-300 bg-base-100 text-base-content placeholder:text-base-content/50"
                  />
                  {errors.age && (
                    <p className="mt-1 text-sm text-error">{errors.age.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-base-content">
                    Contact Number
                  </label>
                  <input
                    {...register("contact", {
                      required: "Contact number is required",
                    })}
                    type="tel"
                    placeholder="Your contact number"
                    className="input input-bordered w-full rounded-xl border-base-300 bg-base-100 text-base-content placeholder:text-base-content/50"
                  />
                  {errors.contact && (
                    <p className="mt-1 text-sm text-error">
                      {errors.contact.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-base-content">
                  National ID Number
                </label>
                <input
                  {...register("nid", { required: "NID is required" })}
                  type="text"
                  placeholder="Your NID number"
                  className="input input-bordered w-full rounded-xl border-base-300 bg-base-100 text-base-content placeholder:text-base-content/50"
                />
                {errors.nid && (
                  <p className="mt-1 text-sm text-error">{errors.nid.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-base-content">
                  Region
                </label>
                <select
                  {...register("region", { required: "Region is required" })}
                  defaultValue=""
                  onChange={(e) => {
                    const region = e.target.value;
                    setSelectedRegion(region);
                    setValue("region", region);
                    setValue("warehouse", "");
                  }}
                  className="select select-bordered w-full rounded-xl border-base-300 bg-base-100 text-base-content"
                >
                  <option value="" disabled>
                    Select your region
                  </option>

                  {uniqueRegions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>

                {errors.region && (
                  <p className="mt-1 text-sm text-error">{errors.region.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-base-content">
                  Preferred Service Center / Warehouse
                </label>

                <select
                  {...register("warehouse", {
                    required: "Warehouse or hub is required",
                  })}
                  defaultValue=""
                  disabled={!selectedRegion}
                  className="select select-bordered w-full rounded-xl border-base-300 bg-base-100 text-base-content disabled:bg-base-200 disabled:text-base-content/50"
                >
                  <option value="" disabled>
                    {selectedRegion
                      ? "Select your warehouse / hub"
                      : "Select region first"}
                  </option>

                  {warehouseOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>

                {errors.warehouse && (
                  <p className="mt-1 text-sm text-error">
                    {errors.warehouse.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-base-content">
                  Vehicle Type
                </label>
                <select
                  {...register("vehicleType", {
                    required: "Vehicle type is required",
                  })}
                  defaultValue=""
                  className="select select-bordered w-full rounded-xl border-base-300 bg-base-100 text-base-content"
                >
                  <option value="" disabled>
                    Select your vehicle type
                  </option>
                  <option>Bike</option>
                  <option>Bicycle</option>
                  <option>Scooter</option>
                </select>
                {errors.vehicleType && (
                  <p className="mt-1 text-sm text-error">
                    {errors.vehicleType.message}
                  </p>
                )}
              </div>

              {pageError && <p className="text-sm text-error">{pageError}</p>}
              {successMessage && (
                <p className="text-sm text-success">{successMessage}</p>
              )}

              <button
                type="submit"
                disabled={uploading || submitting}
                className="btn btn-primary w-full disabled:opacity-50"
              >
                {submitting
                  ? "Submitting..."
                  : uploading
                  ? "Uploading image..."
                  : "Create Rider Profile"}
              </button>
            </form>
          </div>

          {/* Right side: image and info */}
          <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
            <div className="max-w-[520px]">
              <img
                src={logo}
                alt="Rider"
                className="w-full max-w-[220px] object-contain sm:max-w-[280px] md:max-w-[340px] lg:max-w-[450px]"
              />

              <div className="mt-6 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
                <h3 className="text-lg font-bold text-base-content">
                  Why ride with Profast?
                </h3>
                <div className="mt-4 space-y-3 text-sm text-base-content/70">
                  <p>• Flexible delivery work across your selected region</p>
                  <p>• Track tasks, delivery progress, and earnings in one dashboard</p>
                  <p>• Manage your rider profile and workflow with a dedicated panel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BeARider;