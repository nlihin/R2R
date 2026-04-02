import { createSlice } from "@reduxjs/toolkit";

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    token: localStorage.getItem("adminToken") || null,
    role: localStorage.getItem("adminRole") || null,
    mustChangePassword: false,
    selectedClass: null,
  },
  reducers: {
    loginAdmin(state, action) {
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.mustChangePassword = action.payload.mustChangePassword;
      localStorage.setItem("adminToken", action.payload.token);
      localStorage.setItem("adminRole", action.payload.role);
    },
    logoutAdmin(state) {
      state.token = null;
      state.role = null;
      state.selectedClass = null;
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminRole");
    },
    setSelectedClass(state, action) {
      state.selectedClass = action.payload;
    },
    clearMustChange(state) {
      state.mustChangePassword = false;
    },
  },
});

export const { loginAdmin, logoutAdmin, setSelectedClass, clearMustChange } =
  adminSlice.actions;
export default adminSlice.reducer;
