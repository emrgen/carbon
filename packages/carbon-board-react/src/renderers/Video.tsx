import {
  CarbonBlock,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
  useNodeActivated,
  useNodeSelected,
} from "@emrgen/carbon-react";
import { useSquareBoard } from "../context";
import { stop, VideoPath } from "@emrgen/carbon-core";
import { useCallback } from "react";
import ReactPlayer from "react-player";

export const Video = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const board = useSquareBoard();

  const { attributes: selectedAttributes, yes: isSelected } = useNodeSelected({
    node,
  });
  const { attributes: activeAttributes, yes: isActive } = useNodeActivated({
    node,
  });

  const videoSrc = node.props.get(VideoPath, "");
  const isCanvasChild = node.parent?.name === "sqCanvas";

  const handleSelectImage = useCallback(
    (e) => {
      if (isSelected) {
        stop(e);
      }
    },
    [isSelected],
  );

  return (
    <CarbonBlock
      node={node}
      custom={{
        onClick: (e) => {
          stop(e);
          board.onClick(e, node);
        },
        onMouseDown: (e) => {
          stop(e);
          board.onMouseDown(e, node.id);
        },
        ...selectedAttributes,
        ...activeAttributes,
        style: {
          position: isCanvasChild ? "absolute" : "relative",
        },
      }}
    >
      <div
        className={"sq-video"}
        onClick={handleSelectImage}
        contentEditable={false}
      >
        <ReactPlayer
          onReady={() => {}}
          url={videoSrc}
          controls
          width={"100%"}
          height={"100%"}
          // get the length of the video
          // onDuration={(duration) => console.log("onDuration", duration)}
          // onProgress={throttle(
          //   (progress) => console.log("onProgress", progress),
          //   1000
          // )}
          config={{
            youtube: {
              playerVars: {},
            },
          }}
        />
      </div>
      <div
        className={"sq-video-link"}
        contentEditable={false}
        onClick={(e) => {
          if (isSelected) stop(e);
        }}
      >
        <a href={videoSrc} target={"_blank"} rel={"noreferrer"}>
          {videoSrc}
        </a>
      </div>
      <div className={"sq-video-caption"}>
        <CarbonNodeContent node={node} />
      </div>
    </CarbonBlock>
  );
};
