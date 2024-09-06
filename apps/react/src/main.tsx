import "./index.css";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";

import { ChakraProvider } from "@chakra-ui/react";

import App from "./App";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </StrictMode>,
);
