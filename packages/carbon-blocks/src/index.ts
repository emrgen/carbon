import { CarbonPlugin } from "@emrgen/carbon-core";
import { NestablePlugin, PagePlugin, Paragraph } from "./plugins";
import { Attributes } from "./plugins/Attributes";
import { Bookmark } from "./plugins/Bookmark";
import { BulletedList } from "./plugins/BulletedList";
import { Button } from "./plugins/Button";
import { Callout } from "./plugins/Callout";
import { CarbonRoot } from "./plugins/CarbonRoot";
import { ChangeName } from "./plugins/ChangeName";
import { Code } from "./plugins/Code";
import { Collapsible } from "./plugins/Collapsible";
import { Divider } from "./plugins/Divider";
import { Emoji } from "./plugins/Emoji";
import { Equation } from "./plugins/Equation";
import { Frame } from "./plugins/Frame";
import { Header } from "./plugins/Header";
import { ViewedPath } from "./plugins/Hint";
import { HStack } from "./plugins/HStack";
import { Insert } from "./plugins/Inserter";
import { Mention } from "./plugins/Mention";
import { Modal } from "./plugins/Modal";
import { NewlinePlugin } from "./plugins/Newline";
import { NumberedList } from "./plugins/NumberedList";
import { PageLink } from "./plugins/PageLink";
import { PageTree } from "./plugins/PageTree";
import { PlainTextPlugin } from "./plugins/PlainText";
import { Quote } from "./plugins/Quote";
import { Sandbox } from "./plugins/Sandbox";
import {
  EndPath,
  Scale,
  StartPath,
  StepPath,
  ValuePath,
} from "./plugins/Scale";
import { TabGroup } from "./plugins/Tab";
import { Todo } from "./plugins/Todo";

export * from "./create";

export const blockPresetPlugins: CarbonPlugin[] = [
  new Paragraph(),
  new Divider(),
  new Header(),
  new PagePlugin(),
  new NestablePlugin(),
  new Collapsible(),
  new BulletedList(),
  new NumberedList(),
  new ChangeName(),
  new Equation(),
  new HStack(),
  new Todo(),
  new Quote(),
  new Callout(),
  new PageLink(),
  // new Table(),
  new CarbonRoot(),
  new PageTree(),
  new TabGroup(),
  new Frame(),
  new Insert(),
  new Modal(),
  new Scale(),
  new Button(),
  new Code(),
  new Emoji(),
  new Mention(),
  new Bookmark(),
  new Attributes(),
  new Sandbox(),
  new PlainTextPlugin(),
  new NewlinePlugin(),
];

export * from "./events";
export * from "./plugins";
export * from "./utils";
export * from "./plugins/PageTree";
export * from "./plugins/Tab";
export * from "./plugins/Tab";
export * from "./plugins/Bookmark";
export * from "./plugins/CodeTitle";
export * from "./types";

export { StartPath, EndPath, StepPath, ValuePath, ViewedPath };
