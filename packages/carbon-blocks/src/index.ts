import { CarbonRoot } from "./plugins/CarbonRoot";

export * from "./create"
import {CarbonPlugin, Extension} from "@emrgen/carbon-core";
import {DocPlugin, NestablePlugin, Section} from "./plugins";
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

export const blockPresetPlugins: CarbonPlugin[] = [
  new Section(),
  new Divider(),
  new Header(),
  new DocPlugin(),
  new NestablePlugin(),
  new Collapsible(),
  new BulletedList(),
  new NumberedList(),
  new ChangeName(),
  new Equation(),
  // new HStack(),
  // new Stack(),
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
]

export * from './events'
export * from './plugins'
export * from './utils'
export * from './plugins/PageTree';
export * from './plugins/Tab';
