import { CarbonPlugin } from "@emrgen/carbon-core";
import { NestablePlugin, Paragraph } from "./plugins";
import { Attributes } from "./plugins/Attributes";
import { BlockContent } from "./plugins/BlockContent";
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
import { Page } from "./plugins/Page";
import { PageLink } from "./plugins/PageLink";
import { PageProps } from "./plugins/PageProps";
import { PageTree } from "./plugins/PageTree";
import { PlainTextPlugin } from "./plugins/PlainText";
import { Props } from "./plugins/Props";
import { Quote } from "./plugins/Quote";
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
  // new Table(),
  new Attributes(),
  new Bookmark(),
  new BulletedList(),
  new Button(),
  new Callout(),
  new CarbonRoot(),
  new ChangeName(),
  new Code(),
  new Collapsible(),
  new Divider(),
  new Emoji(),
  new Equation(),
  new Frame(),
  new HStack(),
  new Header(),
  new Insert(),
  new Mention(),
  new Modal(),
  new NestablePlugin(),
  new NewlinePlugin(),
  new NumberedList(),
  new PageLink(),
  new Page(),
  new PageProps(),
  new PageTree(),
  new Paragraph(),
  new PlainTextPlugin(),
  new Props(),
  new Props(),
  new Quote(),
  new Scale(),
  new TabGroup(),
  new Todo(),
  new BlockContent(),
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
