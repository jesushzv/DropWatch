import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initAnalytics } from "./lib/analytics";
import { initMetaPixel } from "./lib/metaPixel";
import "./styles.css";

initAnalytics();
initMetaPixel();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
