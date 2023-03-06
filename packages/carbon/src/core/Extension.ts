import { CarbonPlugin } from "./Plugin";
import { Renderer } from "./Renderer";

// Extension acts as group of plugins and renderers
export interface Extension {
	plugins: CarbonPlugin[];
	renderers?: Renderer[];
}
