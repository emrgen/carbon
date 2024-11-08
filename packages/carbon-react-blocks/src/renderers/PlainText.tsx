import { ContenteditablePath, FocusEditablePath } from "@emrgen/carbon-core";
import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-react";
import { useEffect, useRef } from "react";

export const PlainText = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef<any>();

  useEffect(() => {
    const focusOnMount = node.props.get(FocusEditablePath);
    const isEditable = node.props.get(ContenteditablePath);
    if (focusOnMount && isEditable) {
      ref.current?.focus();
    }
  }, [node.props]);

  return (
    <CarbonBlock node={node} ref={ref}>
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};