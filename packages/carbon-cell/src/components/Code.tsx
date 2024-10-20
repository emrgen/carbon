import { RendererProps } from "@emrgen/carbon-react";
import { useCarbon } from "@emrgen/carbon-react";
import { useCallback } from "react";
import { useState } from "react";
import { createRef } from "react";
import { memo } from "react";
import { useEffect } from "react";
import { preventAndStop } from "@emrgen/carbon-core";
import { PinnedSelection } from "@emrgen/carbon-core";
import { Node } from "@emrgen/carbon-core";
import { ActionOrigin } from "@emrgen/carbon-core";
import { FocusOnInsertPath } from "@emrgen/carbon-core";
import { HasFocusPath } from "@emrgen/carbon-core";
import { Point } from "@emrgen/carbon-core";
import { Pin } from "@emrgen/carbon-core";
import { PiPlayBold } from "react-icons/pi";
import { useModule } from "../hooks/useModule";
import { CodeCellCodeValuePath } from "../constants";
import { CodeCellCodeTypePath } from "../constants";
import { EditorState } from "@codemirror/state";
import { Prec } from "@codemirror/state";
import { EditorView } from "codemirror";
import { basicSetup } from "codemirror";
import { keymap, ViewUpdate } from "@codemirror/view";
import { highlightActiveLine } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { noop } from "lodash";
import { useCustomCompareEffect } from "react-use";
import { markdown } from "@codemirror/lang-markdown";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { indentWithTab } from "@codemirror/commands";

const isEqualCode = (prev: Node, next: Node) => {
  return (
    prev.props.get(CodeCellCodeValuePath) ===
    next.props.get(CodeCellCodeValuePath)
  );
};

const isEqualType = (prev: Node, next: Node) => {
  return (
    prev.props.get(CodeCellCodeTypePath) ===
    next.props.get(CodeCellCodeTypePath)
  );
};

export const CodeInner = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const ref = createRef<HTMLDivElement>();
  const mod = useModule();
  const [defaultValue] = useState(node.props.get(CodeCellCodeValuePath, ""));
  const [value, setValue] = useState(
    node.props.get(CodeCellCodeValuePath, "javascript"),
  );
  const [nodeId] = useState(node.id);
  const [view, setView] = useState<EditorView | null>(null);
  const [codeType, setCodeType] = useState(
    node.props.get(CodeCellCodeTypePath, "javascript"),
  );

  useEffect(() => {
    setCodeType(node.props.get(CodeCellCodeTypePath, "javascript"));
  }, [node]);

  const redefine = useCallback(
    (value, type) => {
      mod.redefine(nodeId.toString(), value, type);
    },
    [mod, nodeId],
  );

  useCustomCompareEffect(
    () => {
      mod.redefine(
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
    app.cmd
      .Update(nodeId, {
        [HasFocusPath]: true,
      })
      .Select(PinnedSelection.SKIP, ActionOrigin.UserInput)
      .Dispatch();
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
          .update(nodeId, {
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
            const nextCodeType = node.props.get(
              CodeCellCodeTypePath,
              "javascript",
            );
            // if the code type is changed, before the blur, skip the redefine
            if (codeType !== nextCodeType) return;
            // redefine the variable when the cell is blurred
            redefine(value, codeType);
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
                console.log(event);

                // insert new line
                if (event.ctrlKey && event.shiftKey && event.key === "Enter") {
                  console.log("xxxxxxxxxxxx");
                  event.preventDefault();
                  event.stopPropagation();
                  const parent = app.store.get(nodeId)?.parent;
                  const section = app.schema.type("section").default();
                  console.log(parent);
                  const after = PinnedSelection.fromPin(
                    Pin.toStartOf(section!)!,
                  );
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
                  redefine(
                    app.store.get(nodeId)?.props.get(CodeCellCodeValuePath, ""),
                    codeType,
                  );
                  return;
                }

                if (event.ctrlKey && event.key === "s") {
                  event.preventDefault();
                  event.stopPropagation();
                  redefine(
                    app.store.get(nodeId)?.props.get(CodeCellCodeValuePath, ""),
                    codeType,
                  );
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
      const view = createEditor(
        ref.current,
        node.props.get(CodeCellCodeValuePath, ""),
      );
      setView(view);
      return () => {
        view.destroy();
      };
    },
    [ref, codeType, createEditor, node],
    (prev, next) => {
      // @ts-ignore
      return prev[0].current === next[0].current && prev[1] === next[1];
    },
  );

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

  useEffect(() => {
    const firstMount = app.store
      .get(nodeId)
      ?.props.get(FocusOnInsertPath, false);
    if (firstMount) {
      view?.focus();
      setTimeout(() => {
        app.cmd
          .Update(nodeId, {
            [FocusOnInsertPath]: false,
          })
          .Dispatch();
      }, 1000);
    }
  }, [view, app, nodeId]);

  return (
    <div
      className={"cell-code-wrapper"}
      onKeyDown={(e) => e.stopPropagation()}
      onFocus={(e) => e.stopPropagation()}
    >
      <div className={"editor-container"} ref={ref} />
      <div
        className={"carbon-cell-compute-button"}
        onMouseDown={preventAndStop}
        onMouseUp={(e) => {
          preventAndStop(e);
          // find variable identity and redefine
          redefine(value, codeType);
        }}
      >
        <PiPlayBold />
      </div>
    </div>
  );
};

export const Code = memo(CodeInner, (prev, next) => {
  return isEqualCode(prev.node, next.node) && isEqualType(prev.node, next.node);
});
