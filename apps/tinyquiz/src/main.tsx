import { createRoot } from "react-dom/client";
import TinyQuiz from "./TinyQuiz";
import "./index.css";
import { extendTheme } from "@chakra-ui/react";
import { ChakraProvider } from "@chakra-ui/react";
import { StrictMode } from "react";

const zIndices = {
  hide: -1,
  auto: "auto",
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

const theme = extendTheme({ zIndices });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
      <TinyQuiz />
    </ChakraProvider>
    ,
  </StrictMode>,
);
