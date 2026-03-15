import { useState } from "react";
import axios from "axios";
import useAuth from "../../../hooks/useAuth";
import useAxiosSecure from "../../../hooks/useAxiosSecure";

const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const axiosSecure = useAxiosSecure();

  // Form states
  const [name, setName] = useState(user?.displayName || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [selectedImage, setSelectedImage] = useState(null);

  // UI states
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");

  // Default fallback image
  const fallbackAvatar = "https://i.ibb.co/4pDNDk1/avatar-placeholder.png";

  /**
   * Formats Firebase last login time for display
   */
  const formatLastLogin = (dateString) => {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleString("en-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  /**
   * Handles image file selection
   */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  /**
   * Upload selected image to ImgBB and return uploaded image URL
   * If no new image is selected, return the current photo URL
   */
  const uploadImageToImgbb = async () => {
    if (!selectedImage) return photoURL;

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append("image", selectedImage);

      const imageUploadUrl = `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_img_upload_key}`;

      const response = await axios.post(imageUploadUrl, formData);
      return response.data.data.url;
    } finally {
      setUploadingImage(false);
    }
  };

  /**
   * Updates user profile in:
   * 1. Firebase
   * 2. MongoDB via secure API
   */
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      let finalPhotoURL = photoURL;

      // Upload new image only if user selected one
      if (selectedImage) {
        finalPhotoURL = await uploadImageToImgbb();
        setPhotoURL(finalPhotoURL);
      }

      // Update Firebase profile
      await updateUserProfile({
        displayName: name,
        photoURL: finalPhotoURL,
      });

      // Update MongoDB profile
      await axiosSecure.patch("/users/profile", {
        email: user?.email,
        name,
        picture: finalPhotoURL,
      });

      setMessage("Profile updated successfully.");
      setEditing(false);
      setSelectedImage(null);
    } catch (error) {
      setMessage("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // Profile image to show in avatar section
  const profileImageSrc = photoURL || user?.photoURL || fallbackAvatar;

  // Preview image while editing
  const previewImageSrc = selectedImage
    ? URL.createObjectURL(selectedImage)
    : photoURL || user?.photoURL;

  const lastLoginText = formatLastLogin(user?.metadata?.lastSignInTime);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Top profile header */}
        <div className="bg-gradient-to-r from-lime-100 to-lime-50 px-6 py-10">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="avatar">
              <div className="w-28 rounded-full ring ring-lime-300 ring-offset-base-100 ring-offset-2">
                <img src={profileImageSrc} alt="Profile" />
              </div>
            </div>

            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-800">
                {user?.displayName || name || "No Name"}
              </h2>
              <p className="text-gray-600 mt-1">{user?.email || "No Email"}</p>
              <p className="text-sm text-gray-500 mt-2">
                Last Login: {lastLoginText}
              </p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-gray-800">
              Profile Information
            </h3>

            <button
              onClick={() => {
                setEditing(!editing);
                setMessage("");
              }}
              className="btn bg-lime-400 hover:bg-lime-500 border-none text-black"
            >
              {editing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {!editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-gray-50 rounded-xl p-4 border">
                <p className="text-sm text-gray-500">Full Name</p>
                <h4 className="text-lg font-semibold text-gray-800 mt-1">
                  {user?.displayName || "No Name"}
                </h4>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border">
                <p className="text-sm text-gray-500">Email Address</p>
                <h4 className="text-lg font-semibold text-gray-800 mt-1 break-all">
                  {user?.email || "No Email"}
                </h4>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border md:col-span-2">
                <p className="text-sm text-gray-500">Profile Picture</p>
                <h4 className="text-lg font-semibold text-gray-800 mt-1 break-all">
                  {user?.photoURL || "No profile picture"}
                </h4>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border md:col-span-2">
                <p className="text-sm text-gray-500">Last Login</p>
                <h4 className="text-lg font-semibold text-gray-800 mt-1">
                  {lastLoginText}
                </h4>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input file-input-bordered w-full"
                />
              </div>

              {(selectedImage || photoURL) && (
                <div className="flex justify-center md:justify-start">
                  <img
                    src={previewImageSrc}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading || uploadingImage}
                className="btn bg-lime-400 hover:bg-lime-500 border-none text-black"
              >
                {uploadingImage
                  ? "Uploading image..."
                  : loading
                  ? "Updating..."
                  : "Save Changes"}
              </button>
            </form>
          )}

          {message && (
            <p
              className={`mt-5 text-sm font-medium ${
                message.includes("success")
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;