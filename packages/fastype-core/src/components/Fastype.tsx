import {ChakraProvider} from "@chakra-ui/react";
import {CarbonEditor} from "@emrgen/carbon-core";
import {Carbon} from "@emrgen/carbon-utils";
import {ReactNode, useEffect} from "react";

export interface FastypeProps {
  app: CarbonEditor;
  children?: ReactNode;
}

export function Fastype(props: FastypeProps) {
  const { app, children } = props;

  useEffect(() => {
    app.mounted();
  }, [app]);

  return (
    <ChakraProvider>
      <Carbon app={app} renderManager={{} as any}>
        {children}
      </Carbon>
    </ChakraProvider>
  );
}
