import styled from "styled-components";

export const Warpper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  width: 100%;
  height: 100vh;
  gap: 50px;
  color: #000;
  background-color: rgba(133, 127, 127, 1);
  > form {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 50vh;
    width: 100%;
    max-width: 350px;
    gap: 30px;

    padding: 0 10px;
  }
  @media (max-height: 440px) {
    gap: 20px;
  }
`;
