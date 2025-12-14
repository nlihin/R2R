import { useState } from "react";
import {
  Form,
  Link,
  useActionData,
  useNavigation,
  useSearchParams,
} from "react-router-dom";

import classes from "./AuthForm.module.css";
import PrivacyModal from "./PrivacyModal";

function AuthForm({ modalText, modalToggle }) {
  const data = useActionData();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const [iD, setID] = useState();
  const [reID, setReID] = useState();
  const [classCode, setClassCode] = useState();
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  
  let mode = searchParams.get("mode") || "login";
  const isLogin = mode === "login";
  const isSubmitting = navigation.state === "submitting";

  const chackingID = (e) => {
    if (e.target.id === "username") {
      setID(e.target.value);
    } else {
      setReID(e.target.value);
    }
  };

  const checkingCode = (e) => {
    setClassCode(e.target.value);
  };

  const submitChecks = () => {
    //for debugging
    console.log("API Response Data:", data);

    if (reID !== iD) {
      modalText("your IDs don't match, please retry.");
      modalToggle(true);
    } else if (reID.length !== 9) {
      modalText("your ID has to contain 9 digits, please retry.");
      modalToggle(true);
    } else if (data && data.msg) {
      modalText(data.msg);
      modalToggle(true);
    } else {
      modalToggle(false);
    }
  };
  return (
    <>
      <PrivacyModal 
        isOpen={privacyModalOpen} 
        onClose={() => setPrivacyModalOpen(false)} 
      />
      <Form method="post" className={classes.form}>
        <h1>{isLogin ? "Login" : "Register"}</h1>
        {data && data.msg && modalText(data.msg) && modalToggle(true)}
        <p>
          {/* <label htmlFor="email">אימייל</label> */}
          <input
            id="username"
            type="number"
            name="username"
            placeholder="id"
            required
            size="9"
            onChange={(e) => chackingID(e)}
          />
        </p>  
        <p>
          {/* <label htmlFor="image">Password</label> */}
          <input
            id="password"
            type="number"
            name="password"
            placeholder="re-enter your id"
            required
            size="9"
            onChange={(e) => chackingID(e)}
          />
        </p>
        {isLogin && (
          <p>
            {/* <label htmlFor="image">session</label> */}
            <input
              id="class_code"
              type="text"
              name="class_code"
              placeholder="class code"
              required
              size="3"
              onChange={(e) => checkingCode(e)}
            />
          </p>
        )}
        {!isLogin && (
          <p>
            {/* <label htmlFor="image">Password</label> */}
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Email"
              required
            />
          </p>
        )}
        {!isLogin && (
          <p>
            {/* <label htmlFor="image">Password</label> */}
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Full Name"
              required
            />
          </p>
        )}

        {!isLogin && (
          <div style={{ 
            marginTop: "20px", 
            display: "flex", 
            alignItems: "flex-start", 
            gap: "10px",
            padding: "15px",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px"
          }}>
            <input
              id="privacy_consent"
              type="checkbox"
              name="privacy_consent"
              checked={privacyConsent}
              onChange={(e) => setPrivacyConsent(e.target.checked)}
              style={{ 
                marginTop: "5px", 
                cursor: "pointer",
                width: "18px",
                height: "18px"
              }}
            />
            <label 
              htmlFor="privacy_consent" 
              style={{ 
                cursor: "pointer", 
                fontSize: "14px",
                margin: 0,
                flex: 1
              }}
            >
              I agree to the{" "}
              <span
                onClick={() => setPrivacyModalOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setPrivacyModalOpen(true);
                }}
                role="button"
                tabIndex={0}
                style={{
                  color: "#007bff",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Data Processing Agreement
              </span>
            </label>
          </div>
        )}

        <div className={classes.actions}>
          <Link to={`?mode=${isLogin ? "register" : "login"}`}>
            {isLogin ? "Click here to register" : "Click here to login"}
          </Link>
          <button disabled={isSubmitting} onClick={submitChecks}>
            {isSubmitting ? "Submitting..." : "ENTER"}
          </button>
        </div>
      </Form>
    </>
  );
}

export default AuthForm;
