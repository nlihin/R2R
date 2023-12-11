import styled from "styled-components";

export const Navbar = styled.nav`
  display: flex;
  justify-content: space-around;
  align-items: center;
  text-align: center;
  width: 100%;
  height: 7vh;
  font-family: "Open Sans Hebrew", sans-serif;
  font-width: 400;
  line-height: 20px;
  font-size: 20px;
  background-color: rgba(180, 172, 172, 0.6);
  padding: 0 50px;
  border-bottom: 1px solid #000;
  @media (max-height: 440px) {
    height: 15vh;
  }
`;
export const List = styled.ul`
  display: grid;
  grid-template-areas: "logo logout";
  width: 100%;
  height: 100%;
  justify-content: space-between;
  align-items: center;
  text-align: center;
  list-style: none;
  //   @media (max-width: 740px) {
  //     grid-template-areas: "logo logo logout";
  //   }
`;
export const Logo = styled.li`
  grid-area: logo;
`;
export const Item = styled.li`
  grid-area: logout;
  background-color: rgb(20, 124, 194);
  border: 1px solid #fff;
  padding: 5px 20px;
  height: 35px;
  color: #fff;
  cursor: pointer;
  display: flex;
  justify-content: space-around;
  align-items: center;
  text-align: center;
  > form {
    width: 100%;
    height: 100%;
    // padding: 5px;
  }
`;
export const Logout = styled.button`
  all: unset;
  cursor: pointer;
  width: 100%;
  height: 100%;
  color: #fff;
`;
