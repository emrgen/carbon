import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";
import { useBoardElement } from "../hooks/useBoardElement";
import { useCallback } from "react";
import { preventAndStop } from "@emrgen/carbon-core";
import { useSquareBoard } from "../context";

export const Comment = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const board = useSquareBoard();
  const { attributes, listeners } = useBoardElement({ node });
  const isCollapsed = node.isCollapsed;

  const handleReply = useCallback(
    (e) => {
      preventAndStop(e);

      const { cmd } = app;
      const commentLine = app.schema.type("sqCommentLine")!?.default()!;
      // make the comment node active
      // if already active, and a comment line is active, deactivate the active comment line
      // insert new commentLine node
      // select the commentLine node

      cmd.inserter.insertAfter(node.lastChild!, commentLine);
    },
    [app, node.lastChild],
  );

  if (isCollapsed) {
    return <div className={"sq-comment-collapsed"}>{node.size}</div>;
  }

  return (
    <CarbonBlock node={node} custom={{ ...attributes, ...listeners }}>
      <CarbonChildren node={node} />
      <div className={"sq-comment-reply"} onClick={handleReply}>
        Reply
      </div>
    </CarbonBlock>
  );
};
