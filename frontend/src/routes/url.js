//changed 9.2.2026
const isLocal = !process.env.REACT_APP_API_BASE_URL;

const rawBase = isLocal
  ? "http://localhost:5001/"
  : process.env.REACT_APP_API_BASE_URL;

export const BaseURL = isLocal
  ? rawBase.replace(/\/+$/, "/")
  : rawBase;

//export const BaseURL = "https://rate2rank-0d561bf6674a.herokuapp.com/";
//export const BaseURL = "";
//export const BaseURL = "http://127.0.0.1:5000/";

