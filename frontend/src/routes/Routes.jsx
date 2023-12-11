import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "../layouts/Root";
import Error from "../pages/Error";
import Home from "../pages/Home";
import Authentication, { action as authAction } from "../pages/Authentication";
import { action as logoutAction } from "../pages/Logout";
import { tokenLoader, checkAuthLoader } from "../utlis/auth";
import GroupRatings from "../pages/GroupRatings";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <Error />,
    id: "roots",
    loader: checkAuthLoader,
    children: [
      { index: true, element: <Home /> },
      {
        path: "groups/:groupId",
        element: <GroupRatings />,
      },
    ],
  },
  { path: "test", element: <Home />, loader: checkAuthLoader },
  { path: "auth", element: <Authentication />, action: authAction },
  { path: "logout", action: logoutAction },
]);

const Routes = () => {
  return <RouterProvider router={router} />;
};

export default Routes;
