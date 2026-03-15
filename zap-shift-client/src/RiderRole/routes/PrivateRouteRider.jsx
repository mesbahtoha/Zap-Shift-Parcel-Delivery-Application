import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import { useEffect, useState } from "react";

const PrivateRouteRider = ({ children }) => {
  const { user, loading } = useAuth();
  const axiosSecure = useAxiosSecure();
  const location = useLocation();

  const [checkingRole, setCheckingRole] = useState(true);
  const [isRider, setIsRider] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user?.email) {
      setCheckingRole(false);
      return;
    }

    const checkRole = async () => {
      try {
        setCheckingRole(true);
        const res = await axiosSecure.get(`/users/role/${user.email}`);
        setIsRider(res.data?.role === "rider" || res.data?.isRider === true);
      } catch (error) {
        // console.error("Rider role check error:", error);
        setIsRider(false);
      } finally {
        setCheckingRole(false);
      }
    };

    checkRole();
  }, [user, loading, axiosSecure]);

  if (loading || checkingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-lime-600"></span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isRider) {
    return <Navigate to="/beARider" replace />;
  }

  return children;
};

export default PrivateRouteRider;