import { useState } from "react";
import { RectSelector } from '../core/RectSelector';
import { RectSelectorContextProvider } from "../hooks/useRectSelector";
import {RectSelectController} from "./RectSelectController";
import { useCarbon } from "@emrgen/carbon-core";

export default function RectSelectContext(props) {
  const app = useCarbon();
  const [rectSelector] = useState(() => new RectSelector(app));

  return (
    <RectSelectorContextProvider value={rectSelector}>
      {props.children}
      <RectSelectController/>
    </RectSelectorContextProvider>
  );
}
