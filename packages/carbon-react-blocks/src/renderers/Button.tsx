import React, { useCallback, useMemo, useRef } from "react";
import {
  CheckedPath, stop, preventAndStop, isContentEditable
} from "@emrgen/carbon-core";
import {CarbonBlock, CarbonNodeChildren, CarbonNodeContent, RendererProps, useCarbon, useSelectionHalo} from "@emrgen/carbon-react";
import {useCombineConnectors, useConnectorsToProps, useDragDropRectSelect} from "@emrgen/carbon-dragon-react";
import {useDocument} from "../hooks";

export function ButtonComp(props: RendererProps) {
  const {node} = props;
  const app = useCarbon();
  const ref = useRef(null);
  const document = useDocument();

  return (
    <CarbonBlock {...props} ref={ref}>
      <div className={'carbon-button'}>
        <CarbonNodeContent node={node} />
      </div>
    </CarbonBlock>
  );
}
