import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutAdmin } from "../../store/admin/admin-Slice";
import {
  AdminShell,
  AdminNavbar,
  AdminDashboardWrapper,
  AdminFooter,
  HeaderLogoutButton,
} from "./AdminStyles";
import "../../styles/admin.scss";

import SysAdminDashboard from "./SysAdminDashboard";
import CourseAdminDashboard from "./CourseAdminDashboard";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const adminState = useSelector((s) => s.admin || {});
  const token =
    adminState.token || localStorage.getItem("adminToken") || null;
  const role =
    adminState.role || localStorage.getItem("adminRole") || null;
  const mustChangePassword = Boolean(adminState.mustChangePassword);
  const adminUsername = adminState.adminUsername || "";

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (token && mustChangePassword) {
      navigate("/admin/change-password", { replace: true });
    }
  }, [token, mustChangePassword, navigate]);

  if (!token) return null;
  if (mustChangePassword) return null;

  const title =
    role === "sysadmin" ? "System Admin" : "Course Admin";

  const handleLogout = () => {
    dispatch(logoutAdmin());
    navigate("/admin/login");
  };

  return (
    <AdminShell>
      <AdminNavbar>
        <div className="admin-navbar-titles">
          <h2>R2R Admin — {title}</h2>
          {adminUsername ? (
            <span className="admin-navbar-sub">
              Signed in as {adminUsername}
            </span>
          ) : null}
        </div>
        <HeaderLogoutButton type="button" onClick={handleLogout}>
          Logout
        </HeaderLogoutButton>
      </AdminNavbar>

      <AdminDashboardWrapper>
        {role === "sysadmin" ? (
          <SysAdminDashboard />
        ) : (
          <CourseAdminDashboard />
        )}
      </AdminDashboardWrapper>

      <AdminFooter>
        R2R admin. Credits: Sergei Shavrin
      </AdminFooter>
    </AdminShell>
  );
};

export default AdminDashboard;
