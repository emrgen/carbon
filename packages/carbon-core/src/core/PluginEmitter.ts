import { NodeTopicEmitter } from "./NodeEmitter";
import { CarbonPlugin } from "./CarbonPlugin";

// message passing between plugins
// TODO: this is a temporary experimental solution, we need to find a better way to do this
// Messages should be sent to the plugin that is responsible for the node
// message should be standardized and documented
// message should not create a dependency between plugins
// message should be a request and response
// message should carry the plugin name and node id to avoid confusion and track the message path
export class PluginEmitter extends NodeTopicEmitter {
  plugins: Map<string, CarbonPlugin> = new Map();

  constructor() {
    super();
  }

  register(plugin: CarbonPlugin) {
    this.plugins.set(plugin.name, plugin);
  }
}
