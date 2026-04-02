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

export const AdminDashboardWrapper = styled.div`
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

export const AdminNavbar = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0.75rem 2rem;
  background-color: rgba(180, 172, 172, 0.6);
  border-bottom: 1px solid #000;
  margin-bottom: 2rem;

  h2 {
    color: var(--color-primary-300);
    font-size: 1.2rem;
  }

  button {
    background-color: rgb(20, 124, 194);
    border: 1px solid #fff;
    color: #fff;
    padding: 5px 20px;
    cursor: pointer;
    border-radius: 3px;
    font: inherit;
  }
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

export const ClassSelector = styled.select`
  padding: 0.5rem 1rem;
  background-color: var(--color-gray-700);
  border: 1px solid var(--color-gray-500);
  border-radius: 4px;
  color: inherit;
  font: inherit;
  font-size: 15px;
  min-width: 200px;

  &:focus { outline: none; border-color: var(--color-primary-400); }
`;

export const ErrorMsg = styled.p`
  color: #e57373;
  font-size: 13px;
  text-align: center;
`;
