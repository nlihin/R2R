import { useState, useEffect } from "react";
import { json, redirect } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { Warpper } from "./AuthenticationStyles";
import BasicModal from "../components/BasicModal";
import { BaseURL } from "../routes/url";

const Authentication = () => {
  const [modalToggle, setModalToggle] = useState(false);
  const [modalText, setModalText] = useState();
  const [tokenExpiration, setTokenExpiration] = useState(0);

  //added for session expiration
  useEffect(() => {
  const checkTokenExpiration = async () => {
    const expirationTime = localStorage.getItem("tokenExpiration");
    if (expirationTime && Date.now() > parseInt(expirationTime)) {
      // Token has expired, refresh it
      const refreshRes = await fetch(`${BaseURL}refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const newToken = refreshData.access_token;
        const newExpiration = refreshData.expires_in * 1000 + Date.now();
        localStorage.setItem("token", newToken);
        localStorage.setItem("tokenExpiration", newExpiration);
        setTokenExpiration(newExpiration);
      } else {
        // Handle refresh error, e.g., redirect to login
        // Add your logic here
      }
    }
  };

  checkTokenExpiration();
}, [tokenExpiration]);

  return (
    <Warpper>
      {modalToggle && <BasicModal close={setModalToggle} text={modalText} />}
      <AuthForm modalText={setModalText} modalToggle={setModalToggle} />
    </Warpper>
  );
};

export default Authentication;

export const action = async ({ request }) => {
  const searchParams = new URL(request.url).searchParams;
  const mode = searchParams.get("mode") || "login";
  if (mode !== "login" && mode !== "register") {
    throw json({ message: "Unsupported mode." }, { status: 422 });
  }

  const data = await request.formData();
  let authData = {};
  if (mode === "login") {
    authData = {
      username: data.get("username"),
      password: data.get("password"),
      class_code: data.get("class_code"),
    };
  } else {
    authData = {
      username: data.get("username"),
      password: data.get("password"),
      email_address: data.get("email"),
      name: data.get("name"),
      class_code: data.get("class_code"),
    };
  }
  //console.log(5);



  // Fetch the user ID from the local storage
  //const classCode = authData.class_code;

  const res = await fetch(`${BaseURL}${mode}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(authData),
  });


  if (
    res.status === 422 ||
    res.status === 401 ||
    res.status === 400 ||
    res.status === 500
  ) {
    return res;
  }
  if (!res.ok) {
    throw json({ message: "Could not authenticate user." }, { status: 500 });
  }

  if (mode === "register") {
    return redirect("/auth");
  }
  const resData = await res.json();
  const token = resData.access_token;
  const expiration = resData.expires_in * 1000 + Date.now();
  localStorage.setItem("token", token);
  localStorage.setItem("tokenExpiration", expiration);
  //setTokenExpiration(expiration);

  return redirect("/");
};