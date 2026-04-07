import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Remove splash screen when React mounts
const splash = document.getElementById("splash");
if (splash) {
  splash.style.opacity = "0";
  setTimeout(() => splash.remove(), 400);
}

createRoot(document.getElementById("root")!).render(<App />);