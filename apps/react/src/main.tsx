import "./index.css";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { createRoot } from "react-dom/client";

import App from "./App";

const theme = extendTheme({});

createRoot(document.getElementById("root") as HTMLElement).render(
  // <StrictMode>
  <ChakraProvider theme={theme}>
    <App />
  </ChakraProvider>,
  // </StrictMode>,
);
