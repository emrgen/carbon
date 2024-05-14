import { expect, test } from "vitest";
import {
  Carbon,
  corePresetPlugins,
  Pin,
  PinnedSelection,
  PluginManager,
  printNode,
  Schema,
} from "@emrgen/carbon-core";
import {
  blockPresetPlugins,
  node,
  section,
  text,
  title,
} from "@emrgen/carbon-blocks";
import { ImmutableNodeFactory, ImmutableState } from "@emrgen/carbon-react";

const createCarbon = (json: any) => {
  const plugins = [...corePresetPlugins, ...blockPresetPlugins];

  const pm = new PluginManager(plugins);
  const scope = Symbol("test");

  const specs = pm.specs;
  const schema = new Schema(specs, new ImmutableNodeFactory(scope, () => ""));

  const root = schema.nodeFromJSON(json)!;
  const state = ImmutableState.create(scope, root, PinnedSelection.IDENTITY);

  return new Carbon(state, schema, pm);
};

test("put the pin at the start of inline", () => {
  const json = section([title([node("bold", [text("01234")]), text("5678")])]);
  const app = createCarbon(json);

  printNode(app.content);

  const pin = Pin.toStartOf(app.content);

  const at2 = pin?.moveBy(2);
  expect(at2?.offset).toBe(2);

  const at3 = pin?.moveBy(3);
  expect(at3?.offset).toBe(3);

  const at5 = pin?.moveBy(5);
  expect(at5?.offset).toBe(5);

  const at6 = pin?.moveBy(6)?.down();
  expect(at6?.offset).toBe(1);

  const at7 = pin?.moveBy(7)?.down();
  expect(at7?.offset).toBe(2);
});
