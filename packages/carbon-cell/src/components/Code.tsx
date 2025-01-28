import { indentWithTab } from "@codemirror/commands";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { markdown } from "@codemirror/lang-markdown";
import { EditorState, Prec } from "@codemirror/state";
import { highlightActiveLine, keymap, ViewUpdate } from "@codemirror/view";
import {
  ActionOrigin,
  FocusOnInsertPath,
  HasFocusPath,
  Node,
  Pin,
  PinnedSelection,
  Point,
  preventAndStop,
} from "@emrgen/carbon-core";
import { RendererProps, useCarbon, useNodeChange } from "@emrgen/carbon-react";
import { basicSetup, EditorView } from "codemirror";
import { noop } from "lodash";
import { createRef, memo, useCallback, useEffect, useState } from "react";
import { PiPlayBold } from "react-icons/pi";
import { useCustomCompareEffect } from "react-use";
import { CodeCellCodeTypePath, CodeCellCodeValuePath } from "../constants";
import { useActiveCellRuntime } from "../hooks/useActiveCellRuntime";

const isEqualCode = (prev: Node, next: Node) => {
  return prev.props.get(CodeCellCodeValuePath) === next.props.get(CodeCellCodeValuePath);
};

const isEqualType = (prev: Node, next: Node) => {
  return prev.props.get(CodeCellCodeTypePath) === next.props.get(CodeCellCodeTypePath);
};

export const CodeInner = (props: RendererProps) => {
  const app = useCarbon();
  const ref = createRef<HTMLDivElement>();
  const mod = useActiveCellRuntime();
  const [mounted, setMounted] = useState(false);

  // watch for prop change in linked props node
  const { node } = useNodeChange({ node: props.node });

  const [defaultValue] = useState(node.props.get(CodeCellCodeValuePath, ""));
  const [value, setValue] = useState(node.props.get(CodeCellCodeValuePath, "javascript"));
  const [nodeId] = useState(node.id);
  const [view, setView] = useState<EditorView | null>(null);
  const [codeType, setCodeType] = useState(node.props.get(CodeCellCodeTypePath, "javascript"));

  useEffect(() => {
    const onMount = () => {
      setMounted(true);
    };

    app.on("page:mounted", onMount);
    return () => {
      app.off("page:mounted", onMount);
    };
  }, [app]);

  useEffect(() => {
    setCodeType(node.props.get(CodeCellCodeTypePath, "javascript"));
  }, [node]);

  const redefine = useCallback(
    ({ code, type, forced = false }) => {
      mod.redefine("", nodeId.toString(), code, type, forced);
    },
    [mod, nodeId],
  );

  useCustomCompareEffect(
    () => {
      mod.redefine(
        "",
        nodeId.toString(),
        node.props.get(CodeCellCodeValuePath, ""),
        node.props.get(CodeCellCodeTypePath, "javascript"),
      );
    },
    [node, mod, nodeId],
    (prev, next) => {
      // @ts-ignore
      return isEqualType(prev[0], next[0]);
    },
  );

  // focus should set the cell focus status
  const onFocused = useCallback(() => {
    if (app.store.get(nodeId)?.props.get(HasFocusPath)) return;
    const cmd = app.cmd.Update(nodeId, {
      [HasFocusPath]: true,
    });
    if (app.blockSelection.isActive) {
      cmd.SelectBlocks([]);
    } else {
      cmd.Select(PinnedSelection.SKIP, ActionOrigin.UserInput);
    }
    cmd.Dispatch();
  }, [app, nodeId]);

  // blur should remove the cell focus status
  const onBlur = useCallback(() => {
    const node = app.store.get(nodeId)!;
    if (!node.props.get(HasFocusPath)) {
      return {
        Then: noop,
      };
    }

    return app.cmd
      .Update(nodeId, {
        [HasFocusPath]: false,
      })
      .Dispatch();
  }, [app, nodeId]);

  // when the cell is unmounted, remove the focus status
  useEffect(() => {
    return () => {
      onBlur();
    };
  }, [onBlur]);

  const onUpdate = useCallback(
    (editor: ViewUpdate) => {
      const value = editor.state.doc.toString();

      if (editor.docChanged) {
        // update the cell code value
        setValue(value);
        app.cmd
          .Update(nodeId, {
            [CodeCellCodeValuePath]: value,
          })
          .Select(PinnedSelection.SKIP, ActionOrigin.UserInput)
          .Dispatch();
      }

      // track focus status
      if (editor.focusChanged) {
        if (editor.view.hasFocus) {
          onFocused();
        } else {
          onBlur();
          setTimeout(() => {
            const node = app.store.get(nodeId)!;
            const nextCodeType = node.props.get(CodeCellCodeTypePath, "javascript");
            // if the code type is changed, before the blur, skip the redefine
            if (codeType !== nextCodeType) return;
            // redefine the variable when the cell is blurred
            redefine({ code: value, type: codeType });
          }, 100);
        }
      }
    },
    [app, nodeId, onFocused, onBlur, redefine, codeType],
  );

  // create the editor view
  const createEditor = useCallback(
    (parent: HTMLElement, value: string) => {
      const extensions: any[] = [EditorView.lineWrapping];
      if (codeType === "javascript") {
        extensions.push(javascript());
      }

      if (codeType === "markdown") {
        extensions.push(markdown());
      }

      if (codeType === "html") {
        extensions.push(html());
      }

      if (codeType === "css") {
        extensions.push(css());
      }

      const state = EditorState.create({
        doc: value,
        extensions: [
          ...extensions,
          EditorView.updateListener.of(onUpdate),
          basicSetup,
          highlightActiveLine(),
          keymap.of([indentWithTab]),
          Prec.highest(
            EditorView.domEventHandlers({
              keydown(event) {
                // console.log(event);

                // insert new line
                if (event.ctrlKey && event.shiftKey && event.key === "Enter") {
                  event.preventDefault();
                  event.stopPropagation();
                  const parent = app.store.get(nodeId)?.parent;
                  const section = app.schema.type("paragraph").default();
                  console.log(parent);
                  const after = PinnedSelection.fromPin(Pin.toStartOf(section!)!);
                  app.cmd
                    .Insert(Point.toAfter(parent!), section!)
                    .Select(after, ActionOrigin.UserInput)
                    .Dispatch();
                  return;
                }

                if (event.shiftKey && event.key === "Enter") {
                  console.log("Mod+/ keydown!", event);
                  event.stopPropagation();
                  event.preventDefault();
                  redefine({
                    code: app.store.get(nodeId)?.props.get(CodeCellCodeValuePath, ""),
                    type: codeType,
                  });
                  return;
                }

                if (event.ctrlKey && event.key === "s") {
                  event.preventDefault();
                  event.stopPropagation();
                  redefine({
                    code: app.store.get(nodeId)?.props.get(CodeCellCodeValuePath, ""),
                    type: codeType,
                    forced: true,
                  });
                  return;
                }

                // move the cursor to the next block
                // if (event.shiftKey && event.key === "Tab") {
                //   event.preventDefault();
                //   event.stopPropagation();
                //   const node = app.store.get(nodeId);
                //   if (!node) return;
                //   const found = node.next((n) => n.isFocusable);
                //   if (!found) return;
                //   const after = PinnedSelection.fromPin(Pin.toStartOf(found)!);
                //   app.cmd.Select(after, ActionOrigin.UserInput).Dispatch();
                //
                //   return;
                // }
              },
            }),
          ),
        ],
      });

      return new EditorView({
        state,
        parent,
      });
    },
    [onUpdate, codeType, nodeId, redefine, app],
  );

  useCustomCompareEffect(
    () => {
      if (!ref.current) return;
      const view = createEditor(ref.current, node.props.get(CodeCellCodeValuePath, ""));
      setView(view);
      return () => {
        view.destroy();
      };
    },
    [ref, codeType, createEditor, node],
    (prev, next) => {
      // @ts-ignore
      return prev[1] === next[1];
    },
  );

  // focus the editor when the cell is mounted
  useEffect(() => {
    const props = app.store.get(nodeId);
    const firstMount = props?.props.get(FocusOnInsertPath, false);
    if (firstMount) {
      view?.focus();
    }
  }, [view, app, nodeId]);

  useEffect(() => {
    const onExpand = (parent: Node) => {
      view?.focus();
    };
    const expandEvent = `expand:${nodeId}`;
    mod.on(expandEvent, onExpand);

    return () => {
      mod.off(expandEvent, onExpand);
    };
  }, [view, mod, nodeId]);
  return (
    <div
      style={{
        visibility: props.isCollapsed ? "hidden" : "visible",
        height: props.isCollapsed ? 0 : "auto",
        position: props.isCollapsed ? "absolute" : "relative",
      }}
      className={"cell-code-wrapper"}
      onKeyDown={(e) => e.stopPropagation()}
      onFocus={(e) => e.stopPropagation()}
    >
      {props.isCollapsed ? "isCollapsed" : ""}
      <div className={"editor-container"} ref={ref} />
      <div
        className={"carbon-cell-compute-button"}
        onMouseDown={preventAndStop}
        onMouseUp={(e) => {
          preventAndStop(e);
          console.log("value", value);
          // find variable identity and redefine
          redefine({ code: value, type: codeType, forced: true });
        }}
      >
        <PiPlayBold />
      </div>
    </div>
  );
};

export const Code = memo(CodeInner, (prev, next) => {
  return (
    isEqualCode(prev.node, next.node) &&
    isEqualType(prev.node, next.node) &&
    prev.isCollapsed === next.isCollapsed
  );
});
