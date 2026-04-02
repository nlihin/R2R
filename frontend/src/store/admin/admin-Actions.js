import { loginAdmin, logoutAdmin, setSelectedClass, clearMustChange } from "./admin-Slice";
import { BaseURL } from "../../routes/url";

export const fetchAdminLogin = (adminId, password) => async (dispatch) => {
  const res = await fetch(`${BaseURL}admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ admin_id: adminId, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || "Login failed");
  dispatch(loginAdmin({
    token: data.access_token,
    role: data.role,
    mustChangePassword: data.must_change_password,
  }));
  return data;
};

export const fetchMyClasses = (token) => async (dispatch) => {
  const res = await fetch(`${BaseURL}admin/my-classes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg);
  return data.data;
};
