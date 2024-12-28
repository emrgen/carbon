import { blockPresetPlugins, node, title } from "@emrgen/carbon-blocks";
import {
  Carbon,
  PinnedSelection,
  PluginManager,
  Schema,
} from "@emrgen/carbon-core";
import { ImmutableNodeFactory, ImmutableState } from "../src";

export const createCarbon = (data = undefined) => {
  const pm = new PluginManager(blockPresetPlugins);
  const { specs } = pm;
  const scope = Symbol("test");
  const schema = new Schema(specs, new ImmutableNodeFactory(scope));
  const json = data ?? node("carbon", [node("page", [title()])]);
  const content = schema.nodeFromJSON(json)!;
  const state = ImmutableState.create(scope, content, PinnedSelection.IDENTITY);

  return new Carbon(state, schema, pm);
};
