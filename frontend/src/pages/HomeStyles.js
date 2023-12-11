import styled from "styled-components";

export const List = styled.ul`
  display: flex;
  width: 100%;
  height: 100%;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  text-align: center;
  list-style: none;
  gap: 20px;
  @media (max-width: 740px) {
    grid-template-areas: "logout logo logo";
    gap: 15px;
  }
`;
export const Item = styled.li`
  width: 80%;
  max-width: 500px;
  height: 150px;
  color: #fff;
  display: flex;
  justify-content: space-around;
  align-items: center;
  text-align: center;
  @media (max-width: 740px) {
    height: 100%;
    max-height: 150px;

    font-size: 12px;
    width: 100%;
  }
`;
