import { Node } from "@emrgen/carbon-core";
import { ReactNode } from "react";
import { CarbonDefaultNode } from "./CarbonNodes";

export type VNode = any;

export type RenderComponent = (props: RendererProps) => VNode;

export interface RendererProps {
  node: Node;
  children?: any;
  before?: ReactNode;
  after?: ReactNode;
  custom?: Record<string, any>;
  comp?: (prev: RendererProps, next: RendererProps) => boolean;
  [key: string]: any;
}

// Default render prop comparator used in carbon nodes
export const defaultRenderPropComparator = (
  prev: RendererProps,
  next: RendererProps,
) => {
  return prev.node.key === next.node.key;
};

export class ReactRenderer {
  name: string;
  component: RenderComponent;

  static create(name: string, component: RenderComponent) {
    return new ReactRenderer(name, component);
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

  static from(renderers: ReactRenderer[]): RenderManager {
    return RenderManager.create(renderers, CarbonDefaultNode);
  }

  static create(
    renderers: ReactRenderer[],
    fallback: RenderComponent,
  ): RenderManager {
    const rendererMap = new Map<string, RenderComponent>();
    renderers.forEach((r) => {
      rendererMap.set(r.name, r.component);
    });

    return new RenderManager(rendererMap, fallback);
  }

  constructor(
    renderers: Map<string, RenderComponent>,
    fallback: RenderComponent,
  ) {
    this.renderers = renderers;
    this.fallback = fallback;
  }

  component(name: string): VNode {
    return this.renderers.get(name) ?? this.fallback;
  }
}
