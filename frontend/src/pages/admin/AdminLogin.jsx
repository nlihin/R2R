import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginAdmin } from "../../store/admin/admin-Slice";
import { AdminWrapper, AdminCard, PrimaryButton, ErrorMsg } from "./AdminStyles";
import { BaseURL } from "../../routes/url";


const AdminLogin = () => {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (adminId.length !== 9 || !/^\d{9}$/.test(adminId)) {
      setError("Admin ID must be exactly 9 digits");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BaseURL}admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: adminId, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.msg || "Login failed");
        return;
      }

      localStorage.setItem("adminToken", data.access_token);
      localStorage.setItem("adminRole", data.role);

      dispatch(
        loginAdmin({
          token: data.access_token,
          role: data.role,
          mustChangePassword: data.must_change_password,
        })
      );
      if (data.must_change_password) {
        navigate("/admin/change-password");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };


  return (
    <AdminWrapper>
      <AdminCard>
        <h1>Admin Login</h1>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            type="text"
            placeholder="9-digit Admin ID"
            maxLength={9}
            value={adminId}
            onChange={(e) => setAdminId(e.target.value.replace(/\D/g, "").slice(0, 9))}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </PrimaryButton>
        </form>
      </AdminCard>
    </AdminWrapper>
  );
};


export default AdminLogin;
