import {
  CarbonBlock,
  CarbonNodeContent,
  RendererProps,
} from "@emrgen/carbon-react";
import { CommentedByPath } from "@emrgen/carbon-board";
import { useSquareBoard } from "../context";
import { ContenteditablePath } from "@emrgen/carbon-core";

export const CommentLine = (props: RendererProps) => {
  const { node } = props;
  const board = useSquareBoard();

  const author = node.props.get(CommentedByPath, "");
  const isEditable = node.firstChild?.props.get(
    ContenteditablePath,
    false,
  ) as boolean;

  return (
    <CarbonBlock node={node}>
      <div className={"sq-comment-author-logo"}></div>
      <div className={"sq-comment-content"}>
        <div className={"sq-comment-author"}>
          <div className={"sq-comment-author-name"}>{author}</div>
          <div
            className={"sq-comment-edit"}
            onClick={(e) => {
              if (!isEditable) {
                board.onEditComment(e, node);
              } else {
                board.onSendComment(e, node);
              }
            }}
          >
            {isEditable ? "Send" : "Edit"}
          </div>
        </div>
        <CarbonNodeContent node={node} />
      </div>
    </CarbonBlock>
  );
};
