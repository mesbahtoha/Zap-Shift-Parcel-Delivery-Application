import { useForm } from "react-hook-form";
import deliveryIllustration from "../../../assets/authImage.png";
import logo from "../../../assets/logo.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import { useState } from "react";
import Swal from "sweetalert2";

export const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const from = location.state?.from?.pathname || "/dashboard/overview";

  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm();

  const { signInwithGoogle, signIn, resetPassword } = useAuth();

  // const handleGoogleSignIn = async () => {
  //   try {
  //     const result = await signInwithGoogle();
  //     const user = result.user;

  //     const userInfo = {
  //       name: user.displayName || "No Name",
  //       email: user.email,
  //       role: "user",
  //       picture: user.photoURL || "",
  //     };

  //     await axiosInstance.post("/users", userInfo);

  //     navigate("/dashboard/overview", { replace: true });
  //   } catch (error) {
  //     console.error("Google sign-in error:", error);
  //   }
  // };

  const onSubmit = (data) => {
    setLoginError("");
    setResetMessage("");
    setResetError("");

    // console.log("Login form data:", data);

    signIn(data.email, data.password)
      .then((result) => {
        // console.log("Logged in user:", result.user);
        navigate(from, { replace: true });
      })
      .catch((error) => {
        // console.error("Login error:", error.message);
        setLoginError("Invalid email or password.");
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Invalid email or password!",
          background: "#1f2937",
          color: "#f9fafb",
          confirmButtonColor: "#84cc16",
        });
      });
  };

  const handleForgetPassword = async () => {
    try {
      setResetMessage("");
      setResetError("");

      const email = getValues("email");
      // console.log("Reset password email:", email);

      if (!email) {
        setResetError("Please enter your email first.");
        return;
      }

      await resetPassword(email);
      setResetMessage(
        "Password reset email sent. Please check your inbox or spam."
      );
      // console.log("Password reset email sent");
    } catch (error) {
      // console.error("Reset password error:", error.message);
      setResetError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-base-100 text-base-content">
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link to="/">
            <div className="flex items-center mb-8 ml-[30%] -mt-5">
              <img src={logo} alt="logo" className="w-11 h-11" />
              <h2 className="text-3xl font-extrabold text-base-content -ml-4.5 mt-4.5">
                Profast
              </h2>
            </div>
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-base-content">
            Welcome Back
          </h1>
          <p className="text-base-content/70 mt-2 mb-6 text-lg">
            Login with Profast
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block font-semibold mb-1 text-base-content">
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="Email"
                required
                className="w-full border border-base-300 bg-base-100 text-base-content rounded-lg px-4 py-2 placeholder:text-base-content/50 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-base-content">
                Password
              </label>

              <div className="relative">
                <input
                  {...register("password", {
                    required: true,
                    minLength: 6,
                  })}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  className="w-full border border-base-300 bg-base-100 text-base-content rounded-lg px-4 py-2 pr-16 placeholder:text-base-content/50 focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-base-content/60 hover:text-primary"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.password?.type === "required" && (
                <p className="text-error mt-1">Password is required</p>
              )}
              {errors.password?.type === "minLength" && (
                <p className="text-error mt-1">
                  Password must be 6 characters or longer
                </p>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={handleForgetPassword}
                className="text-sm text-base-content/60 hover:text-primary cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {resetMessage && (
              <p className="text-sm text-success">{resetMessage}</p>
            )}

            {resetError && <p className="text-sm text-error">{resetError}</p>}

            {loginError && <p className="text-sm text-error">{loginError}</p>}

            <button className="btn btn-primary w-full rounded-lg">
              Login
            </button>
          </form>

          <p className="mt-4 text-sm text-base-content/70">
            Don’t have any account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>

          {/* <div className="my-5 text-center text-base-content/50 text-sm">Or</div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-base-100 border border-base-300 hover:bg-base-200 py-3 rounded-lg text-base-content font-semibold transition duration-300 shadow-sm"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5"
            />
            Login with Google
          </button> */}
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-lime-50 to-lime-100 p-12">
        <img
          src={deliveryIllustration}
          alt="Delivery Illustration"
          className="max-w-md w-full object-contain"
        />
      </div>
    </div>
  );
};