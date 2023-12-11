import axios from "axios";

export const url =
  process.env.NODE_ENV === "development" ? "http://127.0.0.1:80/" : "/";

export const Get = async (controller) => {
  try {
    const response = await axios.get(`${url}${controller}`);
    if (response.statusText === "UNAUTHORIZED") {
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace("/");
    } else return response.data;
  } catch (error) {
    return console.error(error);
  }
};

export default axios.create({
  baseURL: url,
});
