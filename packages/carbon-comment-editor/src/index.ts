
import "./comment-editor.styl";
import {CommentEditor} from "./plugins/CommentEditor";
import {CommentEditorComp} from "./renderers/CommentEditor";
import {ReactRenderer} from "@emrgen/carbon-react";


export const commentEditorPlugin = new CommentEditor()

export const commentEditorComp = ReactRenderer.create("commentEditor", CommentEditorComp)
