// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // Deine Tailwind- und sonstige CSS-Imports
import App from "./App"; // Hier wird App.js importiert

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
