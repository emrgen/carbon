import { Optional } from "@emrgen/types";

export type VNode = any;
import { Node } from './Node';

export type RenderComponent = (props: RendererProps) => VNode;

export interface RendererProps {
  // parent: Optional<Node>;
	node: Node;
	children?: any;
	[key: string]: any;
}

export class Renderer {
  name: string;
  component: RenderComponent;

  static create(name: string, component: RenderComponent) {
    return new Renderer(name, component);
  }

  private constructor(name: string, comp: RenderComponent) {
    this.name = name;
    this.component = comp;
  }
}

export class RenderManager {
  name = "renderManager";

  renderers: Map<string, RenderComponent>;
  fallback: RenderComponent;

  static create(
    renderers: Renderer[],
    fallback: RenderComponent
  ): RenderManager {
    const rendererMap = new Map<string, RenderComponent>();
    renderers.forEach((r) => {
      rendererMap.set(r.name, r.component);
    });

    return new RenderManager(rendererMap, fallback);
  }

  constructor(renderers: Map<string, RenderComponent>, fallback: RenderComponent) {
    this.renderers = renderers;
    this.fallback = fallback;
  }

  component(name: string): VNode {
    return this.renderers.get(name) ?? this.fallback;
  }
}

