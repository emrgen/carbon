import { ReactRenderer } from "@emrgen/carbon-react";
import { Canvas } from "./renderers/Canvas";
import { BoardItem } from "./renderers/BoardItem";

import "./board.styl";
import { Board } from "./renderers/Board";
import { Column } from "./renderers/Column";
import { Image } from "./renderers/Image";
import { Video } from "./renderers/Video";
import { Comment } from "./renderers/Comment";
import { CommentLine } from "./renderers/CommentLine";

export const boardRenderers = [
  ReactRenderer.create("sqCanvas", Canvas),
  ReactRenderer.create("sqNote", BoardItem),
  ReactRenderer.create("sqHeading", BoardItem),
  ReactRenderer.create("sqBoard", Board),
  ReactRenderer.create("sqColumn", Column),
  ReactRenderer.create("sqImage", Image),
  ReactRenderer.create("sqVideo", Video),
  ReactRenderer.create("sqComment", Comment),
  ReactRenderer.create("sqCommentLine", CommentLine),
];
