import { createSlice } from "@reduxjs/toolkit";

const initialUIState = {
  isAuthenticated: false,
};

const UISlice = createSlice({
  name: "ui",
  initialState: initialUIState,
  reducers: {
    login(state) {
      state.isAuthenticated = true;
    },
    logout(state) {
      state.isAuthenticated = false;
    },
  },
});

export const UIActions = UISlice.actions;

export default UISlice.reducer;
