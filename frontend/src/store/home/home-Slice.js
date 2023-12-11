import { createSlice } from "@reduxjs/toolkit";

const initialHomeState = {
  groupes: [
    {
      name: "קבוצה 1",
      users: ["יוני", "רועי", "מתן"],
      ratings: 5,
    },
    {
      name: "קבוצה 2",
      users: ["יוני", "רועי", "מתן"],
      ratings: 0,
    },
    {
      name: "קבוצה 3",
      users: ["יוני", "רועי", "מתן"],
      ratings: 5,
    },
    {
      name: "קבוצה 4",
      users: ["יוני", "רועי", "מתן"],
      ratings: 5,
    },
  ],
};

const homeSlice = createSlice({
  name: "home",
  initialState: initialHomeState,
  reducers: {
    fetchGroups(state, action) {
      state.groupes = action.payload;
    },
  },
});

export const homeActions = homeSlice.actions;

export default homeSlice.reducer;
