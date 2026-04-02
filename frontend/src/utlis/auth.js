import { redirect } from "react-router-dom";

export const getAuthToken = () => {
  const token = localStorage.getItem("token");
  return token;
};

export const tokenLoader = () => {
  return getAuthToken();
};

export const checkAuthLoader = ({ request }) => {
  const url = new URL(request.url);

  if (url.hash.startsWith("#/admin")) {
    return null;
  }


  const token = getAuthToken();

  if (!token) {
    return redirect("/auth");
  }
  return null;
};
