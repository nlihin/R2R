import { useState, useEffect, useRef } from "react";
import {
  Form,
  Link,
  useActionData,
  useNavigation,
  useSearchParams,
} from "react-router-dom";

import classes from "./AuthForm.module.css";
import PrivacyModal from "./PrivacyModal";
import PrivacyWarningModal from "./PrivacyWarningModal";

function AuthForm({ modalText, modalToggle }) {
  const data = useActionData();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const [iD, setID] = useState();
  const [reID, setReID] = useState();
  const [classCode, setClassCode] = useState();
  const [privacyConsent, setPrivacyConsent] = useState(true);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [privacyWarningOpen, setPrivacyWarningOpen] = useState(false);
  const formRef = useRef(null);
  const skipPrivacyWarningRef = useRef(false);
  const pendingConsentSubmitRef = useRef(false);
  
  let mode = searchParams.get("mode") || "login";
  const isLogin = mode === "login";
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (!data || typeof data !== "object" || !data.msg) return;
    modalText(data.msg);
    modalToggle(true);
  }, [data, modalText, modalToggle]);

  useEffect(() => {
    modalToggle(false);
  }, [mode, modalToggle]);

  useEffect(() => {
    if (!pendingConsentSubmitRef.current || !privacyConsent) return;
    pendingConsentSubmitRef.current = false;
    formRef.current?.requestSubmit();
  }, [privacyConsent]);

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

  const handleFormSubmit = (e) => {
    modalToggle(false);
    if (!isLogin) {
      if (reID !== iD) {
        e.preventDefault();
        modalText("your IDs don't match, please retry.");
        modalToggle(true);
        return;
      }
      const idStr = reID != null ? String(reID) : "";
      if (!idStr || idStr.length !== 9) {
        e.preventDefault();
        modalText("your ID has to contain 9 digits, please retry.");
        modalToggle(true);
        return;
      }
      if (!privacyConsent && !skipPrivacyWarningRef.current) {
        e.preventDefault();
        setPrivacyWarningOpen(true);
        return;
      }
      skipPrivacyWarningRef.current = false;
    }
  };

  const handleDismissPrivacyWarning = () => {
    setPrivacyWarningOpen(false);
    setPrivacyConsent(true);
    skipPrivacyWarningRef.current = false;
    pendingConsentSubmitRef.current = false;
  };

  const handleConsentAndContinue = () => {
    setPrivacyWarningOpen(false);
    skipPrivacyWarningRef.current = false;
    pendingConsentSubmitRef.current = true;
    setPrivacyConsent(true);
  };

  const handleContinueWithoutConsent = () => {
    setPrivacyWarningOpen(false);
    skipPrivacyWarningRef.current = true;
    formRef.current?.requestSubmit();
  };
  return (
    <>
      <PrivacyModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />
      <PrivacyWarningModal
        isOpen={privacyWarningOpen}
        onClose={handleDismissPrivacyWarning}
        onConsent={handleConsentAndContinue}
        onContinue={handleContinueWithoutConsent}
      />
      <Form
        ref={formRef}
        method="post"
        className={classes.form}
        onSubmit={handleFormSubmit}
      >
        <h1>{isLogin ? "Log in" : "Register"}</h1>
        <p>
          <input
            id="username"
            type="number"
            name="username"
            placeholder="9-digit ID"
            required
            size="9"
            onChange={(e) => chackingID(e)}
          />
        </p>
        {isLogin && (
          <input
            type="hidden"
            name="password"
            value={iD || ""}
          />
        )}
        {!isLogin && (
          <p>
            <input
              id="password"
              type="number"
              name="password"
              placeholder="Re-enter ID"
              required
              size="9"
              onChange={(e) => chackingID(e)}
            />
          </p>
        )}
        {isLogin && (
          <p>
            <input
              id="class_code"
              type="text"
              name="class_code"
              placeholder="Class"
              required
              size="3"
              onChange={(e) => checkingCode(e)}
            />
          </p>
        )}
        {!isLogin && (
          <p>
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
          <p>
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
          <div
            style={{ 
              marginTop: "15px", 
              display: "flex", 
              alignItems: "flex-start", 
              gap: "8px"
            }}
          >
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
              I agree to the Data Processing{" "}
              <span
                onClick={() => setPrivacyModalOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setPrivacyModalOpen(true);
                }}
                role="button"
                tabIndex={0}
                style={{
                  color: "#fae1af",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                 Policy
              </span>
            </label>
          </div>
        )}

        <div
          className={classes.actions}
          style={{
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <button
            disabled={isSubmitting}
            type="submit"
            style={{
              minWidth: "245px",
              textAlign: "center",
              fontSize: "21px",
              fontWeight: "bold"
            }}
          >
            {isSubmitting ? "Submitting..." : isLogin ? "Log in" : "Register"}
          </button>
          <div style={{ textAlign: "center", fontSize: "16px", marginTop: "1rem"}}>
            {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
            <br />
            <Link to={`?mode=${isLogin ? "register" : "login"}`}>
              {isLogin ? "Register" : "Log in"}
            </Link>
          </div>
        </div>
      </Form>
    </>
  );
}

export default AuthForm;
