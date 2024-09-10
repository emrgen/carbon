import { CarbonPlugin, Node, PluginType } from "@emrgen/carbon-core";

declare module "@emrgen/carbon-core" {
  export interface Service {
    codec: {
      encodeMarkdown(node: Node): string;
      decodeMarkdown(data: string): Node;
      encodeHtml(node: Node): string;
      decodeHtml(data: string): Node;
    };
  }
}

export class CarbonCodec extends CarbonPlugin {
  type: PluginType = PluginType.Command;

  name = "codec";

  services() {
    return {
      encodeMarkdown: this.encodeMarkdown,
      decodeMarkdown: this.decodeMarkdown,
      encodeHtml: this._encodeHtml,
      decodeHtml: this._decodeHtml,
    };
  }

  encodeMarkdown(node: Node) {
    return "";
  }

  decodeMarkdown(data: string) {
    return {} as Node;
  }

  _encodeHtml(node: Node) {
    return "";
  }

  _decodeHtml(data: string) {
    return {} as Node;
  }
}
