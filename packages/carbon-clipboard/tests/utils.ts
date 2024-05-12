import {
  Carbon,
  corePresetPlugins,
  PinnedSelection,
  PluginManager,
  Schema,
} from "@emrgen/carbon-core";
import { blockPresetPlugins, node, title } from "@emrgen/carbon-blocks";
import { ImmutableNodeFactory, ImmutableState } from "@emrgen/carbon-react";

export const createCarbon = () => {
  const pm = new PluginManager([...corePresetPlugins, ...blockPresetPlugins]);
  const { specs } = pm;
  const scope = Symbol("test");
  const schema = new Schema(specs, new ImmutableNodeFactory(scope));
  const json = node("carbon", [node("document", [title()])]);
  const content = schema.nodeFromJSON(json)!;
  const state = ImmutableState.create(scope, content, PinnedSelection.IDENTITY);

  return new Carbon(state, schema, pm);
};
