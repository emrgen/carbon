import {ChakraProvider, extendTheme} from "@chakra-ui/react";
import "./index.css";
import "./react-style.styl";
import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import App from "./App";

const theme = extendTheme({});
const root = createRoot(document.getElementById("root")!);

const Root = () => (
  <StrictMode>
    <ChakraProvider theme={theme}>
      <App/>
    </ChakraProvider>
  </StrictMode>
);

root.render(<Root/>);
