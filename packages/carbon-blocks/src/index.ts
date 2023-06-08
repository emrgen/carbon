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

export const blockPresets: Extension = {
	plugins: [
		new Section(),
		new Divider(),
		new Header(),
		new DocPlugin(),
		new DocPlugin(),
		new ListKeyboardPlugin(),
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
	]
}
