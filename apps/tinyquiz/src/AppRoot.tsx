import { ChakraProvider } from "@chakra-ui/react";
import { extendTheme } from "@chakra-ui/react";

import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { RecoilRoot } from "recoil";
import "./apis/axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

// AppRoot is the root component of the application.
// It wraps the App component with the necessary providers.
export const AppRoot = () => {
  const queryClient = new QueryClient();

  return (
    <RecoilRoot>
      {/*<ColorModeScript initialColorMode={theme.config.initialColorMode} />*/}
      <ChakraProvider theme={theme}>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </BrowserRouter>
      </ChakraProvider>
    </RecoilRoot>
  );
};
