import React, {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useCarbon } from "../hooks/useCarbon";
import {
  LocalHtmlAttrPath,
  Mark,
  MarksPath,
  NamePath,
  RemoteHtmlAttrPath,
  TagPath,
} from "@emrgen/carbon-core";
import { useNodeChange, useRenderManager } from "../hooks";
import { RendererProps } from "./ReactRenderer";
import { merge } from "lodash";

export const JustEmpty = (props: RendererProps) => {
  if (props.node.isText) {
    return <br />;
  }

  // return <span>&shy;</span>;
  return (
    <span>
      <br />
    </span>
  );
};

interface CarbonPlaceholder extends RendererProps {
  placeholder?: string;
}

export const CarbonPlaceholder = (props: CarbonPlaceholder) => {
  const { node, placeholder = "Press to insert", ...rest } = props;

  if (node.isVoid) {
    return (
      <div className={"carbon-empty-"} {...rest}>
        {placeholder}
      </div>
    );
  }

  return null;
};

//
export const CarbonEmpty = (props: RendererProps) => {
  const { node } = props;
  return <JustEmpty key={node.key + "empty"} node={node} />;
};

const mapName = (name: string, parentName?: string) => {
  if (name === "title") {
    if (!parentName) {
      throw new Error("Title must have a parent");
    }

    return `${parentName}-content`;
  }
  return name;
};

const InnerElement = (
  props: RendererProps,
  forwardedRef: ForwardedRef<any>,
) => {
  const { tag: Tag = "div", node, children, custom } = props;
  const { key, name, renderVersion } = node;
  const editor = useCarbon();
  const ref = useRef<HTMLElement>(null);

  const attributes = useMemo(() => {
    const style = node.props.get("local/style") ?? {};
    const localAttrs = node.props.get(LocalHtmlAttrPath) ?? {};
    const remoteAttrs = node.props.get(RemoteHtmlAttrPath) ?? {};
    for (const [k, v] of Object.entries(localAttrs)) {
      if (v === null || v === undefined || v === "") {
        delete localAttrs[k];
      }
    }

    for (const [k, v] of Object.entries(remoteAttrs)) {
      if (v === null || v === undefined || v === "") {
        delete remoteAttrs[k];
      }
    }

    const styles = merge({}, style, props.style ?? {});

    return {
      ...localAttrs,
      ...remoteAttrs,
      ...(Object.keys(styles).length ? { styles } : {}),
      ...custom,
    };
  }, [custom, node]);

  // console.log(node.key, attributes, node.props.prefix(LocalHtmlAttrPath))

  // connect ref
  // https://t.ly/H4By
  useImperativeHandle(forwardedRef, () => ref.current);

  // NOTE: should register node when node is created and updated
  useEffect(() => {
    if (ref.current) {
      editor.store.register(node, ref.current);
      // ref.current.dataset.nodeId = node.id.toString();
    } else {
      editor.store.delete(node);
    }
    return () => {
      editor.store.delete(node);
    };
  }, [editor, node]);

  return (
    <Tag
      ref={ref}
      data-name={name}
      data-version={renderVersion}
      data-id={key}
      {...attributes}
    >
      {children}
    </Tag>
  );
};

export const CarbonElement = memo(forwardRef(InnerElement), (prev, next) => {
  return prev.node.key === next.node.key;
});

export const RawText = memo(function RT(props: RendererProps) {
  const { node } = props;
  const ref = useRef(document.createTextNode(node.textContent));
  return <>{ref.current}</>;
});

// hook to apply marks to text node
const useMarks = (marks: Mark[]) => {
  return useMemo(() => {
    const style = {};
    marks.forEach((mark) => {
      switch (mark.type) {
        case "bold":
          merge(style, {
            fontWeight: "bold",
          });
          break;
        case "strike":
          merge(style, {
            textDecoration: "line-through",
          });
          break;
        case "superscript":
          merge(style, {
            verticalAlign: "super",
            fontSize: "smaller",
          });
          break;
        case "subscript":
          merge(style, {
            verticalAlign: "sub",
            fontSize: "smaller",
          });
          break;
        case "italic":
          merge(style, {
            fontStyle: "italic",
          });
          break;
        case "underline":
          merge(style, {
            textDecoration: "underline",
          });
          break;
        case "color":
          merge(style, {
            color: mark.props?.color ?? "default",
          });
          break;
        case "background":
          merge(style, {
            background: mark.props?.color ?? "default",
            padding: "0.1em 0.1em",
          });
          break;
        case "code":
          merge(style, {
            background: "#f4f4f4",
            padding: "0.2em 0.4em",
            borderRadius: "3px",
            fontFamily:
              "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
            color: "#c7254e",
            fontSize: "14px",
          });
          break;
      }
    }, {});

    return style;
  }, [marks]);
};

// render text node with span
const InnerCarbonText = (props: RendererProps) => {
  const { node, parent } = props;
  const marks: Mark[] = node.props.get(MarksPath, [] as Mark[]);
  const style = useMarks(marks);

  return (
    <CarbonElement node={node} tag="span" custom={{ style }}>
      <>
        {node.isEmpty ? (
          <CarbonEmpty node={node} parent={parent} />
        ) : (
          node.textContent
        )}
      </>
    </CarbonElement>
  );
};

export const CarbonText = memo(InnerCarbonText, (prev, next) => {
  return prev.node.key === next.node.key;
});

// render block node with div
const InnerCarbonBlock = (props: RendererProps, ref) => {
  const { node, children, custom } = props;

  const tag = useMemo(() => {
    return props.tag ?? node.props.get(TagPath) ?? "div";
  }, [props.tag, node.props]);

  return (
    <CarbonElement node={node} tag={tag} ref={ref} custom={custom}>
      {children}
    </CarbonElement>
  );
};

export const CarbonBlock = memo(forwardRef(InnerCarbonBlock), (prev, next) => {
  return prev.node.key === next.node.key;
});

// render children of a node
export const CarbonChildren = (props: RendererProps) => {
  const { node } = props;

  if (node.isVoid) {
    return <CarbonEmpty node={node} />;
  }

  const children = node.children.map((n) => {
    // console.log('CarbonChildren', n.name, n.id.toString());
    return <CarbonNode node={n} key={n.key} />;
  });
  return <>{children}</>;
};

// render node by name
export const InnerCarbonNode = (props: RendererProps) => {
  const rm = useRenderManager();
  const { node } = useNodeChange(props);

  // useEffect(() => {
  //   console.log('CarbonNode', node.name, node.id.toString(), node.toJSON());
  // })

  // const component = useMemo(() => {
  const name = (node.props.get(NamePath) ?? node.name) as string;
  const RegisteredComponent = rm.component(name);

  if (RegisteredComponent) {
    if (RegisteredComponent === CarbonNode) {
      console.warn(
        `${node.name} is registered as CarbonNode, this will fall back to CarbonDefaultNode`,
      );
    } else {
      return <RegisteredComponent {...props} node={node} />;
    }
  }

  console.warn(
    "No component found for",
    node.name,
    "fall back to CarbonDefaultNode",
  );

  return <CarbonDefaultNode {...props} node={node} />;
  // }, [rm, node, props])
  //
  // if (!component) {
  //   return <></>
  // }
  //
  // return <>{component}</>;
};

export const CarbonNode = memo(InnerCarbonNode, (prev, next) => {
  return prev.node.key === next.node.key;
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
  const { node, beforeContent, afterContent, custom, wrapper } = props;

  const content = useMemo(() => {
    const { children = [] } = node;

    if (!children.length) {
      return null;
    }

    return children[0];
  }, [node]);

  if (!content) {
    return null;
  }

  return (
    <div data-type="content" {...wrapper}>
      {beforeContent}
      <CarbonNode node={content} custom={custom} key={content.key} />
      {afterContent}
    </div>
  );
};

interface ChildrenSegmentProps {
  nodes: Node[];
}

// render children except first node
export const CarbonNodeChildren = (props: RendererProps) => {
  const { node } = props;
  return useMemo(() => {
    if (node.children.length < 2) return null;

    const children = node.children.slice(1).map((n) => {
      // console.debug('CarbonChildren', n.name, n.id.toString());
      return <CarbonNode node={n} key={n.key} />;
    });

    // console.debug('CarbonNodeChildren', node.name, children.length);

    return <div data-type="children">{children}</div>;
  }, [node]);
};
