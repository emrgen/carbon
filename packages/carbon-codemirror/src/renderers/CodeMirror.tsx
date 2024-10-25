import { CarbonBlock, RendererProps } from "@emrgen/carbon-react";
import { useRef } from "react";
import { CodeMirrorEditor } from "../components/CodeMirrorEditor";

export const CodeMirrorComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef<any>(null);

  return (
    <CarbonBlock node={node} ref={ref}>
      <CodeMirrorEditor node={node} />
    </CarbonBlock>
  );
};
