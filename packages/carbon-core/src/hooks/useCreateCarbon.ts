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
import { CarbonState } from '../core';


// create carbon app with extensions
export const createCarbon = (json: NodeJSON, extensions: Extension[] = []) => {
	const plugins = flatten(extensions.map(e => e.plugins ?? []));
	const renderers: Renderer[] = flatten(extensions.map(e => e.renderers ?? []));
	const renderer = RenderManager.create(renderers, CarbonDefaultNode)

	const pm = new PluginManager(plugins);
	const {specs} = pm;
	const schema = new Schema(specs, new SchemaFactory());

	const content = schema.nodeFromJSON(json);
	if (!content) {
		throw new Error("Failed to parse app content");
	}

	return new Carbon(content, schema, pm, renderer)
}


// create carbon app with extensions
export const useCreateCarbon = (json: NodeJSON, extensions: Extension[] = []) => {
	const [app] = useState(() => {
		return createCarbon(json, extensions)
	})

	return app;
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
export const useCreateCachedCarbon = (json: NodeJSON, extensions: Extension[] = []) => {
	const [isLoaded, setIsLoaded] = useState(false);
	const [app, setApp] = useState(() => {
		const savedDoc = localStorage.getItem('carbon:content');
		if (savedDoc) {

			return createCarbon(JSON.parse(savedDoc), extensions);
		}

		return createCarbon(json, extensions);
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
		app.on('change', onChange);

		return () => {
			app.off('change', onChange);
		}
	}, [app]);

	return app;
}

