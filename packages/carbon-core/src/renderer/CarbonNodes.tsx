import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle, useMemo, useRef, useState
} from "react";
import { RendererProps } from "../core/Renderer";
import { useCarbon } from '../hooks/useCarbon';
import { useNodeChange } from "../hooks/useNodeChange";
import { preventAndStop } from '../utils/event';

export const JustEmpty = () => {
  return <span>&shy;</span>;
}

//
export const CarbonEmpty = (props: RendererProps) => {
  const { node } = props;
  return <JustEmpty key={node.key + "empty"} />;
};

const mapName = (name: string, parentName?: string) => {
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

  // NOTE: should register node when node is created and updated
  useEffect(() => {
    if (ref.current) {
      editor.store.register(node, ref.current);
    } else {
      editor.store.delete(node);
    }
    return () => {
      editor.store.delete(node);
    };
  }, [editor, node, version]);


  return (
    <Element
      ref={ref}
      data-name={name}
      // data-version={version}
      // data-size={node.size}
      {...attrs.html}
      {...custom}
    >
      {children}
    </Element>
  );
}

export const CarbonElement = (forwardRef(InnerElement));

export const RawText = memo(function RT(props: RendererProps) {
  const { node } = props
  const ref = useRef(document.createTextNode(node.textContent));
  return <>{ref.current}</>
});

// render text node with span
const InnerCarbonText = (props: RendererProps) => {
  const { node, version } = useNodeChange(props);

  // console.log('InnerCarbonText', node.parent?.version, node.version,node.textContent);
  const handleClick = (e) => {
    preventAndStop(e)
    window.location.href = node.attrs.node.link;
  }

  if (node.attrs.node.link) {
    return (
      <a href={node.attrs.node.link} onClick={handleClick}>
        <CarbonElement node={node} tag="span">
          <>{node.isEmpty ? <CarbonEmpty node={node} /> : node.textContent}</>
        </CarbonElement>
      </a>
    );
  }

  return (
    <CarbonElement node={node} tag="span">
      <>{node.isEmpty ? <CarbonEmpty node={node} /> : node.textContent}</>
    </CarbonElement>
  );
};

export const CarbonText = (InnerCarbonText);

// render block node with div
const InnerCarbonBlock = (props: RendererProps, ref) => {
  const { node, children, custom } = props;
  return (
    <CarbonElement node={node} tag={node.attrs.node.tag ?? "div"} ref={ref} custom={custom}>
      {children}
    </CarbonElement>
  );
}

export const CarbonBlock = memo(forwardRef(InnerCarbonBlock));

// render children of a node
export const CarbonChildren = (props: RendererProps) => {
  const { node } = props;

  if (node.isVoid) {
    return <CarbonEmpty node={node} />;
  }

  const children = node.children.map((n) => <CarbonNode node={n} key={n.key} />);
  return <>{children}</>;
};

// render node by name
export const CarbonNode = (props: RendererProps) => {
  const app = useCarbon();
  const { node, version } = useNodeChange(props);

  const RegisteredComponent = app.component(node.name);
  if (RegisteredComponent && RegisteredComponent === CarbonNode) {
    console.warn(`${node.name} is registered as CarbonNode, this will fall back to CarbonDefaultNode`)
  }

  if (RegisteredComponent && RegisteredComponent !== CarbonNode) {
    return <RegisteredComponent {...props} version={version} />;
  }

  return <CarbonDefaultNode {...props} version={version} />;
}

// default node for carbon editor with text and block
export const CarbonDefaultNode = (props: RendererProps) => {
  const { node } = props;

  const Component = node.isText ? CarbonText : CarbonBlock;
  return (
    <Component {...props}>
      <CarbonChildren node={node} />
    </Component>
  );
};

// render first node a content
export const CarbonNodeContent = (props: RendererProps) => {
  const { node, beforeContent, custom, wrapper } = props;
  const { children = [] } = node;

  if (!children.length) {
    return null;
  }

  return (
    <div data-type="content" {...wrapper}>
      {beforeContent}
      <CarbonNode node={children[0]} custom={custom} />
    </div>
  );
};

// render children except first node
export const CarbonNodeChildren = (props: RendererProps) => {
  const { node } = props;
  if (node.children.length < 2) return null;
  const children = node.children
    .slice(1)
    .map((n) => <CarbonNode node={n} key={n.key} />);
  return <div data-type="children">{children}</div>;
};

