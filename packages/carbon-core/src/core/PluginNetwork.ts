import EventEmitter from "events";
import { CarbonPlugin } from "@emrgen/carbon-core";
import { cloneDeep, merge } from "lodash";

// message passing between plugins
// TODO: this is a temporary experimental solution, we need to find a better way to do this
// Messages should be sent to the plugin that is responsible for the node
// message should be standardized and documented
// message should not create a dependency between plugins
// message should be a request and response
// message should carry the plugin name and node id to avoid confusion and track the message path
export class PluginNetwork extends EventEmitter {
  kvStore: Map<string, any> = new Map();
  plugins: Map<string, CarbonPlugin> = new Map();

  get(key: string) {
    return this.kvStore.get(key);
  }

  set(key: string, value: any) {
    const prev = this.kvStore.get(key);
    this.kvStore.set(key, merge(cloneDeep(prev), value));
  }

  constructor(plugins: Record<string, CarbonPlugin>) {
    super();
    Object.entries(plugins).forEach(([name, plugin]) => {
      this.plugins.set(name, plugin);
      this.kvStore.set(name, {});
    });
  }
}
