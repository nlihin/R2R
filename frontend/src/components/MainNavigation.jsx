import React from "react";
import { Form, NavLink, useRouteLoaderData } from "react-router-dom";
import { Navbar, List, Logo, Item, Logout } from "./MainNavigationStyles";
import R2RLogo from "./R2RLogo";

const MainNavigation = () => {
  const token = useRouteLoaderData();
  const logoutHandler = () => {
    //delete local storge and session storge
    //dispatch Auth store to false
  };
  return (
    <Navbar>
      <List>
        <Item>
          <Form action="/logout" method="post">
            <Logout>Logout</Logout>
          </Form>
        </Item>
        <Logo>
          <NavLink to="/" end>
            <R2RLogo />
            {/* <img
              src={}
              alt="TAU_LOGO"
              style={{ width: "100%", height: "5vh", objectFit: "contain" }}
            /> */}
          </NavLink>
        </Logo>
      </List>
    </Navbar>
  );
};

export default MainNavigation;
