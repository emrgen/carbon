import {
  ForwardedRef,
  forwardRef,
  memo,
  use,
  useEffect,
  useImperativeHandle, useMemo, useRef, useState
} from "react";
import { RendererProps } from "../core/Renderer";
import { useCarbon } from '../hooks/useCarbon';
import { useNodeChange } from "../hooks/useNodeChange";
import { preventAndStop } from '../utils/event';
import { usePrevious } from "@uidotdev/usehooks";
import { LocalHtmlAttrPath, NamePath, TagPath } from "../core/NodeProps";

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
  const { key, name, version } = node;
  const editor = useCarbon();
  const ref = useRef(null);

  const attributes = useMemo(() => {
    return {
      ...custom,
      ...node.properties.prefix(LocalHtmlAttrPath) ?? {}
    }
  },[custom, node])

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
  }, [editor, node]);

  return (
    <Element
      ref={ref}
      data-name={name}
      data-version={version}
      data-id={key}
      {...attributes}
    >
      {children}
    </Element>
  );
}

export const CarbonElement = memo(forwardRef(InnerElement), (prev, next) => {
  return prev.node.version === next.node.version;
});

export const RawText = memo(function RT(props: RendererProps) {
  const { node } = props
  const ref = useRef(document.createTextNode(node.textContent));
  return <>{ref.current}</>
});

// render text node with span
const InnerCarbonText = (props: RendererProps) => {
  const {node, parent} = props;

  return (
    <CarbonElement node={node} tag="span">
      <>
        {node.isEmpty ? (
          <CarbonEmpty node={node} parent={parent}  />
        ) : (
          node.textContent
        )}
      </>
    </CarbonElement>
  );
};

export const CarbonText = memo(InnerCarbonText, (prev, next) => {
  return prev.node.version === next.node.version;
});

// render block node with div
const InnerCarbonBlock = (props: RendererProps, ref) => {
  const { node, children, custom } = props;

  const tag = useMemo(() => {
    return props.tag ?? node.properties.get(TagPath) ?? 'div';
  },[props.tag, node.properties]);

  return (
    <CarbonElement node={node} tag={tag} ref={ref} custom={custom}>
      {children}
    </CarbonElement>
  );
}

export const CarbonBlock = memo(forwardRef(InnerCarbonBlock), (prev, next) => {
  return prev.node.version === next.node.version;
});

// render children of a node
export const CarbonChildren = (props: RendererProps) => {
  const { node } = props;

  if (node.isVoid) {
    return <CarbonEmpty node={node}  />;
  }

  const children = node.children.map((n) => <CarbonNode node={n} key={n.key} />);
  return <>{children}</>;
};



// render node by name
export const InnerCarbonNode = (props: RendererProps) => {
  const app = useCarbon();
  const { node } = useNodeChange(props);

  // useEffect(() => {
  //   console.log('CarbonNode', node.name, node.id.toString(), node.toJSON());
  // })

  const name = useMemo(() => {
    return (node.properties.get(NamePath) ?? node.name) as string;
  },[node.name, node.properties]);

  const RegisteredComponent = app.component(name);
  if (RegisteredComponent && RegisteredComponent === CarbonNode) {
    console.warn(`${node.name} is registered as CarbonNode, this will fall back to CarbonDefaultNode`)
  }

  if (RegisteredComponent && RegisteredComponent !== CarbonNode) {
    return <RegisteredComponent {...props} node={node} />;
  }

  return <CarbonDefaultNode {...props} node={node} />;
}

export const CarbonNode = memo(InnerCarbonNode, (prev, next) => {
  return prev.node.version === next.node.version;
});

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

  const content = useMemo(() => {
    const { children = [] } = node;

    if (!children.length) {
      return null;
    }

    return children[0];
  },[node])

  if (!content) {
    return null;
  }

  return (
    <div data-type="content" {...wrapper}>
      {beforeContent}
      <CarbonNode
        node={content}
        // parent={node}
        custom={custom}
        key={content.key}
      />
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

