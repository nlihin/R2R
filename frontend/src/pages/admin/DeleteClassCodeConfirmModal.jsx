import { useEffect, useRef } from "react";
import styled from "styled-components";
import { DangerButton, SecondaryButton } from "./AdminStyles";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1rem;
`;

const Dialog = styled.div`
  background: var(--color-gray-800);
  border: 1px solid var(--color-gray-600);
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 420px;
  width: 100%;
  color: rgba(255, 255, 255, 0.87);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
`;

const Title = styled.h3`
  margin: 0 0 0.75rem;
  color: var(--color-primary-300);
  font-size: 1.15rem;
`;

const Body = styled.p`
  margin: 0 0 1.25rem;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-gray-300);
`;

const ModalError = styled.p`
  margin: 0 0 1rem;
  font-size: 13px;
  line-height: 1.45;
  color: #e57373;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.65rem;
`;

const DeleteClassCodeConfirmModal = ({
  classCode,
  onCancel,
  onConfirm,
  confirming,
  deleteError,
}) => {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!classCode || confirming) return undefined;

    cancelRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [classCode, confirming, onCancel]);

  if (!classCode) return null;

  return (
    <Overlay
      role="presentation"
      onClick={confirming ? undefined : onCancel}
    >
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-class-code-title"
        aria-describedby="delete-class-code-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <Title id="delete-class-code-title">Delete class code?</Title>
        <Body id="delete-class-code-desc">
          Permanently delete class code <strong>{classCode}</strong>? This is
          only allowed when the code is not assigned to admins or used in course
          data.
        </Body>
        {deleteError ? (
          <ModalError role="alert">{deleteError}</ModalError>
        ) : null}
        <Footer>
          <SecondaryButton
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={confirming}
          >
            Cancel
          </SecondaryButton>
          <DangerButton type="button" onClick={onConfirm} disabled={confirming}>
            {confirming ? "Deleting…" : "Delete class code"}
          </DangerButton>
        </Footer>
      </Dialog>
    </Overlay>
  );
};

export default DeleteClassCodeConfirmModal;
