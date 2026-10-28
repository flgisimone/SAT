import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

function App() {
  return <p>This paragraph is rendered by React.</p>;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
