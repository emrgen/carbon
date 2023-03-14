import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle, useRef
} from "react";
import { RendererProps } from "../core/Renderer";
import { useCarbon } from '../hooks/useCarbon';
import { useNodeChange } from "../hooks/useNodeChange";

export default function JustEmpty() {
  return <span>&shy;</span>;
}

export const CarbonEmpty = (props: RendererProps) => {
  const { node } = props;
  return <JustEmpty key={node.key + "empty"} />;
};

const mapName = (name, parentName?: string) => {

  if (name === 'title') {
    if (!parentName) {
      throw new Error("Title must have a parent");
    }

    return `${parentName}-content`
  }
  return name
}

const InnerElement = (props: RendererProps, forwardedRef: ForwardedRef<any>) => {
  const { tag: Element = "div", node, children, custom } = props;
  const { key, name, attrs, data, version } = node;
  const editor = useCarbon();
  const ref = useRef(null);

  // connect ref
  // https://t.ly/H4By
  useImperativeHandle(forwardedRef, () => ref.current);

  useEffect(() => {
    if (ref.current) {
      editor.store.register(node, ref.current);
    } else {
      editor.store.delete(node);
    }
    return () => {
      editor.store.delete(node);
    };
  }, [editor, node]);

  return (
    <Element
      ref={ref}
      data-name={name}
      data-node-key={key + `(${node.renderVersion}/${node.updateVersion})`}
      data-version={version}
      // data-size={node.size}
      {...attrs.html}
      {...custom}
    >
      {children}
    </Element>
  );
}

export const CarbonElement = memo(forwardRef(InnerElement));

export const RawText = memo(function TT(props: RendererProps) {
  const {node} = props
  const ref = useRef(document.createTextNode(node.textContent));
  return <>{ref.current}</>
})

const InnerCarbonText = (props: RendererProps) => {
  const { node } = props;

  return (
    <CarbonElement node={node} tag="span">
      {node.isEmpty ? <CarbonEmpty node={node}/> :node.textContent}
    </CarbonElement>
  );
};

export const CarbonText = (InnerCarbonText);

const InnerCarbonBlock = (props: RendererProps, ref) => {
  const { node, children, custom } = props;
  return (
    <CarbonElement node={node} tag="div" ref={ref} custom={custom}>
      {children}
    </CarbonElement>
  );
}

export const CarbonBlock = memo(forwardRef(InnerCarbonBlock));

export const CarbonChildren = (props: RendererProps) => {
  const { node } = props;

  if (node.isVoid) {
    return <CarbonEmpty node={node} />;
  }

  const children = node.children.map((n) => <CarbonNode node={n} key={n.key} />);
  return <>{children}</>;
};

export const CarbonNode = (props: RendererProps) => {
  const app = useCarbon();
  const { node } = useNodeChange(props);

  const RegisteredComponent = app.component(node.name);
  if (RegisteredComponent && RegisteredComponent !== CarbonNode) {
    return <RegisteredComponent node={node} />;
  }

  return <CarbonDefaultNode node={node} />;
}

export const CarbonDefaultNode = (props: RendererProps) => {
  const { node } = props;

  const Component = node.isText ? CarbonText : CarbonBlock;
  return (
    <Component node={node}>
      <CarbonChildren node={node} />
    </Component>
  );
};

export const CarbonNodeContent = (props: RendererProps) => {
  const { node, placeholder, beforeContent, custom } = props;
  const { children = [] } = node;

  if (!children.length) {
    return null;
  }

  return (
    <div data-type="content" {...custom}>
      {beforeContent}
      <CarbonNode node={children[0]} />
    </div>
  );
};

export const CarbonNodeChildren = (props: RendererProps) => {
  const { node } = props;
  if (node.children.length < 2) return null;
  const children = node.children
    .slice(1)
    .map((n) => <CarbonNode node={n} key={n.key} />);
  return <div data-type="children">{children}</div>;
};
