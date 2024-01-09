import React from "react";
import { Outlet } from "react-router-dom";
import MainNavigation from "../components/MainNavigation";
import { Main, Footer } from "./RootStyles";

const Root = () => {
  return (
    <>
      <MainNavigation />
      <Main>
        <Outlet />
      </Main>
      <Footer>
        <div>
          <h4>Credits:</h4>
          <p>Server Development: Matan Lange </p>
          <p>Design, Client Development: Yehontan Nisan</p>
        </div>
      </Footer>
    </>
  );
};

export default Root;
