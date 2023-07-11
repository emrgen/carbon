export * from './create'
import { CarbonText, Extension, Renderer, CarbonNode } from '@emrgen/carbon-core';
import { NestableComp } from './renderers/Nestable';
import { Section } from './plugins/Section';
import { DocumentComp } from './renderers/Document';
import { DocPlugin } from './plugins/Document';
import { Header } from './plugins/Header';

import './style.styl';
import DividerComp from './renderers/Divider';
import { Divider } from './plugins/Divider';
import TitleComp from './renderers/TitleComp';
import { CollapsibleList } from './plugins/Collapsible';
import CollapsibleListComp from './renderers/Collapsible';
import { BulletedListComp } from './renderers/BulletedList';
import { BulletedList } from './plugins/BulletedList';
import { ChangeName } from './plugins/ChangeName';
import { Equation } from './plugins/Equation';
import { EquationComp } from './renderers/Equation';
import { NumberedListComp } from './renderers/NumberedList';
import { NumberedList } from './plugins/NumberedList';
import { HStack, Stack } from './plugins/HStack';
import { HStackComp } from './renderers/HStackComp';
import { Image } from './plugins/Image';
import ImageComp from './renderers/ImageComp';
import { Todo } from './plugins/Todo';
import TodoComp from './renderers/CheckedList';
import { NestablePlugin } from './plugins';
import { Quote } from './plugins/Quote';
import { QuoteComp } from './renderers/Quote';
import { CalloutComp } from './renderers/Callout';
import { Callout } from './plugins/Callout';
import { CodeComp } from './renderers/Code';
import { Code } from './plugins/Code';
import { DocLink } from './plugins/DocLink';
import { DocLinkComp } from './renderers/DocLink';
import { Table } from './plugins/Table';
import { ColumnComp, RowComp, TableComp } from './renderers/Table';
import { Insert } from './plugins/Inserter';
import { Change } from './plugins/Change';
import { Carbon } from './plugins/Carbon';
import { CarbonComp } from './renderers/Carbon';
import { FileTree } from './plugins/FileTree';
import { FileTreeComp } from './renderers/FileTree';
import { FileTreeItemComp } from './renderers/FileTreeItem';

export const blockPresets: Extension = {
	plugins: [
		new Section(),
		new Divider(),
		new Header(),
		new DocPlugin(),
		new NestablePlugin(),
		new CollapsibleList(),
		new BulletedList(),
		new NumberedList(),
		new ChangeName(),
		new Equation(),
		new HStack(),
		new Stack(),
		new Image(),
		new Todo(),
		new Quote(),
		new Callout(),
		new Code(),
		new DocLink(),
		new Table(),
		new Insert(),
		new Change(),
		new Carbon(),
		new FileTree(),
	],
	renderers: [
		Renderer.create('document', DocumentComp),
		Renderer.create('h1', NestableComp),
		Renderer.create('h2', NestableComp),
		Renderer.create('h3', NestableComp),
		Renderer.create('h4', NestableComp),
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
		Renderer.create('todo', TodoComp),
		Renderer.create('quote', QuoteComp),
		Renderer.create('callout', CalloutComp),
		Renderer.create('code', CodeComp),
		Renderer.create('docLink', DocLinkComp),
		Renderer.create('table', TableComp),
		Renderer.create('row', RowComp),
		Renderer.create('column', ColumnComp),
		Renderer.create('carbon', CarbonComp),
		Renderer.create('fileTree', FileTreeComp),
		Renderer.create('fileTreeItem', FileTreeItemComp),
	]
}


export * from './events'
