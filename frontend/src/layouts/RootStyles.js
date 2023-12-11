import styled from "styled-components";
export const Main = styled.main`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  text-align: center;
  width: 100%;
  min-height: 90vh;
  height: 100%;
  padding: 50px 10px;
  @media (max-height: 440px) {
    min-height: 85vh;
    padding: 0 10px;
  }
`;

export const Footer = styled.footer`
  position: relative;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  text-align: left;
  width: 100%;
  height: 5vh;
  background: #171717;
  padding: 0;
  > * {
    display: inline-block;
  }
  @media (max-height: 440px) {
    padding: 0 10px;
  }
`;
