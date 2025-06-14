import {
  Carbon,
  CarbonPlugin,
  EmptyPlaceholderPath,
  EventsOut,
  NodeJSON,
  PinnedSelection,
  PlaceholderPath,
  PluginManager,
  Schema,
} from "@emrgen/carbon-core";
import { flatten, noop, throttle } from "lodash";
import { useEffect, useState } from "react";
import { ImmutableState } from "../core";
import { ImmutableNodeFactory } from "../core/ImmutableNodeFactory";
import { CarbonDefaultNode, Extension, ReactRenderer, RenderManager } from "../renderer";

export interface InitNodeJSON extends Omit<NodeJSON, "id"> {
  id?: string;
}

// create carbon react with extensions
export const createCarbon = (name: string, json: InitNodeJSON, plugins: CarbonPlugin[] = []) => {
  // const renderers: ReactRenderer[] = flatten(extensions.map(e => e.renderers ?? []));
  // const renderer = RenderManager.create(renderers, CarbonDefaultNode)

  // the carbon state is scoped to this symbol
  const scope = Symbol(name);

  const pm = new PluginManager(plugins);
  const { specs } = pm;
  const schema = new Schema(specs, new ImmutableNodeFactory(scope));
  const content = schema.nodeFromJSON(json);

  // update the empty placeholder for nodes that have an empty first child
  content?.all((n) => {
    if (n.firstChild?.isEmpty) {
      const placeholder = n.props.get<string>(EmptyPlaceholderPath, " ");
      console.log(n.name, n.firstChild.name, placeholder);
      if (placeholder !== " ") {
        n.firstChild.updateProps({
          [PlaceholderPath]: placeholder,
        });
      }
    }
  });

  if (!content) {
    throw new Error("Failed to parse react content");
  }

  const sanitized = pm.sanitize(content);
  if (!sanitized) {
    throw new Error("Failed to sanitize react content");
  }

  const state = ImmutableState.create(scope, sanitized, PinnedSelection.IDENTITY);
  return new Carbon(state.freeze(), schema, pm);
};

// create carbon react with extensions
export const useCreateCarbon = (
  name: string,
  json: InitNodeJSON,
  plugins: CarbonPlugin[] = [],
  onCreate: (app: Carbon) => void = noop,
) => {
  const [app] = useState(() => {
    const app = createCarbon(name, json, plugins);
    onCreate(app);
    return app;
  });

  return app;
};

export const useCreateCarbonFromState = (state: ImmutableState, extensions: Extension[] = []) => {
  const plugins = flatten(extensions.map((e) => e.plugins ?? []));
  const renderers: ReactRenderer[] = flatten(extensions.map((e) => e.renderers ?? []));
  const renderer = RenderManager.create(renderers, CarbonDefaultNode);

  const pm = new PluginManager(plugins);
  const { specs } = pm;
  const schema = new Schema(specs, new ImmutableNodeFactory(state.scope));

  return new Carbon(state.freeze(), schema, pm);
};

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

// create carbon react with extensions and save to local storage
export const useCreateCachedCarbon = (
  name: string,
  json: InitNodeJSON,
  plugins: CarbonPlugin[] = [],
) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [app, setApp] = useState(() => {
    const savedDoc = localStorage.getItem(name + ":carbon:content");
    if (savedDoc) {
      return createCarbon(name, JSON.parse(savedDoc), plugins);
    }

    return createCarbon(name, json, plugins);
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
  // }, [react, extensions, isLoaded])

  useEffect(() => {
    // save to local storage on change with throttle of 5 seconds
    const saveState = throttle(() => {
      app.emit("external:saving");
      const state = app.state;
      localStorage.setItem(
        name + ":carbon:content",
        JSON.stringify(
          state.content.toJSON({
            props: {
              noLocal: true,
            },
          }),
        ),
      );
      localStorage.setItem(name + ":carbon:selection", JSON.stringify(state.selection.toJSON()));

      setTimeout(() => {
        app.emit("external:saved", state);
      }, 500);
      // saveDoc(state);
    }, 1000);

    const onChange = () => {
      app.emit("external:changed");
      saveState();
    };

    app.on(EventsOut.contentUpdated, onChange);

    return () => {
      app.off(EventsOut.contentUpdated, onChange);
    };
  }, [app, name]);

  return app;
};
