import {
  LocalClassPath,
  LocalHtmlAttrPath,
  LocalStylePath,
  Mark,
  MarkSet,
  MarksPath,
  NamePath,
  RemoteHtmlAttrPath,
  RemoteStylePath,
  TagPath,
} from "@emrgen/carbon-core";
import { identity, kebabCase, merge, uniq } from "lodash";
import React, {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { is_env_development } from "../env";
import { useNodeChange, useRenderManager } from "../hooks";
import { useCarbon } from "../hooks/index";
import { RendererProps } from "./ReactRenderer";

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

const InnerElement: ForwardRefRenderFunction<
  any,
  Omit<RendererProps, "ref">
> = (props, forwardedRef) => {
  const { tag: Tag = "div", node, children, custom = {} as any } = props;
  const { key, name, renderVersion } = node;
  const editor = useCarbon();
  const ref = useRef<HTMLElement>(null!);

  const attributes = useMemo(() => {
    const { style = {}, tag, ...rest } = custom;
    const remoteStyle = node.props.get(RemoteStylePath, {});
    const localStyle = node.props.get(LocalStylePath, {});
    const localAttrs = node.props.get(LocalHtmlAttrPath, {});
    const remoteAttrs = node.props.get(RemoteHtmlAttrPath, {});
    const className = node.props.get(LocalClassPath, "");

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

    const styles = merge({}, remoteStyle, localStyle, style ?? {});

    return {
      ...localAttrs,
      ...remoteAttrs,
      ...(Object.keys(style).length ? { style: styles } : {}),
      ...rest,
      className: uniq([className, custom.className, kebabCase(node.name)])
        .filter(identity)
        .join(" "),
    };
  }, [custom, node]);

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

  const customProps = useMemo(() => {
    if (is_env_development()) {
      return {
        // "data-version": renderVersion,
        "data-id": key,
        // "data-parent": node.parent?.key,
      };
    }

    return {};
  }, [key]);

  const isBold = node.props.get(MarksPath)?.some((m) => m.name === "bold");

  return (
    <Tag ref={ref} data-name={node.type.name} {...customProps} {...attributes}>
      {isBold ? <b>{children}</b> : children}
      {/*{children}*/}
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
export const useMarks = (marks: Mark[]) => {
  return useMemo(() => {
    const style = {};
    marks.forEach((mark) => {
      switch (mark.name) {
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
            borderBottom: `0.05em solid`,
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
            // padding: "0.1em 0.1em",
          });
          break;
        case "code":
          merge(style, {
            background: "#f4f4f4",
            padding: "0.2em 0.2em",
            borderRadius: "3px",
            boxShadow: "0 0 0 1px #ddd inset",
            fontFamily:
              "Geist Mono, Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
            color: "#c7254e",
          });
          break;
      }
    }, {});

    return style;
  }, [marks]);
};

export const useClassName = (marks: Mark[]) => {
  return useMemo(() => {
    const classes: string[] = [];
    marks.forEach((mark) => {
      switch (mark.name) {
        case "code":
          classes.push("code");
          break;
      }
    }, {});

    return classes.join(" ");
  }, [marks]);
};

export const useTag = (marks: Mark[]) => {
  return useMemo(() => {
    if (MarkSet.from(marks).has(Mark.link(""))) {
      return "a";
    }
    return "span";
  }, [marks]);
};

// render text node with span
const InnerCarbonText = (props: RendererProps) => {
  const { node, parent } = props;
  const marks: Mark[] = node.props.get(MarksPath, [] as Mark[]);
  const style = useMarks(marks);
  const className = useClassName(marks);

  const tag = useTag(marks);

  const nodeProps = useMemo(() => {
    const props = {};
    if (tag === "a") {
      const link = MarkSet.from(marks).get(Mark.link("").name);
      if (link) {
        props["href"] = link.props?.href ?? "#";
        props["target"] = "_blank";
      }
    }

    return props;
  }, [marks, tag]);

  const attrs = useMemo(() => {
    const localAttrs =
      node.props.get<Record<string, any>>(LocalHtmlAttrPath) ?? {};
    const remoteAttrs =
      node.props.get<Record<string, any>>(RemoteHtmlAttrPath) ?? {};

    return {
      ...localAttrs,
      ...remoteAttrs,
    };
  }, [node]);

  return (
    <CarbonElement
      node={node}
      tag={tag}
      custom={{ style, className, ...nodeProps, ...attrs }}
    >
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
const InnerCarbonBlock: ForwardRefRenderFunction<
  any,
  Omit<RendererProps, "ref">
> = (props, ref) => {
  const { node, children, custom } = props;

  const tag = useMemo(() => {
    return (
      custom?.tag ?? node.type.spec.tag ?? node.props.get(TagPath) ?? "div"
    );
  }, [custom?.tag, node]);

  return (
    <CarbonElement node={node} tag={tag} ref={ref} custom={custom}>
      {children}
    </CarbonElement>
  );
};

export const CarbonBlock = memo(forwardRef(InnerCarbonBlock), (prev, next) => {
  return prev.node.key === next.node.key;
});

// WARNING: don't register this component in RenderManager, it will cause infinite loop
// this is a renders the appropriate component registered in the RenderManager
export const InnerCarbonNode = (props: RendererProps) => {
  const rm = useRenderManager();
  const { node } = useNodeChange(props);

  // useEffect(() => {
  //   console.log('CarbonNode', node.name, node.id.toString(), node.toJSON());
  // })

  if (!node) {
    console.error(props);
    throw Error("Node is undefined");
  }

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
    "falling back to CarbonDefaultNode",
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

// render children of a node
export const CarbonChildren = (props: RendererProps) => {
  const { node } = props;

  if (node.isVoid) {
    return <CarbonEmpty node={node} />;
  }

  const children = node.children.map((n) => {
    // console.log('CarbonChildren', n.name, n.id.toString());
    return <CarbonNode node={n} key={n.id.toString()} />;
  });
  return <>{children}</>;
};

// render first node a content
export const CarbonNodeContent = (props: RendererProps) => {
  const { node, beforeContent, afterContent, custom, wrapper, wrap } = props;

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

  if (!wrap) {
    return <CarbonNode node={content} custom={custom} key={content.key} />;
  }

  return (
    <div className={`ctiw`} {...wrapper}>
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
  const { node, wrap, custom, className } = props;
  return useMemo(() => {
    if (node.children.length < 2) return null;

    const children = node.view.children.nodes.slice(1).map((n) => {
      // console.debug('CarbonChildren', n.name, n.id.toString());
      return <CarbonNode node={n} key={n.key} custom={custom} />;
    });

    return <div className={"cnest"}>{children}</div>;
  }, [node, custom]);
};

const a = {
  id: "1111111111",
  name: "carbon",
  children: [
    {
      id: "151",
      name: "document",
      children: [
        {
          id: "152",
          name: "title",
          children: [
            {
              id: "153",
              name: "text",
              text: "Document Title",
              links: {},
              props: {
                local: {
                  html: { suppressContentEditableWarning: true, id: "ct" },
                },
                remote: { state: { marks: [] } },
              },
            },
          ],
          links: {},
          props: { remote: { state: { marks: [] } } },
        },
        {
          id: "154",
          name: "timeline",
          children: [
            {
              id: "155",
              name: "title",
              children: [
                {
                  id: "303",
                  name: "text",
                  text: "Install @chakra-ui/react",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
              ],
              links: {},
              props: {
                remote: { state: { marks: [] } },
                local: { html: { placeholder: " " } },
              },
            },
            {
              id: "306",
              name: "section",
              children: [
                {
                  id: "305",
                  name: "title",
                  children: [
                    {
                      id: "420",
                      name: "text",
                      text: "install chakra following the commad",
                      links: {},
                      props: {
                        local: {
                          html: {
                            suppressContentEditableWarning: true,
                            id: "ct",
                          },
                        },
                        remote: { state: { marks: [] } },
                      },
                    },
                  ],
                  links: {},
                  props: {
                    remote: { state: { marks: [] } },
                    local: { html: { placeholder: " ", "data-focused": true } },
                  },
                },
              ],
              links: {},
              props: {
                local: {
                  placeholder: { empty: "", focused: "Press / for commands" },
                  html: {
                    suppressContentEditableWarning: true,
                    className: "cse",
                  },
                },
                remote: { state: { marks: [] } },
              },
            },
          ],
          links: {},
          props: { remote: { state: { marks: [] } } },
        },
        {
          id: "157",
          name: "timeline",
          children: [
            {
              id: "158",
              name: "title",
              children: [
                {
                  id: "159",
                  name: "text",
                  text: "Add snippets",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
              ],
              links: {},
              props: { remote: { state: { marks: [] } } },
            },
            {
              id: "421",
              name: "section",
              children: [
                {
                  id: "422",
                  name: "title",
                  children: [
                    {
                      id: "438",
                      name: "text",
                      text: "Snippets are pre-built components that you can use to build your UI faster.",
                      links: {},
                      props: {
                        local: {
                          html: {
                            suppressContentEditableWarning: true,
                            id: "ct",
                          },
                        },
                        remote: { state: { marks: [] } },
                      },
                    },
                  ],
                  links: {},
                  props: {
                    remote: { state: { marks: [] } },
                    local: { html: { placeholder: " ", "data-focused": true } },
                  },
                },
              ],
              links: {},
              props: {
                local: {
                  placeholder: { empty: "", focused: "Press / for commands" },
                  html: {
                    suppressContentEditableWarning: true,
                    className: "cse",
                  },
                },
                remote: { state: { marks: [] } },
              },
            },
          ],
          links: {},
          props: { remote: { state: { marks: [] } } },
        },
        {
          id: "160",
          name: "timeline",
          children: [
            {
              id: "161",
              name: "title",
              children: [
                {
                  id: "162",
                  name: "text",
                  text: "Setup provider",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
              ],
              links: {},
              props: { remote: { state: { marks: [] } } },
            },
            {
              id: "439",
              name: "section",
              children: [
                {
                  id: "440",
                  name: "title",
                  children: [
                    {
                      id: "458",
                      name: "text",
                      text: "Wrap your application with the Provider component generated in the components/ui/provider component at the root of your application.",
                      links: {},
                      props: {
                        local: {
                          html: {
                            suppressContentEditableWarning: true,
                            id: "ct",
                          },
                        },
                        remote: { state: { marks: [] } },
                      },
                    },
                  ],
                  links: {},
                  props: {
                    remote: { state: { marks: [] } },
                    local: { html: { placeholder: " ", "data-focused": true } },
                  },
                },
              ],
              links: {},
              props: {
                local: {
                  placeholder: { empty: "", focused: "Press / for commands" },
                  html: {
                    suppressContentEditableWarning: true,
                    className: "cse",
                  },
                },
                remote: { state: { marks: [] } },
              },
            },
          ],
          links: {},
          props: { remote: { state: { marks: [] } } },
        },
        {
          id: "163",
          name: "section",
          children: [
            {
              id: "164",
              name: "title",
              children: [
                {
                  id: "165",
                  name: "text",
                  text: "question title",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
              ],
              links: {},
              props: { remote: { state: { marks: [] } } },
            },
          ],
          links: {},
          props: {
            local: {
              placeholder: { empty: "", focused: "Press / for commands" },
              html: { suppressContentEditableWarning: true, className: "cse" },
            },
            remote: { state: { marks: [] } },
          },
        },
        {
          id: "166",
          name: "section",
          children: [
            {
              id: "167",
              name: "title",
              children: [
                {
                  id: "168",
                  name: "text",
                  text: "question",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "169",
                  name: "text",
                  text: " ",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "170",
                  name: "text",
                  text: "title",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: {
                      state: {
                        marks: [
                          {
                            name: "link",
                            props: { href: "http://localhost:3000" },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
              links: {},
              props: { remote: { state: { marks: [] } } },
            },
          ],
          links: {},
          props: {
            local: {
              placeholder: { empty: "", focused: "Press / for commands" },
              html: { suppressContentEditableWarning: true, className: "cse" },
            },
            remote: { html: { style: { color: "red" } }, state: { marks: [] } },
          },
        },
        {
          id: "171",
          name: "section",
          children: [
            {
              id: "172",
              name: "title",
              children: [
                {
                  id: "173",
                  name: "text",
                  text: "question",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "174",
                  name: "text",
                  text: " ",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "175",
                  name: "text",
                  text: "italic bold",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: {
                      state: { marks: [{ name: "bold" }, { name: "italic" }] },
                    },
                  },
                },
                {
                  id: "176",
                  name: "text",
                  text: " ",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "177",
                  name: "text",
                  text: "colored",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: {
                      state: {
                        marks: [{ name: "color", props: { color: "red" } }],
                      },
                    },
                  },
                },
                {
                  id: "178",
                  name: "text",
                  text: " ",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "179",
                  name: "text",
                  text: "background",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: {
                      state: {
                        marks: [
                          { name: "background", props: { color: "#fb8500" } },
                        ],
                      },
                    },
                  },
                },
                {
                  id: "180",
                  name: "text",
                  text: " ",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "181",
                  name: "text",
                  text: "code",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [{ name: "code" }] } },
                  },
                },
                {
                  id: "182",
                  name: "text",
                  text: " ",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "183",
                  name: "text",
                  text: "sub",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [{ name: "subscript" }] } },
                  },
                },
                {
                  id: "184",
                  name: "text",
                  text: "strike",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [{ name: "strike" }] } },
                  },
                },
                {
                  id: "185",
                  name: "text",
                  text: "super",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [{ name: "superscript" }] } },
                  },
                },
                {
                  id: "186",
                  name: "text",
                  text: " ",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "187",
                  name: "text",
                  text: "underline",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [{ name: "underline" }] } },
                  },
                },
              ],
              links: {},
              props: { remote: { state: { marks: [] } } },
            },
          ],
          links: {},
          props: {
            local: {
              placeholder: { empty: "", focused: "Press / for commands" },
              html: { suppressContentEditableWarning: true, className: "cse" },
            },
            remote: { state: { marks: [] } },
          },
        },
        {
          id: "188",
          name: "tabs",
          children: [
            {
              id: "189",
              name: "tab",
              children: [
                {
                  id: "190",
                  name: "section",
                  children: [
                    {
                      id: "191",
                      name: "title",
                      children: [
                        {
                          id: "192",
                          name: "text",
                          text: "tab 1 content",
                          links: {},
                          props: {
                            local: {
                              html: {
                                suppressContentEditableWarning: true,
                                id: "ct",
                              },
                            },
                            remote: { state: { marks: [] } },
                          },
                        },
                      ],
                      links: {},
                      props: { remote: { state: { marks: [] } } },
                    },
                  ],
                  links: {},
                  props: {
                    local: {
                      placeholder: {
                        empty: "",
                        focused: "Press / for commands",
                      },
                      html: {
                        suppressContentEditableWarning: true,
                        className: "cse",
                      },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
              ],
              links: {},
              props: {
                local: {
                  html: {
                    contentEditable: true,
                    suppressContentEditableWarning: true,
                    className: "ctab__content",
                  },
                  state: { activated: true },
                },
                remote: {
                  state: { title: "tab 11 some big title", marks: [] },
                },
              },
            },
            {
              id: "193",
              name: "tab",
              children: [
                {
                  id: "194",
                  name: "section",
                  children: [
                    {
                      id: "195",
                      name: "title",
                      children: [
                        {
                          id: "196",
                          name: "text",
                          text: "tab 2 content",
                          links: {},
                          props: {
                            local: {
                              html: {
                                suppressContentEditableWarning: true,
                                id: "ct",
                              },
                            },
                            remote: { state: { marks: [] } },
                          },
                        },
                      ],
                      links: {},
                      props: { remote: { state: { marks: [] } } },
                    },
                  ],
                  links: {},
                  props: {
                    local: {
                      placeholder: {
                        empty: "",
                        focused: "Press / for commands",
                      },
                      html: {
                        suppressContentEditableWarning: true,
                        className: "cse",
                      },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
              ],
              links: {},
              props: {
                local: {
                  html: {
                    contentEditable: true,
                    suppressContentEditableWarning: true,
                    className: "ctab__content",
                  },
                },
                remote: { state: { title: "tab 12 medium", marks: [] } },
              },
            },
            {
              id: "197",
              name: "tab",
              children: [
                {
                  id: "198",
                  name: "section",
                  children: [
                    {
                      id: "199",
                      name: "title",
                      children: [
                        {
                          id: "200",
                          name: "text",
                          text: "tab 3 content",
                          links: {},
                          props: {
                            local: {
                              html: {
                                suppressContentEditableWarning: true,
                                id: "ct",
                              },
                            },
                            remote: { state: { marks: [] } },
                          },
                        },
                      ],
                      links: {},
                      props: { remote: { state: { marks: [] } } },
                    },
                  ],
                  links: {},
                  props: {
                    local: {
                      placeholder: {
                        empty: "",
                        focused: "Press / for commands",
                      },
                      html: {
                        suppressContentEditableWarning: true,
                        className: "cse",
                      },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
              ],
              links: {},
              props: {
                local: {
                  html: {
                    contentEditable: true,
                    suppressContentEditableWarning: true,
                    className: "ctab__content",
                  },
                },
                remote: { state: { title: "tab 13", marks: [] } },
              },
            },
          ],
          links: {},
          props: {
            local: {
              html: {
                contentEditable: false,
                suppressContentEditableWarning: true,
                className: "ctabs",
              },
              style: {},
            },
            remote: { state: { marks: [] } },
          },
        },
        {
          id: "201",
          name: "section",
          children: [
            {
              id: "202",
              name: "title",
              children: [
                {
                  id: "203",
                  name: "text",
                  text: "section 1",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
              ],
              links: {},
              props: { remote: { state: { marks: [] } } },
            },
          ],
          links: {},
          props: {
            local: {
              placeholder: { empty: "", focused: "Press / for commands" },
              html: { suppressContentEditableWarning: true, className: "cse" },
            },
            remote: { state: { marks: [] } },
          },
        },
        {
          id: "204",
          name: "question",
          children: [
            {
              id: "205",
              name: "title",
              children: [
                {
                  id: "206",
                  name: "text",
                  text: "question title",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
              ],
              links: {},
              props: { remote: { state: { marks: [] } } },
            },
            {
              id: "207",
              name: "mcq",
              children: [
                {
                  id: "208",
                  name: "mcqOption",
                  children: [
                    {
                      id: "209",
                      name: "title",
                      children: [
                        {
                          id: "210",
                          name: "text",
                          text: "option 1",
                          links: {},
                          props: {
                            local: {
                              html: {
                                suppressContentEditableWarning: true,
                                id: "ct",
                              },
                            },
                            remote: { state: { marks: [] } },
                          },
                        },
                      ],
                      links: {},
                      props: { remote: { state: { marks: [] } } },
                    },
                  ],
                  links: {},
                  props: {
                    local: {
                      html: {
                        contentEditable: true,
                        suppressContentEditableWarning: true,
                      },
                      placeholder: { empty: "", focused: "" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "211",
                  name: "mcqOption",
                  children: [
                    {
                      id: "212",
                      name: "title",
                      children: [
                        {
                          id: "213",
                          name: "text",
                          text: "option 2",
                          links: {},
                          props: {
                            local: {
                              html: {
                                suppressContentEditableWarning: true,
                                id: "ct",
                              },
                            },
                            remote: { state: { marks: [] } },
                          },
                        },
                      ],
                      links: {},
                      props: { remote: { state: { marks: [] } } },
                    },
                  ],
                  links: {},
                  props: {
                    local: {
                      html: {
                        contentEditable: true,
                        suppressContentEditableWarning: true,
                      },
                      placeholder: { empty: "", focused: "" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "214",
                  name: "mcqOption",
                  children: [
                    {
                      id: "215",
                      name: "title",
                      children: [
                        {
                          id: "216",
                          name: "text",
                          text: "option 3",
                          links: {},
                          props: {
                            local: {
                              html: {
                                suppressContentEditableWarning: true,
                                id: "ct",
                              },
                            },
                            remote: { state: { marks: [] } },
                          },
                        },
                      ],
                      links: {},
                      props: { remote: { state: { marks: [] } } },
                    },
                  ],
                  links: {},
                  props: {
                    local: {
                      html: {
                        contentEditable: true,
                        suppressContentEditableWarning: true,
                      },
                      placeholder: { empty: "", focused: "" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "217",
                  name: "mcqOption",
                  children: [
                    {
                      id: "218",
                      name: "title",
                      children: [
                        {
                          id: "219",
                          name: "text",
                          text: "option 4",
                          links: {},
                          props: {
                            local: {
                              html: {
                                suppressContentEditableWarning: true,
                                id: "ct",
                              },
                            },
                            remote: { state: { marks: [] } },
                          },
                        },
                      ],
                      links: {},
                      props: { remote: { state: { marks: [] } } },
                    },
                  ],
                  links: {},
                  props: {
                    local: {
                      html: {
                        contentEditable: true,
                        suppressContentEditableWarning: true,
                      },
                      placeholder: { empty: "", focused: "" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
              ],
              links: {},
              props: {
                local: {
                  html: {
                    contentEditable: false,
                    suppressContentEditableWarning: true,
                  },
                  placeholder: {
                    empty: "Question Title",
                    focused: "Question Title",
                  },
                },
                remote: { state: { marks: [] } },
              },
            },
            {
              id: "220",
              name: "hints",
              children: [
                {
                  id: "221",
                  name: "hint",
                  children: [
                    {
                      id: "222",
                      name: "title",
                      children: [
                        {
                          id: "223",
                          name: "text",
                          text: "hint 1",
                          links: {},
                          props: {
                            local: {
                              html: {
                                suppressContentEditableWarning: true,
                                id: "ct",
                              },
                            },
                            remote: { state: { marks: [] } },
                          },
                        },
                      ],
                      links: {},
                      props: { remote: { state: { marks: [] } } },
                    },
                    {
                      id: "224",
                      name: "section",
                      children: [
                        {
                          id: "225",
                          name: "title",
                          children: [
                            {
                              id: "226",
                              name: "text",
                              text: "hint content",
                              links: {},
                              props: {
                                local: {
                                  html: {
                                    suppressContentEditableWarning: true,
                                    id: "ct",
                                  },
                                },
                                remote: { state: { marks: [] } },
                              },
                            },
                          ],
                          links: {},
                          props: { remote: { state: { marks: [] } } },
                        },
                      ],
                      links: {},
                      props: {
                        local: {
                          placeholder: {
                            empty: "",
                            focused: "Press / for commands",
                          },
                          html: {
                            suppressContentEditableWarning: true,
                            className: "cse",
                          },
                        },
                        remote: { state: { marks: [] } },
                      },
                    },
                  ],
                  links: {},
                  props: { remote: { state: { marks: [] } } },
                },
              ],
              links: {},
              props: {
                local: {
                  html: {
                    contentEditable: false,
                    suppressContentEditableWarning: true,
                  },
                },
                remote: { state: { marks: [] } },
              },
            },
          ],
          links: {},
          props: { remote: { state: { marks: [] } } },
        },
        {
          id: "227",
          name: "question",
          children: [
            {
              id: "228",
              name: "title",
              children: [
                {
                  id: "229",
                  name: "text",
                  text: "question title",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
              ],
              links: {},
              props: { remote: { state: { marks: [] } } },
            },
            {
              id: "230",
              name: "mcq",
              children: [
                {
                  id: "231",
                  name: "mcqOption",
                  children: [
                    {
                      id: "232",
                      name: "title",
                      children: [
                        {
                          id: "233",
                          name: "text",
                          text: "option 1",
                          links: {},
                          props: {
                            local: {
                              html: {
                                suppressContentEditableWarning: true,
                                id: "ct",
                              },
                            },
                            remote: { state: { marks: [] } },
                          },
                        },
                      ],
                      links: {},
                      props: { remote: { state: { marks: [] } } },
                    },
                  ],
                  links: {},
                  props: {
                    local: {
                      html: {
                        contentEditable: true,
                        suppressContentEditableWarning: true,
                      },
                      placeholder: { empty: "", focused: "" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "234",
                  name: "mcqOption",
                  children: [
                    {
                      id: "235",
                      name: "title",
                      children: [
                        {
                          id: "236",
                          name: "text",
                          text: "option 2",
                          links: {},
                          props: {
                            local: {
                              html: {
                                suppressContentEditableWarning: true,
                                id: "ct",
                              },
                            },
                            remote: { state: { marks: [] } },
                          },
                        },
                      ],
                      links: {},
                      props: { remote: { state: { marks: [] } } },
                    },
                  ],
                  links: {},
                  props: {
                    local: {
                      html: {
                        contentEditable: true,
                        suppressContentEditableWarning: true,
                      },
                      placeholder: { empty: "", focused: "" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "237",
                  name: "mcqOption",
                  children: [
                    {
                      id: "238",
                      name: "title",
                      children: [
                        {
                          id: "239",
                          name: "text",
                          text: "option 3",
                          links: {},
                          props: {
                            local: {
                              html: {
                                suppressContentEditableWarning: true,
                                id: "ct",
                              },
                            },
                            remote: { state: { marks: [] } },
                          },
                        },
                      ],
                      links: {},
                      props: { remote: { state: { marks: [] } } },
                    },
                  ],
                  links: {},
                  props: {
                    local: {
                      html: {
                        contentEditable: true,
                        suppressContentEditableWarning: true,
                      },
                      placeholder: { empty: "", focused: "" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "240",
                  name: "mcqOption",
                  children: [
                    {
                      id: "241",
                      name: "title",
                      children: [
                        {
                          id: "242",
                          name: "text",
                          text: "option 4",
                          links: {},
                          props: {
                            local: {
                              html: {
                                suppressContentEditableWarning: true,
                                id: "ct",
                              },
                            },
                            remote: { state: { marks: [] } },
                          },
                        },
                      ],
                      links: {},
                      props: { remote: { state: { marks: [] } } },
                    },
                  ],
                  links: {},
                  props: {
                    local: {
                      html: {
                        contentEditable: true,
                        suppressContentEditableWarning: true,
                      },
                      placeholder: { empty: "", focused: "" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
              ],
              links: {},
              props: {
                local: {
                  html: {
                    contentEditable: false,
                    suppressContentEditableWarning: true,
                  },
                  placeholder: {
                    empty: "Question Title",
                    focused: "Question Title",
                  },
                },
                remote: { state: { marks: [] } },
              },
            },
          ],
          links: {},
          props: { remote: { state: { marks: [] } } },
        },
        {
          id: "243",
          name: "section",
          children: [
            {
              id: "244",
              name: "title",
              children: [
                {
                  id: "245",
                  name: "text",
                  text: "section 1",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
              ],
              links: {},
              props: { remote: { state: { marks: [] } } },
            },
          ],
          links: {},
          props: {
            local: {
              placeholder: { empty: "", focused: "Press / for commands" },
              html: { suppressContentEditableWarning: true, className: "cse" },
            },
            remote: { state: { marks: [] } },
          },
        },
        {
          id: "246",
          name: "sandbox",
          children: [
            {
              id: "247",
              name: "cell",
              children: [],
              links: {},
              props: {
                local: {
                  placeholder: {
                    empty: "Cell",
                    focused: "Press / for commands",
                  },
                  html: {
                    suppressContentEditableWarning: true,
                    contentEditable: false,
                  },
                },
                remote: { state: { marks: [] } },
              },
            },
          ],
          links: {},
          props: { remote: { state: { marks: [] } } },
        },
        {
          id: "248",
          name: "sandbox",
          children: [
            {
              id: "249",
              name: "cell",
              children: [],
              links: {},
              props: {
                local: {
                  placeholder: {
                    empty: "Cell",
                    focused: "Press / for commands",
                  },
                  html: {
                    suppressContentEditableWarning: true,
                    contentEditable: false,
                  },
                },
                remote: { state: { marks: [] } },
              },
            },
          ],
          links: {},
          props: { remote: { state: { marks: [] } } },
        },
        {
          id: "250",
          name: "sandbox",
          children: [
            {
              id: "251",
              name: "cell",
              children: [],
              links: {},
              props: {
                local: {
                  placeholder: {
                    empty: "Cell",
                    focused: "Press / for commands",
                  },
                  html: {
                    suppressContentEditableWarning: true,
                    contentEditable: false,
                  },
                },
                remote: { state: { marks: [] } },
              },
            },
          ],
          links: {},
          props: { remote: { state: { marks: [] } } },
        },
        {
          id: "252",
          name: "sandbox",
          children: [
            {
              id: "253",
              name: "cell",
              children: [],
              links: {},
              props: {
                local: {
                  placeholder: {
                    empty: "Cell",
                    focused: "Press / for commands",
                  },
                  html: {
                    suppressContentEditableWarning: true,
                    contentEditable: false,
                  },
                },
                remote: { state: { marks: [] } },
              },
            },
          ],
          links: {},
          props: { remote: { state: { marks: [] } } },
        },
        {
          id: "254",
          name: "section",
          children: [
            {
              id: "255",
              name: "title",
              children: [
                {
                  id: "256",
                  name: "text",
                  text: "123456",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [{ name: "bold" }] } },
                  },
                },
                {
                  id: "257",
                  name: "text",
                  text: "78",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
              ],
              links: {},
              props: { remote: { state: { marks: [] } } },
            },
          ],
          links: {},
          props: {
            local: {
              placeholder: { empty: "", focused: "Press / for commands" },
              html: { suppressContentEditableWarning: true, className: "cse" },
            },
            remote: { state: { marks: [] } },
          },
        },
        {
          id: "258",
          name: "section",
          children: [
            {
              id: "259",
              name: "title",
              children: [
                {
                  id: "260",
                  name: "text",
                  text: "ab",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "261",
                  name: "text",
                  text: "cdefgh",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [{ name: "bold" }] } },
                  },
                },
              ],
              links: {},
              props: { remote: { state: { marks: [] } } },
            },
          ],
          links: {},
          props: {
            local: {
              placeholder: { empty: "", focused: "Press / for commands" },
              html: { suppressContentEditableWarning: true, className: "cse" },
            },
            remote: { state: { marks: [] } },
          },
        },
        {
          id: "262",
          name: "section",
          children: [
            {
              id: "263",
              name: "title",
              children: [
                {
                  id: "264",
                  name: "text",
                  text: "time",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "265",
                  name: "mention",
                  children: [
                    {
                      id: "266",
                      name: "atomicText",
                      children: [],
                      links: {},
                      props: {
                        local: {
                          html: {
                            contentEditable: false,
                            suppressContentEditableWarning: true,
                          },
                        },
                        remote: {
                          state: {
                            atom: { content: "@today", size: 1 },
                            marks: [],
                          },
                        },
                      },
                    },
                  ],
                  links: {},
                  props: {
                    local: {
                      html: { className: "mention", contentEditable: false },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "267",
                  name: "empty",
                  children: [],
                  links: {},
                  props: {
                    remote: {
                      state: { atom: { size: 1, content: "​" }, marks: [] },
                    },
                    local: { html: { className: "empty-zero-width-space" } },
                  },
                },
              ],
              links: {},
              props: { remote: { state: { marks: [] } } },
            },
          ],
          links: {},
          props: {
            local: {
              placeholder: { empty: "", focused: "Press / for commands" },
              html: { suppressContentEditableWarning: true, className: "cse" },
            },
            remote: { state: { marks: [] } },
          },
        },
        {
          id: "268",
          name: "section",
          children: [
            {
              id: "269",
              name: "title",
              children: [
                {
                  id: "270",
                  name: "text",
                  text: "123",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "271",
                  name: "mention",
                  children: [
                    {
                      id: "272",
                      name: "atomicText",
                      children: [],
                      links: {},
                      props: {
                        local: {
                          html: {
                            contentEditable: false,
                            suppressContentEditableWarning: true,
                          },
                        },
                        remote: {
                          state: {
                            atom: { content: "@ankita", size: 1 },
                            marks: [],
                          },
                        },
                      },
                    },
                  ],
                  links: {},
                  props: {
                    local: {
                      html: { className: "mention", contentEditable: false },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "273",
                  name: "text",
                  text: "123",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "274",
                  name: "mention",
                  children: [
                    {
                      id: "275",
                      name: "atomicText",
                      children: [],
                      links: {},
                      props: {
                        local: {
                          html: {
                            contentEditable: false,
                            suppressContentEditableWarning: true,
                          },
                        },
                        remote: {
                          state: {
                            atom: { content: "@avira", size: 1 },
                            marks: [],
                          },
                        },
                      },
                    },
                  ],
                  links: {},
                  props: {
                    local: {
                      html: { className: "mention", contentEditable: false },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "276",
                  name: "text",
                  text: "123",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
              ],
              links: {},
              props: { remote: { state: { marks: [] } } },
            },
          ],
          links: {},
          props: {
            local: {
              placeholder: { empty: "", focused: "Press / for commands" },
              html: { suppressContentEditableWarning: true, className: "cse" },
            },
            remote: { state: { marks: [] } },
          },
        },
        {
          id: "277",
          name: "section",
          children: [
            {
              id: "278",
              name: "title",
              children: [
                {
                  id: "279",
                  name: "text",
                  text: "123456789",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
              ],
              links: {},
              props: { remote: { state: { marks: [] } } },
            },
          ],
          links: {},
          props: {
            local: {
              placeholder: { empty: "", focused: "Press / for commands" },
              html: { suppressContentEditableWarning: true, className: "cse" },
            },
            remote: { state: { marks: [] } },
          },
        },
        {
          id: "280",
          name: "section",
          children: [
            {
              id: "281",
              name: "title",
              children: [
                {
                  id: "282",
                  name: "emoji",
                  children: [],
                  links: {},
                  props: {
                    remote: {
                      state: {
                        emoji: "🖐️",
                        atom: { content: "🖐️", size: 3 },
                        marks: [],
                      },
                    },
                  },
                },
              ],
              links: {},
              props: { remote: { state: { marks: [] } } },
            },
          ],
          links: {},
          props: {
            local: {
              placeholder: { empty: "", focused: "Press / for commands" },
              html: { suppressContentEditableWarning: true, className: "cse" },
            },
            remote: { state: { marks: [] } },
          },
        },
        {
          id: "283",
          name: "section",
          children: [
            {
              id: "284",
              name: "title",
              children: [
                {
                  id: "285",
                  name: "empty",
                  children: [],
                  links: {},
                  props: {
                    remote: {
                      state: { atom: { size: 1, content: "​" }, marks: [] },
                    },
                    local: {
                      html: {
                        className: "empty-zero-width-space",
                        contentEditable: true,
                        suppressContentEditableWarning: true,
                      },
                    },
                  },
                },
                {
                  id: "286",
                  name: "mention",
                  children: [
                    {
                      id: "287",
                      name: "atomicText",
                      children: [],
                      links: {},
                      props: {
                        local: {
                          html: {
                            contentEditable: false,
                            suppressContentEditableWarning: true,
                          },
                        },
                        remote: {
                          state: {
                            atom: { content: "@123", size: 1 },
                            marks: [],
                          },
                        },
                      },
                    },
                  ],
                  links: {},
                  props: {
                    local: {
                      html: { className: "mention", contentEditable: false },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "288",
                  name: "empty",
                  children: [],
                  links: {},
                  props: {
                    remote: {
                      state: { atom: { size: 1, content: "​" }, marks: [] },
                    },
                    local: {
                      html: {
                        className: "empty-zero-width-space",
                        contentEditable: true,
                        suppressContentEditableWarning: true,
                      },
                    },
                  },
                },
                {
                  id: "289",
                  name: "mention",
                  children: [
                    {
                      id: "290",
                      name: "atomicText",
                      children: [],
                      links: {},
                      props: {
                        local: {
                          html: {
                            contentEditable: false,
                            suppressContentEditableWarning: true,
                          },
                        },
                        remote: {
                          state: {
                            atom: { content: "@bubun", size: 1 },
                            marks: [],
                          },
                        },
                      },
                    },
                  ],
                  links: {},
                  props: {
                    local: {
                      html: { className: "mention", contentEditable: false },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "291",
                  name: "text",
                  text: "abc",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "292",
                  name: "mention",
                  children: [
                    {
                      id: "293",
                      name: "atomicText",
                      children: [],
                      links: {},
                      props: {
                        local: {
                          html: {
                            contentEditable: false,
                            suppressContentEditableWarning: true,
                          },
                        },
                        remote: {
                          state: {
                            atom: { content: "@bappa", size: 1 },
                            marks: [],
                          },
                        },
                      },
                    },
                  ],
                  links: {},
                  props: {
                    local: {
                      html: { className: "mention", contentEditable: false },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
                {
                  id: "294",
                  name: "empty",
                  children: [],
                  links: {},
                  props: {
                    remote: {
                      state: { atom: { size: 1, content: "​" }, marks: [] },
                    },
                    local: {
                      html: {
                        className: "empty-zero-width-space",
                        contentEditable: true,
                        suppressContentEditableWarning: true,
                      },
                    },
                  },
                },
              ],
              links: {},
              props: { remote: { state: { marks: [] } } },
            },
          ],
          links: {},
          props: {
            local: {
              placeholder: { empty: "", focused: "Press / for commands" },
              html: { suppressContentEditableWarning: true, className: "cse" },
            },
            remote: { state: { marks: [] } },
          },
        },
        {
          id: "295",
          name: "section",
          children: [
            {
              id: "296",
              name: "title",
              children: [
                {
                  id: "297",
                  name: "text",
                  text: "section 1",
                  links: {},
                  props: {
                    local: {
                      html: { suppressContentEditableWarning: true, id: "ct" },
                    },
                    remote: { state: { marks: [] } },
                  },
                },
              ],
              links: {},
              props: { remote: { state: { marks: [] } } },
            },
            {
              id: "298",
              name: "section",
              children: [
                {
                  id: "299",
                  name: "title",
                  children: [
                    {
                      id: "300",
                      name: "text",
                      text: "section 1",
                      links: {},
                      props: {
                        local: {
                          html: {
                            suppressContentEditableWarning: true,
                            id: "ct",
                          },
                        },
                        remote: { state: { marks: [] } },
                      },
                    },
                  ],
                  links: {},
                  props: { remote: { state: { marks: [] } } },
                },
              ],
              links: {},
              props: {
                local: {
                  placeholder: { empty: "", focused: "Press / for commands" },
                  html: {
                    suppressContentEditableWarning: true,
                    className: "cse",
                  },
                },
                remote: { state: { marks: [] } },
              },
            },
          ],
          links: {},
          props: {
            local: {
              placeholder: { empty: "", focused: "Press / for commands" },
              html: { suppressContentEditableWarning: true, className: "cse" },
            },
            remote: { state: { marks: [] } },
          },
        },
      ],
      links: {},
      props: {
        local: {
          placeholder: { empty: "Untitled", focused: "Untitled" },
          html: {
            spellCheck: false,
            contentEditable: true,
            suppressContentEditableWarning: true,
          },
          state: { mode: "edit" },
        },
        remote: { state: { marks: [] } },
      },
    },
  ],
  links: {},
  props: {
    local: {
      html: { suppressContentEditableWarning: true, className: "croot" },
    },
    remote: { state: { marks: [] } },
  },
};
