import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <span className="loading loading-spinner loading-xl"></span>;
  }

  if (user) {
    return <Navigate to="/dashboard/overview" replace />;
  }

  return children;
};

export default PublicRoute;