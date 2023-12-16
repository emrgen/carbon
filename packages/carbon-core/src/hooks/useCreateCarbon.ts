import { flatten } from 'lodash';
import { useEffect, useState } from "react";
import { Extension } from "../core/Extension";
import { PluginManager } from '../core/PluginManager';
import { RenderManager, Renderer } from "../core/Renderer";
import { Schema } from '../core/Schema';
import { SchemaFactory } from '../core/SchemaFactory';
import { NodeJSON } from "../core/types";
import { CarbonDefaultNode } from "../renderer";
import { Carbon } from '../core/Carbon';
import { CarbonState, PinnedSelection } from "../core";

export interface InitNodeJSON extends Omit<NodeJSON, 'id'> {
	id?: string;
}

// create carbon app with extensions
export const createCarbon = (name: string, json: InitNodeJSON, extensions: Extension[] = []) => {
	const plugins = flatten(extensions.map(e => e.plugins ?? []));
	const renderers: Renderer[] = flatten(extensions.map(e => e.renderers ?? []));
	const renderer = RenderManager.create(renderers, CarbonDefaultNode)

	// the carbon state is scoped to this symbol
	const scope = Symbol(name);

	const pm = new PluginManager(plugins);
	const {specs} = pm;
	const schema = new Schema(specs, new SchemaFactory(scope));
	const content = schema.nodeFromJSON(json);


	if (!content) {
		throw new Error("Failed to parse app content");
	}

	const state = CarbonState.create(scope, content, PinnedSelection.IDENTITY);
	return new Carbon(state, schema, pm, renderer)
}

// create carbon app with extensions
export const useCreateCarbon = (name: string, json: InitNodeJSON, extensions: Extension[] = []) => {
	const [app] = useState(() => {
		return createCarbon(name, json, extensions)
	})

	return app;
}

export const useCreateCarbonFromState = (state: CarbonState, extensions: Extension[] = []) => {
	const plugins = flatten(extensions.map(e => e.plugins ?? []));
	const renderers: Renderer[] = flatten(extensions.map(e => e.renderers ?? []));
	const renderer = RenderManager.create(renderers, CarbonDefaultNode)

	const pm = new PluginManager(plugins);
	const {specs} = pm;
	const schema = new Schema(specs, new SchemaFactory(state.scope));

	return new Carbon(state, schema, pm, renderer)
}

// const saveDoc = throttle((state: CarbonState) => {
// 	fetch('http://localhost:3123/block/c2dfbdcc-d7e5-43c2-a55b-aa26b19840c1/content', {
// 		method: 'POST',
// 		headers: {
// 			'Content-Type': 'application/json'
// 		},
// 		body: JSON.stringify({ body: state.content.toJSON() })
// 	})
// }, 5000)

// const loadDoc = async () => {
// 	const response = await fetch('http://localhost:3123/block/c2dfbdcc-d7e5-43c2-a55b-aa26b19840c1/content');
// 	const data = await response.json();
// 	return data;
// }

// create carbon app with extensions and save to local storage
export const useCreateCachedCarbon = (name: string, json: InitNodeJSON, extensions: Extension[] = []) => {
	const [isLoaded, setIsLoaded] = useState(false);
	const [app, setApp] = useState(() => {
		const savedDoc = localStorage.getItem('carbon:content');
		if (savedDoc) {

			return createCarbon(name, JSON.parse(savedDoc), extensions);
		}

		return createCarbon(name, json, extensions);
	});

	// useEffect(() => {
	// 	if (isLoaded) return
	// 	loadDoc().then((doc) => {
	// 		const content = JSON.parse(doc).body
	// 		if (content) {
	// 			setApp(createCarbon(content, extensions))
	// 			setIsLoaded(true)
	// 		}
	// 	})
	// }, [app, extensions, isLoaded])

	useEffect(() => {
		const onChange = (state: CarbonState) => {
			localStorage.setItem('carbon:content', JSON.stringify(state.content.toJSON()));
			localStorage.setItem('carbon:selection', JSON.stringify(state.selection.toJSON()))
			// saveDoc(state);
		}
		app.on('changed', onChange);

		return () => {
			app.off('changed', onChange);
		}
	}, [app]);

	return app;
}

