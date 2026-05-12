import { useState, useId } from "react";
import styled from "styled-components";

const Wrap = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  display: block;
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 0.75rem;
  font: inherit;
  background-color: var(--color-gray-700);
  border: 1px solid var(--color-gray-600);
  border-radius: 4px;
  color: inherit;
  font-size: 15px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--color-primary-400);
  }
`;

const Toggle = styled.button`
  position: absolute;
  right: 0.25rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--color-gray-300);
  cursor: pointer;
  padding: 0.35rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--color-primary-300);
    background: rgba(255, 255, 255, 0.06);
  }
`;

function EyeIcon({ hidden }) {
  if (hidden) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const PasswordField = ({
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
  id: idProp,
}) => {
  const genId = useId();
  const id = idProp || genId;
  const [visible, setVisible] = useState(false);

  return (
    <Wrap>
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
      />
      <Toggle
        type="button"
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((v) => !v)}
      >
        <EyeIcon hidden={visible} />
      </Toggle>
    </Wrap>
  );
};

export default PasswordField;
