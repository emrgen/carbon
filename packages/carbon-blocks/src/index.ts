import { CarbonRoot } from "./plugins/CarbonRoot";

export * from "./create"
import {CarbonPlugin, Extension} from "@emrgen/carbon-core";
import {PagePlugin, NestablePlugin, Section} from "./plugins";
import {Divider} from "./plugins/Divider";
import {Header} from "./plugins/Header";
import {Collapsible} from "./plugins/Collapsible";
import {BulletedList} from "./plugins/BulletedList";
import {NumberedList} from "./plugins/NumberedList";
import {ChangeName} from "./plugins/ChangeName";
import {Equation} from "./plugins/Equation";
import {Todo} from "./plugins/Todo";
import {Quote} from "./plugins/Quote";
import {Callout} from "./plugins/Callout";
import {DocLink} from "./plugins/DocLink";
import {PageTree} from "./plugins/PageTree";
import {BlockContent} from "./plugins/BlockContent";
import {Frame} from "./plugins/Frame";
import {Insert} from "./plugins/Inserter";
import {Modal} from "./plugins/Modal";
import {TabGroup} from "./plugins/Tab";
import {HStack} from "./plugins/HStack";
import {Hint} from "./plugins/Hint";
import {MCQ} from "./plugins/MCQ";
import {Question} from "./plugins/Question";
import {Scale} from "./plugins/Scale";

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
  // new Image(),
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
]

export * from './events'
export * from './plugins'
export * from './utils'
export * from './plugins/PageTree';
export * from './plugins/Tab';

import {StartPath, EndPath, StepPath, ValuePath} from "./plugins/Scale";
import {ViewedPath} from "./plugins/Hint";
import {Button} from "./plugins/Button";
import {Timeline} from "./plugins/Timeline";

export {
  StartPath,
  EndPath,
  StepPath,
  ValuePath,
  ViewedPath,
}
