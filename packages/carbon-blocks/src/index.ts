import { CarbonRoot } from "./plugins/CarbonRoot";
import { CarbonPlugin } from "@emrgen/carbon-core";
import { NestablePlugin, PagePlugin, Section } from "./plugins";
import { Divider } from "./plugins/Divider";
import { Header } from "./plugins/Header";
import { Collapsible } from "./plugins/Collapsible";
import { BulletedList } from "./plugins/BulletedList";
import { NumberedList } from "./plugins/NumberedList";
import { ChangeName } from "./plugins/ChangeName";
import { Equation } from "./plugins/Equation";
import { Todo } from "./plugins/Todo";
import { Quote } from "./plugins/Quote";
import { Callout } from "./plugins/Callout";
import { PageLink } from "./plugins/PageLink";
import { PageTree } from "./plugins/PageTree";
import { BlockContent } from "./plugins/BlockContent";
import { Frame } from "./plugins/Frame";
import { Insert } from "./plugins/Inserter";
import { Modal } from "./plugins/Modal";
import { TabGroup } from "./plugins/Tab";
import { HStack } from "./plugins/HStack";
import { ViewedPath } from "./plugins/Hint";
import {
  EndPath,
  Scale,
  StartPath,
  StepPath,
  ValuePath,
} from "./plugins/Scale";
import { Button } from "./plugins/Button";
import { ImagePlugin } from "./plugins/ImagePlugin";
import { Partial } from "./plugins/Partial";
import { Code } from "./plugins/Code";
import { Emoji } from "./plugins/Emoji";
import { Mention } from "./plugins/Mention";
import { Bookmark } from "./plugins/Bookmark";
import { Attributes } from "./plugins/Attributes";
import { Sandbox } from "./plugins/Sandbox";

export * from "./create";

export const blockPresetPlugins: CarbonPlugin[] = [
  new Section(),
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
  new ImagePlugin(),
  // new Video(),
  new Todo(),
  new Quote(),
  new Callout(),
  new PageLink(),
  // new Table(),
  new CarbonRoot(),
  new PageTree(),
  new BlockContent(),
  new TabGroup(),
  new BlockContent(),
  new Frame(),
  new Insert(),
  new Modal(),
  new Scale(),
  new Button(),
  new Partial(),
  new Code(),
  new Emoji(),
  new Mention(),
  new Bookmark(),
  new Attributes(),
  new Sandbox(),
];

export * from "./events";
export * from "./plugins";
export * from "./utils";
export * from "./plugins/PageTree";
export * from "./plugins/Tab";
export * from "./plugins/Tab";
export * from "./plugins/Bookmark";

export { StartPath, EndPath, StepPath, ValuePath, ViewedPath };
