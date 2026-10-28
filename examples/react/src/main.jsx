import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const PHOTO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='80'%3E%3Crect width='120' height='80' fill='%2399c'/%3E%3C/svg%3E";

// The photo has no alt text on purpose: SAT reports it with this file and line.
function Photo() {
  return <img id="photo" src={PHOTO} width="120" height="80" />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Photo />
  </StrictMode>,
);
