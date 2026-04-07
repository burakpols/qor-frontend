// index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom"; // Import BrowserRouter
import { setAuthorizationToken } from "./helpers/setAuthorizationToken";
import { Provider } from "react-redux";
import store from "./helpers/store";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";

const jwtToken = localStorage.getItem("jwtToken");
if (jwtToken) {
  setAuthorizationToken(jwtToken);
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    <Router>
      <App />
    </Router>
  </Provider>
);
