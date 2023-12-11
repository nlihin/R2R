import { createSlice } from "@reduxjs/toolkit";

const initialRatingsState = {
  isAuthenticated: false,
};

const ratingsSlice = createSlice({
  name: "ratings",
  initialState: initialRatingsState,
  reducers: {
    login(state) {
      state.isAuthenticated = true;
    },

  },
});

export const ratingsActions = ratingsSlice.actions;

export default ratingsSlice.reducer;
