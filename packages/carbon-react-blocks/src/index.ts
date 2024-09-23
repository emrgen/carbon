import { CarbonText, ReactRenderer } from "@emrgen/carbon-react";
import { DocumentComp, NestableComp } from "./renderers";
import { HeaderComp } from "./renderers/Header";
import TitleComp from "./renderers/TitleComp";
import DividerComp from "./renderers/Divider";
import CollapsibleListComp from "./renderers/Collapsible";
import { BulletedListComp } from "./renderers/BulletedList";
import { NumberedListComp } from "./renderers/NumberedList";
import { EquationComp } from "./renderers/Equation";
import { HStackComp } from "./renderers/HStackComp";
import ImageComp from "./renderers/ImageComp";
import TodoComp from "./renderers/Todo";
import { QuoteComp } from "./renderers/Quote";
import { CalloutComp } from "./renderers/Callout";
import { CodeComp } from "./renderers/Code";
import { DocLinkComp } from "./renderers/DocLink";
import { ColumnComp, RowComp, TableComp } from "./renderers/Table";
import { CarbonComp } from "./renderers/Carbon";
import { PageTreeComp } from "./renderers/PageTree";
import { PageTreeItemComp } from "./renderers/PageTreeItem";
import { TabComp, TabsComp } from "./renderers/TabComp";
import FrameComp from "./renderers/Frame";
import { BlockContentComp } from "./renderers/BlockContent";

import "./dnd.styl";
import "./style.styl";
import { Modal } from "./renderers/Modal";
import HintComp from "./renderers/Hint";
import MCQComp from "./renderers/MCQ";
import { QuestionComp } from "./renderers/Question";
import ScaleComp from "./renderers/Scale";
import { ButtonComp } from "./renderers/Button";
import { ExplainComp } from "./renderers/Explain";
import { PartialComp } from "./renderers/PartialComp";
import { BookmarkComp } from "./renderers/Bookmark";
import { PageLinkComp } from "./renderers/PageLink";
import { MentionComp } from "./renderers/Mention";

export const blockPresetRenderers = [
  ReactRenderer.create("document", DocumentComp),
  ReactRenderer.create("h1", HeaderComp),
  ReactRenderer.create("h2", HeaderComp),
  ReactRenderer.create("h3", HeaderComp),
  ReactRenderer.create("h4", HeaderComp),
  ReactRenderer.create("section", NestableComp),
  ReactRenderer.create("title", TitleComp),
  ReactRenderer.create("text", CarbonText),
  ReactRenderer.create("divider", DividerComp),
  ReactRenderer.create("collapsible", CollapsibleListComp),
  ReactRenderer.create("bulletList", BulletedListComp),
  ReactRenderer.create("numberList", NumberedListComp),
  ReactRenderer.create("equation", EquationComp),
  ReactRenderer.create("hstack", HStackComp),
  ReactRenderer.create("stack", HStackComp),
  ReactRenderer.create("image", ImageComp),
  // Renderer.create('video', VideoComp),
  ReactRenderer.create("todo", TodoComp),
  ReactRenderer.create("quote", QuoteComp),
  ReactRenderer.create("callout", CalloutComp),
  ReactRenderer.create("code", CodeComp),
  ReactRenderer.create("docLink", DocLinkComp),
  ReactRenderer.create("table", TableComp),
  ReactRenderer.create("row", RowComp),
  ReactRenderer.create("column", ColumnComp),
  ReactRenderer.create("carbon", CarbonComp),
  ReactRenderer.create("pageTree", PageTreeComp),
  ReactRenderer.create("pageTreeItem", PageTreeItemComp),
  ReactRenderer.create("tabs", TabsComp),
  ReactRenderer.create("tab", TabComp),
  ReactRenderer.create("tagsAttr", () => 1),
  ReactRenderer.create("frame", FrameComp),
  ReactRenderer.create("blockContent", BlockContentComp),
  ReactRenderer.create("modal", Modal),
  ReactRenderer.create("hint", HintComp),
  ReactRenderer.create("mcq", MCQComp),
  ReactRenderer.create("question", QuestionComp),
  ReactRenderer.create("scale", ScaleComp),
  ReactRenderer.create("button", ButtonComp),
  ReactRenderer.create("button", ButtonComp),
  ReactRenderer.create("explain", ExplainComp),
  ReactRenderer.create("partial", PartialComp),
  ReactRenderer.create("emoji", CarbonText),
  ReactRenderer.create("empty", CarbonText),
  ReactRenderer.create("mention", MentionComp),
  ReactRenderer.create("mentionAtom", CarbonText),
  ReactRenderer.create("bookmark", BookmarkComp),
  ReactRenderer.create("pageLink", PageLinkComp),
  // ReactRenderer.create("empty", EmptyInline),
];

export * from "./renderers/Document";

export * from "./hooks";
export * from "./components/renderAttrs";
