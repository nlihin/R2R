import styled from "styled-components";

export const Warpper = styled.div`
  width: 100%;
  height: 150px;
  height: 100%;
  background-color: ${(props) =>
    props.GroupStatus ? " rgba(133, 127, 127, 1)" : "rgb(10, 137, 223);"};
  border: 1px solid #fff;
  border-radius: 15px;

  pointer-events: ${(props) => (props.GroupStatus ? "none" : "auto")};
  > a {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    gap: 10px;
    width: 100%;
    height: 100%;
    text-decoration: none;
    color: #fff;
    text-shadow: 1px 2px black;
    cursor: ${(props) => (props.GroupStatus ? "not-allowed " : "pointer")};
  }

  @media (max-width: 740px) {
    border-radius: 5px;
    > a {
      gap: 7px;
      padding: 20px;
    }
  }
`;
export const GroupName = styled.h2``;
export const List = styled.ul`
  display: flex;
  width: 100%;
  height: 30%;
  //   flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  list-style: none;
`;
export const Item = styled.li`
  width: 10%;
  min-width: 50px;
  height: 100%;
  color: black;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  text-decoration: none;
  list-style: none;
  color: #fff;
  text-shadow: 2px 2px black;
`;
