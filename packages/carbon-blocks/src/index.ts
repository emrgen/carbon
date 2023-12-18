import { CarbonRoot } from "./plugins/CarbonRoot";

export * from "./create"
import { CarbonText, Extension, Renderer } from "@emrgen/carbon-core";
import { NestableComp } from "./renderers";
import { Section } from "./plugins";
import { DocumentComp } from "./renderers";
import { DocPlugin } from "./plugins";
import { Header } from "./plugins/Header";

import "./style.styl";
import "./dnd.styl";
import DividerComp from "./renderers/Divider";
import { Divider } from "./plugins/Divider";
import TitleComp from "./renderers/TitleComp";
import { Collapsible } from "./plugins/Collapsible";
import CollapsibleListComp from "./renderers/Collapsible";
import { BulletedListComp } from "./renderers/BulletedList";
import { BulletedList } from "./plugins/BulletedList";
import { ChangeName } from "./plugins/ChangeName";
import { Equation } from "./plugins/Equation";
import { EquationComp } from "./renderers/Equation";
import { NumberedListComp } from "./renderers/NumberedList";
import { NumberedList } from "./plugins/NumberedList";
import { HStack, Stack } from "./plugins/HStack";
import { HStackComp } from "./renderers/HStackComp";
import { Image } from "./plugins/Image";
import ImageComp from "./renderers/ImageComp";
import { Todo } from "./plugins/Todo";
import TodoComp from "./renderers/Todo";
import { NestablePlugin } from "./plugins";
import { Quote } from "./plugins/Quote";
import { QuoteComp } from "./renderers/Quote";
import { CalloutComp } from "./renderers/Callout";
import { Callout } from "./plugins/Callout";
import { CodeComp } from "./renderers/Code";
import { Code } from "./plugins/Code";
import { DocLink } from "./plugins/DocLink";
import { DocLinkComp } from "./renderers/DocLink";
import { Table } from "./plugins/Table";
import { ColumnComp, RowComp, TableComp } from "./renderers/Table";
import { Insert } from "./plugins/Inserter";
import { Change } from "./plugins/Change";
import { CarbonComp } from "./renderers/Carbon";
import { PageTree } from "./plugins/PageTree";
import { PageTreeComp } from "./renderers/PageTree";
import { PageTreeItemComp } from "./renderers/PageTreeItem";
import { Tab } from "./plugins/Tab";
import { TabComp, TabItemComp, TabTitlesComp, TextTitleComp } from "./renderers/TabComp";
import { VideoComp } from "./renderers/Video";
import { Video } from "./plugins/Video";
import { HeaderComp } from "./renderers/Header";
import FrameComp from "./renderers/Frame";
import { Frame } from "./plugins/Frame";
import { BlockContent } from "./plugins/BlockContent";
import { BlockContentComp } from "./renderers/BlockContent";

export const blockPresets: Extension = {
	plugins: [
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
		new HStack(),
		new Stack(),
		new Image(),
		new Video(),
		new Todo(),
		new Quote(),
		new Callout(),
		new Code(),
		new DocLink(),
		new Table(),
		new Insert(),
		new Change(),
		new CarbonRoot(),
		new PageTree(),
		new BlockContent(),
		new Tab(),
		new BlockContent(),
		new Frame(),
	],
	renderers: [
		Renderer.create('document', DocumentComp),
		Renderer.create('h1', HeaderComp),
		Renderer.create('h2', HeaderComp),
		Renderer.create('h3', HeaderComp),
		Renderer.create('h4', HeaderComp),
		Renderer.create('section', NestableComp),
		Renderer.create('title', TitleComp),
		Renderer.create('text', CarbonText),
		Renderer.create('divider', DividerComp),
		Renderer.create('collapsible', CollapsibleListComp),
		Renderer.create('bulletedList', BulletedListComp),
		Renderer.create('numberedList', NumberedListComp),
		Renderer.create('equation', EquationComp),
		Renderer.create('hstack', HStackComp),
		Renderer.create('stack', HStackComp),
		Renderer.create('image', ImageComp),
		Renderer.create('video', VideoComp),
		Renderer.create('todo', TodoComp),
		Renderer.create('quote', QuoteComp),
		Renderer.create('callout', CalloutComp),
		Renderer.create('code', CodeComp),
		Renderer.create('docLink', DocLinkComp),
		Renderer.create('table', TableComp),
		Renderer.create('row', RowComp),
		Renderer.create('column', ColumnComp),
		Renderer.create('carbon', CarbonComp),
		Renderer.create('pageTree', PageTreeComp),
		Renderer.create('pageTreeItem', PageTreeItemComp),
		Renderer.create('tab', TabComp),
		Renderer.create('tabContent', TabItemComp),
		Renderer.create('tabTitles', TabTitlesComp),
		Renderer.create('tabTitle', TextTitleComp),
		Renderer.create('tagsAttr', () => 1),
		Renderer.create('frame', FrameComp),
		Renderer.create('blockContent', BlockContentComp),
	]
}


export * from './events'
export * from './renderers'
export * from './plugins'
export * from './hooks'
export * from './utils'
