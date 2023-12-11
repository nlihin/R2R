import styled from "styled-components";

export const Warpper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  text-align: center;
  width: 100%;
  height: 100%;
  gap: 50px;
  color: #fff;
  max-width: 600px;
  @media (max-width: 767px) {
    gap: 20px;
    min-height: 60vh;
  }
`;
export const GroupName = styled.h2`
  color: #000;
`;

export const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
`;
export const BackButton = styled.p`
 // border: 1px solid #fff;
 // border-radius: 5px;
  width: 80px;
  height: 35px;
  cursor: pointer;
  display: flex;
  justify-content: space-around;
  align-items: center;
  text-align: center;
  > input,
  a {
    width: 100%;
    height: 100%;
    text-decoration: none;
    color: #fff;
    padding: 5px;
    background:rgb(20, 124, 194);
    border:0;
  }
  >input{
    font-size:16px;
  }
  >input:focus, a:focus{
    color:#000;
    background: rgb(20, 124, 194);
   
  }

  }
`;
