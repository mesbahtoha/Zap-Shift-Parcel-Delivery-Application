import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import useAuth from "../../../hooks/useAuth";
import useAxiosSecure from "../../../hooks/useAxiosSecure";

// ✅ Export query key so ManageRiders can invalidate it after approval change
export const riderProfileKey = (email) => ["rider-profile", email];

// ─────────────────────────────────────────────
// Approval status badge — reflects admin changes instantly
// ─────────────────────────────────────────────
const ApprovalBadge = ({ status }) => {
  const s = (status || "pending").toLowerCase();
  const styles =
    s === "approved" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
    s === "declined" ? "bg-red-100 text-red-700 border-red-200" :
                       "bg-amber-100 text-amber-700 border-amber-200";
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${styles}`}>
      {s}
    </span>
  );
};

const WorkStatusBadge = ({ status }) => {
  const s = (status || "free").toLowerCase();
  const styles =
    s === "free" ? "bg-lime-100 text-lime-700 border-lime-200" :
                   "bg-blue-100 text-blue-700 border-blue-200";
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${styles}`}>
      {s}
    </span>
  );
};

const InfoBox = ({ label, value }) => (
  <div className="rounded-xl bg-gray-50 p-4">
    <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
    <p className="mt-1 font-semibold text-gray-800">{value || "N/A"}</p>
  </div>
);

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const RiderProfile = () => {
  const { user }     = useAuth();
  const axiosSecure  = useAxiosSecure();
  const queryClient  = useQueryClient();

  const [isEditing,  setIsEditing]  = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [formData,   setFormData]   = useState(null);

  // ── Fetch profile ────────────────────────────
  // ✅ Same queryKey as exported — ManageRiders.jsx invalidates this
  //    when admin approves/declines, so status updates instantly here
  const {
    data: profile,
    isLoading,
    isError,
    isFetching,
  } = useQuery({
    queryKey: riderProfileKey(user?.email),
    queryFn: async () => {
      const res = await axiosSecure.get(`/rider-accounts/${user.email}`);
      return res.data || null;
    },
    enabled:              !!user?.email,
    refetchInterval:      10_000,   // ✅ poll every 10s
    refetchOnWindowFocus: true,
    staleTime:            0,        // ✅ always stale → invalidation fires instantly
    onSuccess: (data) => {
      // Pre-fill form whenever fresh data arrives (only if not currently editing)
      if (data && !isEditing) {
        setFormData({
          name:        data.name        || "",
          age:         data.age         || "",
          phone:       data.phone       || "",
          nid:         data.nid         || "",
          vehicleType: data.vehicleType || "",
          region:      data.region      || "",
          hub:         data.hub         || "",
          picture:     data.picture     || "",
        });
      }
    },
  });

  // ── Save profile mutation ────────────────────
  const {
    mutate:    saveProfile,
    isPending: saving,
    isSuccess: saveSuccess,
    isError:   saveError,
    error:     saveErrorMsg,
    reset:     resetSave,
  } = useMutation({
    mutationFn: async (updateDoc) => {
      const res = await axiosSecure.patch("/rider-accounts/profile", updateDoc);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riderProfileKey(user?.email) });
      setIsEditing(false);
    },
  });

  // ── Handlers ─────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImgUpload = async (e) => {
    const img = e.target.files[0];
    if (!img) return;
    try {
      setUploading(true);
      const form = new FormData();
      form.append("image", img);
      const res = await axios.post(
        `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_img_upload_key}`,
        form
      );
      setFormData((prev) => ({ ...prev, picture: res.data.data.url }));
    } catch {
      // silent — user can retry
    } finally {
      setUploading(false);
    }
  };

  const handleEditToggle = () => {
    resetSave();
    // Seed form from latest profile data
    if (profile) {
      setFormData({
        name:        profile.name        || "",
        age:         profile.age         || "",
        phone:       profile.phone       || "",
        nid:         profile.nid         || "",
        vehicleType: profile.vehicleType || "",
        region:      profile.region      || "",
        hub:         profile.hub         || "",
        picture:     profile.picture     || "",
      });
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    resetSave();
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    saveProfile({ email: user.email, ...formData });
  };

  // ── Loading state ─────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <span className="loading loading-spinner loading-lg text-lime-600" />
      </div>
    );
  }

  const currentPicture = (isEditing ? formData?.picture : profile?.picture)
    || user?.photoURL
    || "https://i.ibb.co/4pDNDk1/avatar-placeholder.png";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#083c46]">Rider Profile</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your rider account details and operational information.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live sync dot */}
          {isFetching && !isLoading && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Syncing
            </span>
          )}

          {!isEditing && profile && (
            <button
              type="button"
              onClick={handleEditToggle}
              className="btn border-none bg-lime-400 text-black hover:bg-lime-500"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {isError && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">
          Failed to load rider profile.
        </p>
      )}

      {!profile ? (
        <p className="text-sm text-gray-500">No rider profile found.</p>

      ) : isEditing ? (
        /* ── Edit form ── */
        <form onSubmit={handleSaveProfile} className="space-y-5">

          {saveError && (
            <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-500">
              {saveErrorMsg?.response?.data?.message || "Failed to update rider profile."}
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-[160px_1fr]">
            {/* Photo */}
            <div>
              <img
                src={currentPicture}
                alt="Rider"
                className="h-32 w-32 rounded-2xl border object-cover"
              />
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-[#222]">
                  Update Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImgUpload}
                  className="file-input file-input-bordered w-full max-w-xs rounded-xl"
                />
                {uploading && (
                  <p className="mt-2 text-sm text-blue-500">Uploading…</p>
                )}
              </div>
            </div>

            {/* Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Full Name",    name: "name",  type: "text",   placeholder: "Your full name",      required: true  },
                { label: "Age",          name: "age",   type: "number", placeholder: "Your age"                              },
                { label: "Contact No.",  name: "phone", type: "tel",    placeholder: "Your contact number"                   },
                { label: "NID",          name: "nid",   type: "text",   placeholder: "Your NID number"                       },
                { label: "Region",       name: "region",type: "text",   placeholder: "Your region"                           },
                { label: "Hub",          name: "hub",   type: "text",   placeholder: "Preferred hub"                         },
              ].map((f) => (
                <div key={f.name}>
                  <label className="mb-2 block text-sm font-medium text-[#222]">{f.label}</label>
                  <input
                    name={f.name}
                    value={formData?.[f.name] ?? ""}
                    onChange={handleChange}
                    type={f.type}
                    placeholder={f.placeholder}
                    required={f.required}
                    className="input input-bordered w-full rounded-xl"
                  />
                </div>
              ))}

              {/* Email (read-only) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#222]">Email</label>
                <input
                  value={user?.email || ""}
                  readOnly
                  type="email"
                  className="input input-bordered w-full rounded-xl bg-gray-100 text-gray-500"
                />
              </div>

              {/* Vehicle type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[#222]">Vehicle Type</label>
                <select
                  name="vehicleType"
                  value={formData?.vehicleType ?? ""}
                  onChange={handleChange}
                  className="select select-bordered w-full rounded-xl"
                >
                  <option value="">Select vehicle type</option>
                  <option value="Bike">Bike</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Scooter">Scooter</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="btn border-none bg-lime-400 text-black hover:bg-lime-500 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={saving}
              className="btn border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>

      ) : (
        /* ── View mode ── */
        <div className="grid gap-6 lg:grid-cols-[140px_1fr]">
          <div>
            <img
              src={currentPicture}
              alt="Rider"
              className="h-32 w-32 rounded-2xl border object-cover"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoBox label="Name"         value={profile.name}        />
            <InfoBox label="Email"        value={profile.email}       />
            <InfoBox label="Phone"        value={profile.phone}       />
            <InfoBox label="Age"          value={profile.age}         />
            <InfoBox label="NID"          value={profile.nid}         />
            <InfoBox label="Vehicle Type" value={profile.vehicleType} />
            <InfoBox label="Region"       value={profile.region}      />
            <InfoBox label="Hub"          value={profile.hub}         />

            {/* ✅ Status row — shows BOTH approvalStatus and workStatus */}
            <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2">
              <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">Status</p>
              <div className="flex flex-wrap items-center gap-2">
                {/* ✅ Approval status — updates instantly when admin approves/declines */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">Approval:</span>
                  <ApprovalBadge status={profile.approvalStatus} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">Work:</span>
                  <WorkStatusBadge status={profile.workStatus} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {saveSuccess && !isEditing && (
        <p className="mt-4 text-sm text-emerald-600">
          Profile updated successfully.
        </p>
      )}
    </div>
  );
};

export default RiderProfile;