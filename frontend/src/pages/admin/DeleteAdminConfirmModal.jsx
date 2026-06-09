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
  max-width: 480px;
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
  margin: 0 0 1rem;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-gray-300);
`;

const Details = styled.dl`
  margin: 0 0 1.25rem;
  font-size: 14px;

  div {
    display: grid;
    grid-template-columns: 7rem 1fr;
    gap: 0.35rem 0.75rem;
    margin-bottom: 0.5rem;
  }

  dt {
    margin: 0;
    color: var(--color-gray-400);
  }

  dd {
    margin: 0;
    word-break: break-word;
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.65rem;
`;

const DeleteAdminConfirmModal = ({
  admin,
  onCancel,
  onConfirm,
  confirming,
}) => {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!admin || confirming) return undefined;

    cancelRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [admin, confirming, onCancel]);

  if (!admin) return null;

  return (
    <Overlay
      role="presentation"
      onClick={confirming ? undefined : onCancel}
    >
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-admin-title"
        aria-describedby="delete-admin-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <Title id="delete-admin-title">Delete admin permanently?</Title>
        <Body id="delete-admin-desc">
          This removes the admin account from the database. Class assignments
          for this admin will also be removed. This cannot be undone.
        </Body>
        <Details>
          <div>
            <dt>Admin ID</dt>
            <dd>{admin.admin_id}</dd>
          </div>
          <div>
            <dt>Username</dt>
            <dd>{admin.admin_username}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{admin.admin_email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{admin.role}</dd>
          </div>
        </Details>
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
            {confirming ? "Deleting…" : "Delete admin"}
          </DangerButton>
        </Footer>
      </Dialog>
    </Overlay>
  );
};

export default DeleteAdminConfirmModal;
