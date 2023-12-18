import { ChakraProvider } from "@chakra-ui/react";
import {
  Carbon
} from "@emrgen/carbon-core";
import { CarbonApp } from "@emrgen/carbon-utils";
import { BlockMenu } from "@emrgen/fastype-utils";
import { FastypeCursor } from "./FastypeCursor";
import { ReactNode, useEffect } from "react";

export interface FastypeProps {
  app: Carbon;
  children?: ReactNode;
}

export function Fastype(props: FastypeProps) {
  const { app, children } = props;

  useEffect(() => {
    app.mounted()
  }, [app]);

  return (
    <ChakraProvider>
      <CarbonApp app={app} >
        {children}
      </CarbonApp>
    </ChakraProvider>
  );
}
