export * from './create'
import { CarbonText, Extension, Renderer, CarbonNode } from '@emrgen/carbon-core';
import { NestableComp } from './renderers/Nestable';
import { Section } from './plugins/Section';
import { DocumentComp } from './renderers/Document';
import { DocPlugin } from './plugins/Document';
import { Header } from './plugins/Header';

import './style.styl';
import { ListKeyboardPlugin } from './plugins/ListKeyboard';
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

export const blockPresets: Extension = {
	plugins: [
		new Section(),
		new Divider(),
		new Header(),
		new DocPlugin(),
		new DocPlugin(),
		new ListKeyboardPlugin(),
		new CollapsibleList(),
		new BulletedList(),
		new NumberedList(),
		new ChangeName(),
		new Equation(),
		new HStack(),
		new Stack(),
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
		Renderer.create('stack', CarbonNode),
	]
}
