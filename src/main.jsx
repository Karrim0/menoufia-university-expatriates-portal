import { createRoot } from "react-dom/client";
import "./i18n.js";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./theme/ThemeContext";

createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);