import { createSlice } from "@reduxjs/toolkit";

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    token: localStorage.getItem("adminToken") || null,
    role: localStorage.getItem("adminRole") || null,
    mustChangePassword: localStorage.getItem("adminMustChange") === "1",
    adminId: localStorage.getItem("adminId") || null,
    adminUsername: localStorage.getItem("adminUsername") || null,
    selectedClass: null,
  },
  reducers: {
    loginAdmin(state, action) {
      const p = action.payload;
      state.token = p.token;
      state.role = p.role;
      state.mustChangePassword = p.mustChangePassword;
      localStorage.setItem("adminToken", p.token);
      localStorage.setItem("adminRole", p.role);
      if (p.mustChangePassword) {
        localStorage.setItem("adminMustChange", "1");
      } else {
        localStorage.removeItem("adminMustChange");
      }
      if (p.adminId !== undefined) {
        state.adminId = p.adminId;
        if (p.adminId) localStorage.setItem("adminId", p.adminId);
        else localStorage.removeItem("adminId");
      }
      if (p.adminUsername !== undefined) {
        state.adminUsername = p.adminUsername;
        if (p.adminUsername) {
          localStorage.setItem("adminUsername", p.adminUsername);
        } else {
          localStorage.removeItem("adminUsername");
        }
      }
    },
    logoutAdmin(state) {
      state.token = null;
      state.role = null;
      state.mustChangePassword = false;
      state.adminId = null;
      state.adminUsername = null;
      state.selectedClass = null;
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminRole");
      localStorage.removeItem("adminMustChange");
      localStorage.removeItem("adminId");
      localStorage.removeItem("adminUsername");
    },
    setSelectedClass(state, action) {
      state.selectedClass = action.payload;
    },
    clearMustChange(state) {
      state.mustChangePassword = false;
      localStorage.removeItem("adminMustChange");
    },
  },
});

export const { loginAdmin, logoutAdmin, setSelectedClass, clearMustChange } =
  adminSlice.actions;
export default adminSlice.reducer;
