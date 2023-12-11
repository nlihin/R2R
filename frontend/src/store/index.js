import { configureStore } from "@reduxjs/toolkit";

import UIReducer from "./UI/UI-Slice";
import authReducer from "./Auth/Auth-Slice";
import homeReducer from "./home/home-Slice";
import ratingsReducer from "./ratings/ratings-Slice";

const store = configureStore({
  reducer: {
    UI: UIReducer,
    auth: authReducer,
    home: homeReducer,
    ratings: ratingsReducer,
  },
});

export default store;
