import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { useSATChecker } from "seo-accessibility-tool/react";

function App() {
  useSATChecker({ rules: { "link-text": "warning" } }); // starts SAT in development
  return <p>This paragraph is rendered by React.</p>;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
