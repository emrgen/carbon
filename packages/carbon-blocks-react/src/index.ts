import { CarbonText, ReactRenderer } from "@emrgen/carbon-react";
import { DocumentComp, NestableComp } from "./renderers";
import { AtomicText } from "./renderers/AtomicText";
import { BlockContentComp } from "./renderers/BlockContent";

import "./dnd.styl";
import "./style.styl";
import "./bem.styl";
import "./pageTree.styl";
import { BookmarkComp } from "./renderers/Bookmark";
import { BulletedListComp } from "./renderers/BulletedList";
import { ButtonComp } from "./renderers/Button";
import { CalloutComp } from "./renderers/Callout";
import { CarbonComp } from "./renderers/Carbon";
import { CodeComp } from "./renderers/Code";
import CollapsibleListComp from "./renderers/Collapsible";
import DividerComp from "./renderers/Divider";
import { DocLinkComp } from "./renderers/DocLink";
import { EquationComp } from "./renderers/Equation";
import { ExplainComp } from "./renderers/Explain";
import FrameComp from "./renderers/Frame";
import { HeaderComp } from "./renderers/Header";
import HintComp from "./renderers/Hint";
import { HStackComp } from "./renderers/HStackComp";
import MCQComp from "./renderers/MCQ";
import { MentionComp } from "./renderers/Mention";
import { Modal } from "./renderers/Modal";
import { NumberedListComp } from "./renderers/NumberedList";
import { PageLinkComp } from "./renderers/PageLink";
import { PageTreeComp } from "./renderers/PageTree";
import { PageTreeItemComp } from "./renderers/PageTreeItem";
import { PartialComp } from "./renderers/PartialComp";
import { PlainText } from "./renderers/PlainText";
import { QuestionComp } from "./renderers/Question";
import { QuoteComp } from "./renderers/Quote";
import ScaleComp from "./renderers/Scale";
import { TabComp, TabsComp } from "./renderers/TabComp";
import { ColumnComp, RowComp, TableComp } from "./renderers/Table";
import TitleComp from "./renderers/TitleComp";
import { TodoComp } from "./renderers/Todo";

export const blockPresetRenderers = [
  ReactRenderer.create("document", DocumentComp),
  ReactRenderer.create("h1", HeaderComp),
  ReactRenderer.create("h2", HeaderComp),
  ReactRenderer.create("h3", HeaderComp),
  ReactRenderer.create("h4", HeaderComp),
  ReactRenderer.create("paragraph", NestableComp),
  ReactRenderer.create("title", TitleComp),
  ReactRenderer.create("text", CarbonText),
  ReactRenderer.create("divider", DividerComp),
  ReactRenderer.create("collapsible", CollapsibleListComp),
  ReactRenderer.create("bulletList", BulletedListComp),
  ReactRenderer.create("numberList", NumberedListComp),
  ReactRenderer.create("equation", EquationComp),
  ReactRenderer.create("hstack", HStackComp),
  ReactRenderer.create("stack", HStackComp),
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
  ReactRenderer.create("atomicText", AtomicText),
  ReactRenderer.create("bookmark", BookmarkComp),
  ReactRenderer.create("pageLink", PageLinkComp),
  ReactRenderer.create("plainText", PlainText),
  // ReactRenderer.create("empty", EmptyInline),
];

export * from "./renderers/Document";

export * from "./hooks";
export * from "./components/renderAttrs";
export * from "./components/BlockOptions/BlockOptions";
