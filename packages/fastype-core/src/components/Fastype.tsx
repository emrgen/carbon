import React from 'react';
import { ChakraProvider } from "@chakra-ui/react";
import { TrBus } from '../core/TrBus';
import { Carbon } from '@emrgen/carbon-core';
import { CarbonAppDocument } from '@emrgen/carbon-utils';
import { PorterOverlay } from '@emrgen/fastype-utils';

export interface FastypeProps {
  app: Carbon;
}

export function Fastype(props: FastypeProps) {
  const { app } = props;

  return (
    <ChakraProvider>
      <CarbonAppDocument app={app} />
      {/* <PorterOverlay/> */}
    </ChakraProvider>
  );
}
