import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { AdminWrapper, AdminNavbar, AdminDashboardWrapper } from "./AdminStyles";
import "../../styles/admin.scss";

import SysAdminDashboard from "./SysAdminDashboard";
import CourseAdminDashboard from "./CourseAdminDashboard";

const AdminDashboard = () => {
  const adminState = useSelector((s) => s.admin || {});
  const token =
    adminState.token || localStorage.getItem("adminToken") || null;
  const role =
    adminState.role || localStorage.getItem("adminRole") || null;

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
    }
  }, [token, navigate]);

  if (!token) return null;

  const title =
    role === "sysadmin" ? "System Admin" : "Course Admin";

  return (
    <AdminWrapper
      style={{ justifyContent: "flex-start", alignItems: "stretch" }}
    >
      <AdminNavbar>
        <h2>R2R Admin — {title}</h2>
      </AdminNavbar>

      <AdminDashboardWrapper>
        {role === "sysadmin" ? (
          <SysAdminDashboard />
        ) : (
          <CourseAdminDashboard />
        )}
      </AdminDashboardWrapper>
    </AdminWrapper>
  );
};

export default AdminDashboard;
