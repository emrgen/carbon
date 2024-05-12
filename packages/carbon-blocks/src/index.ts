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
import { DocLink } from "./plugins/DocLink";
import { PageTree } from "./plugins/PageTree";
import { BlockContent } from "./plugins/BlockContent";
import { Frame } from "./plugins/Frame";
import { Insert } from "./plugins/Inserter";
import { Modal } from "./plugins/Modal";
import { TabGroup } from "./plugins/Tab";
import { HStack } from "./plugins/HStack";
import { Hint, ViewedPath } from "./plugins/Hint";
import { MCQ } from "./plugins/MCQ";
import { Question } from "./plugins/Question";
import {
  EndPath,
  Scale,
  StartPath,
  StepPath,
  ValuePath,
} from "./plugins/Scale";
import { Button } from "./plugins/Button";
import { BoldPlugin } from "./plugins/Bold";
import { ItalicPlugin } from "./plugins/Italic";
import { CodeSpanPlugin } from "./plugins/CodeSpan";
import { StrikePlugin } from "./plugins/Strike";
import { UnderLinePlugin } from "./plugins/UnderLine";
import { LinkPlugin } from "./plugins/Link";
import { TextColorPlugin } from "./plugins/Color";
import { BackgroundColorPlugin } from "./plugins/Background";
import { ImagePlugin } from "./plugins/ImagePlugin";

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
  new DocLink(),
  // new Table(),
  new CarbonRoot(),
  new PageTree(),
  new BlockContent(),
  new TabGroup(),
  new BlockContent(),
  new Frame(),
  new Insert(),
  new Modal(),
  new Hint(),
  new MCQ(),
  new Question(),
  new Scale(),
  new Button(),

  new BoldPlugin(),
  new ItalicPlugin(),
  new UnderLinePlugin(),
  new CodeSpanPlugin(),
  new StrikePlugin(),
  new LinkPlugin(),
  new TextColorPlugin(),
  new BackgroundColorPlugin(),
];

export * from "./events";
export * from "./plugins";
export * from "./utils";
export * from "./plugins/PageTree";
export * from "./plugins/Tab";

export { StartPath, EndPath, StepPath, ValuePath, ViewedPath };
