import {useRectSelectable} from "@emrgen/carbon-dragon-react";
import {VideoSrcPath} from "@emrgen/carbon-media";
import {CarbonBlock, RendererProps, useSelectionHalo,} from "@emrgen/carbon-react";
import {useRef,} from "react";
import {CarbonVideoPlayer} from "./Video";


export const MediaComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef<HTMLDivElement>(null);
  const { SelectionHalo } = useSelectionHalo(props);
  useRectSelectable({ ref, node });

  return (
    <>
      <CarbonBlock {...props} ref={ref}>
        <CarbonVideoPlayer src={node.props.get(VideoSrcPath, "")} />
        {SelectionHalo}
      </CarbonBlock>
    </>
  );
};
