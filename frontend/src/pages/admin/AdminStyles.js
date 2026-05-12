import styled from "styled-components";

export const AdminWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  background-color: rgba(36, 36, 36, 1);
  color: rgba(255, 255, 255, 0.87);
  padding: 2rem 1rem;
`;

export const AdminCard = styled.div`
  background-color: var(--color-gray-800);
  border-radius: 8px;
  padding: 2rem;
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  h1 {
    color: var(--color-primary-300);
    font-size: 1.5rem;
    text-align: center;
  }

  input {
    display: block;
    width: 100%;
    padding: 0.5rem 0.75rem;
    font: inherit;
    background-color: var(--color-gray-700);
    border: 1px solid var(--color-gray-600);
    border-radius: 4px;
    color: inherit;
    font-size: 15px;

    &:focus {
      outline: none;
      border-color: var(--color-primary-400);
    }
  }
`;

export const AdminShell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 100vh;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  background-color: rgba(36, 36, 36, 1);
  color: rgba(255, 255, 255, 0.87);
  padding: 0;
  box-sizing: border-box;
`;

export const AdminDashboardWrapper = styled.div`
  width: 100%;
  max-width: 1160px;
  margin: 0 auto;
  padding: 1.5rem 1rem 2.5rem;
  flex: 1 0 auto;
  box-sizing: border-box;
  overflow-x: hidden;
  min-width: 0;

  @media (min-width: 992px) {
    padding: 1.75rem 1.5rem 3rem;
  }
`;

export const AdminNavbar = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
  padding: 0.75rem 1rem;
  background-color: rgba(180, 172, 172, 0.6);
  border-bottom: 1px solid #000;

  @media (max-width: 991px) {
    flex-direction: column;
    align-items: stretch;
  }

  @media (min-width: 992px) {
    padding: 0.75rem 1.5rem;
  }

  .admin-navbar-titles {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  h2 {
    color: var(--color-primary-300);
    font-size: 1.05rem;
    margin: 0;
    line-height: 1.3;
  }

  @media (min-width: 992px) {
    h2 {
      font-size: 1.2rem;
    }
  }

  .admin-navbar-sub {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.72);
    line-height: 1.3;
  }
`;

export const AdminFooter = styled.footer`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  margin-top: auto;
  padding: 1rem 1rem 1.5rem;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.42);
  border-top: 1px solid var(--color-gray-700);
  overflow-x: hidden;
  overflow-wrap: break-word;
`;

export const PrimaryButton = styled.button`
  background-color: var(--color-primary-500);
  color: var(--color-gray-900);
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1.5rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  min-width: 120px;

  &:hover { background-color: var(--color-primary-600); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

export const HeaderLogoutButton = styled(PrimaryButton)`
  min-width: auto;
  padding: 0.45rem 1.15rem;
  flex-shrink: 0;

  @media (max-width: 991px) {
    width: 100%;
    min-height: 2.75rem;
  }
`;

export const SecondaryButton = styled.button`
  background-color: transparent;
  color: var(--color-primary-300);
  border: 1px solid var(--color-primary-400);
  border-radius: 4px;
  padding: 0.4rem 1rem;
  font: inherit;
  cursor: pointer;

  &:hover { background-color: rgba(250, 225, 175, 0.1); }
`;

export const DangerButton = styled.button`
  background-color: transparent;
  color: #e57373;
  border: 1px solid #e57373;
  border-radius: 4px;
  padding: 0.3rem 0.75rem;
  font: inherit;
  cursor: pointer;
  font-size: 13px;

  &:hover { background-color: rgba(229, 115, 115, 0.1); }
`;

/* Visual shell matches .admin-select in admin.scss (native select only). */
export const ClassSelector = styled.select.attrs({ className: "admin-select" })`
  box-sizing: border-box;
`;

export const ErrorMsg = styled.p`
  color: #e57373;
  font-size: 13px;
  text-align: center;
`;
