import {Extension, ReactRenderer} from "@emrgen/carbon-core";

import "./comment-editor.styl";
import {CommentEditor} from "./plugins/CommentEditor";
import {CommentEditorComp} from "./renderers/CommentEditor";


export const commentEditorExtension: Extension = {
  plugins: [
    new CommentEditor(),
  ],
  renderers: [
    ReactRenderer.create("commentEditor", CommentEditorComp),
  ]
}
