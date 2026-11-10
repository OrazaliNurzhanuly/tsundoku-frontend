import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { storage } from "./api/storage";
import { AppProvider } from "./store";
import "./styles.css";

const theme = storage.get("theme");
if (theme) document.documentElement.dataset.theme = theme;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
