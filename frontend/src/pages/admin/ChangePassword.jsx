import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginAdmin } from "../../store/admin/admin-Slice";
import { AdminWrapper, AdminCard, PrimaryButton, ErrorMsg } from "./AdminStyles";
import { BaseURL } from "../../routes/url";

const ChangePassword = () => {
  const adminState = useSelector((s) => s.admin || {});
  const token =
    adminState.token || localStorage.getItem("adminToken") || null;

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/admin/login", { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await fetch(`${BaseURL}admin/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ current_password: current, new_password: next }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.msg);
      return;
    }

    if (data.access_token) {
      dispatch(
        loginAdmin({
          token: data.access_token,
          role: data.role,
          mustChangePassword: data.must_change_password === true,
          adminId: data.admin_id,
          adminUsername: data.admin_username,
        })
      );
    }

    navigate("/admin/dashboard", { replace: true });
  };

  if (!token) {
    return null;
  }

  return (
    <AdminWrapper>
      <AdminCard>
        <h1>Change Password</h1>
        <p style={{ fontSize: 13, color: "var(--color-gray-400)", textAlign: "center" }}>
          You must change your password before proceeding.
          <br />Min 12 chars, uppercase, lowercase, digit.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input type="password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          <input type="password" placeholder="New password (12+ chars)" value={next} onChange={(e) => setNext(e.target.value)} required />
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <PrimaryButton type="submit">Change Password</PrimaryButton>
        </form>
      </AdminCard>
    </AdminWrapper>
  );
};

export default ChangePassword;
