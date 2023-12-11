import { homeActions } from "./home-Slice";
import { Get } from "../api/unsplash";

export const fetchTableData = () => {
  return async (dispatch) => {
    try {
      const response = await Get("finance_report/filters");
      dispatch(homeActions.fetchGroups(response));
    } catch (error) {}
  };
};
