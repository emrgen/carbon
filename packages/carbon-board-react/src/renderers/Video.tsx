import {
  LocalVideoInfoPath,
  MediaReadyPath,
  stop,
  VideoPath,
} from "@emrgen/carbon-core";
import {
  CarbonBlock,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
  useNodeActivated,
  useNodeSelected,
} from "@emrgen/carbon-react";
import { useLinkInfo } from "@emrgen/carbon-blocks-react";
import { useCallback } from "react";
import ReactPlayer from "react-player";
import { useSquareBoard } from "../context";

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

  const { loading, bookmark } = useLinkInfo(
    node,
    VideoPath,
    LocalVideoInfoPath,
  );

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

  const handlePrepareVideo = useCallback(() => {
    app.cmd
      .Update(node, {
        [MediaReadyPath]: true,
      })
      .Dispatch();
  }, [app, node]);

  const isMediaReady = node.props.get(MediaReadyPath, false);

  return (
    <CarbonBlock
      node={node}
      custom={{
        onClick: (e) => {
          stop(e);
          board.onNodeClick(e, node);
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
        <div className={"sq-video-media-container"} data-loading={loading}>
          {!isMediaReady && (
            <div className={"sq-video-overlay"} onClick={handlePrepareVideo}>
              <img src={bookmark.image?.url} alt={bookmark.title} />
              <div className={"sq-video-overlay-icon"}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  {/*rounded*/}
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
          {isMediaReady && (
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
          )}
        </div>
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
