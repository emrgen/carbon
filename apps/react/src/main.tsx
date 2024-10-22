import "./index.css";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { extendTheme } from "@chakra-ui/react";

import App from "./App";

const theme = extendTheme({});

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </StrictMode>,
);
