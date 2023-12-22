import {Extension, Renderer} from "@emrgen/carbon-core";

import "./comment-editor.styl";
import {CommentEditor} from "./plugins/CommentEditor";
import {CommentEditorComp} from "./renderers/CommentEditor";


export const commentEditorExtension: Extension = {
  plugins: [
    new CommentEditor(),
  ],
  renderers: [
    Renderer.create("commentEditor", CommentEditorComp),
  ]
}
