import { CarbonPlugin } from "@emrgen/carbon-core";
import { cloneDeep, merge } from "lodash";

export class PluginStates {
  states: Map<string, PluginState> = new Map();

  get(name: string) {
    return this.states.get(name);
  }

  register(plugin: CarbonPlugin) {
    if (this.states.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    const state = new PluginState();
    this.states.set(plugin.name, state);
    return state;
  }
}

export class PluginState {
  store: Record<string, any> = {};

  get(key: string) {
    return this.store[key];
  }

  set(key: string, value: any) {
    this.store[key] = value;
  }

  merge(key: string, value: any) {
    this.store[key] = merge(this.store[key], value);
  }

  clone(key: string) {
    return cloneDeep(this.store[key]);
  }
}
