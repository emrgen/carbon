import { ChakraProvider } from "@chakra-ui/react";
import {
  Carbon
} from "@emrgen/carbon-core";
import { CarbonApp } from "@emrgen/carbon-utils";
import { BlockMenu } from "@emrgen/fastype-utils";
import { FastypeCursor } from "./FastypeCursor";

export interface FastypeProps {
  app: Carbon;
}

export function Fastype(props: FastypeProps) {
  const { app } = props;

  return (
    <ChakraProvider>
      <CarbonApp app={app} />
      <FastypeCursor app={app} />
      <BlockMenu app={app} />
      {/* <PorterOverlay/> */}
    </ChakraProvider>
  );
}
