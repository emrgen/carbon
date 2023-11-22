import { Box, Textarea } from "@chakra-ui/react";
import React, { useEffect, useRef } from "react";

import ResizeTextarea from "react-textarea-autosize";

import {
  ActionOrigin,
  BlockContent,
  CarbonBlock,
  Pin,
  PinnedSelection,
  RendererProps,
  preventAndStop,
  stop,
  useCarbon,
  useNodeChange,
  useSelectionHalo,
} from "@emrgen/carbon-core";
import { Highlight, themes } from "prism-react-renderer";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon";
import ReactCodeMirror from "@uiw/react-codemirror";


export const CodeComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  return (
    <CarbonBlock node={node} ref={ref} custom={connectors}>
      <Box contentEditable={false} suppressContentEditableWarning>
        <CodeContent node={node.child(0)!} />
        {selection.SelectionHalo}
      </Box>
    </CarbonBlock>
  );
};


const CodeContentMirror = (props: RendererProps) => {
  const { node, version } = useNodeChange(props);
  const app = useCarbon();

  console.log(node.textContent);

  return <ReactCodeMirror
    value={node.textContent!}
    options={{
      // theme: 'monokai',
      // keyMap: 'sublime',
      // mode: 'jsx',
      language: 'go',
    }}
    onFocus={() => {
      app.tr.selectNodes([]).dispatch();
      app.disable();
    }}
    onBlur={() => app.enable()}
    onChange={(value) => {
      app.enable(() => {
        const text = app.schema.text(value)!;
        app.tr.setContent(node.id, BlockContent.create([text])).dispatch();
      });
    }}
  />

}


const CodeContent = (props: RendererProps) => {
  const { node, version } = useNodeChange(props);
  const app = useCarbon();
  const refText = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!node.parent) return;
    if (node.parent.attrs.node.typeChanged) {
      console.log("focus");
      app.tr
        .updateAttrs(node.parent.id, { node: { typeChanged: false } })
        .dispatch();
      refText.current?.focus();
    }
  }, [app, node, version]);

  useEffect(() => {
    const onFocus = () => {
      const element = refText.current;
      if (!element) return;
      console.log("focus");
      element.focus();
      element.setSelectionRange(element.value.length, element.value.length);
    };

    node.on("focus", onFocus);
    return () => {
      node.off("focus", onFocus);
    };
  }, [node, refText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // stop(e);
    if (e.key == "Tab") {
      e.preventDefault();
    }

    if (e.key == "Enter") {
      if (app.blockSelection.size > 0) {
        e.preventDefault();
      }
    }

    if (e.key == "Escape") {
      stop(e);
      app.parkCursor();
      app.tr.selectNodes([node.parent!.id]).dispatch();
    }

    // if back spaced at the beginning of the line
    // convert to section
    if (e.key == "Backspace") {
      const textarea = e.target as HTMLTextAreaElement;
      const { selectionStart, selectionEnd } = textarea;
      const parent = node.parent!;

      if (selectionStart == 0 && selectionEnd == 0) {
        preventAndStop(e);
        // NOTE: when the text area is removed in section the onBlur is not called.
        // so we need to enable the editor here.
        app.enable();

        const { tr } = app;
        tr.change(parent.id, parent.name, "section");
        tr.updateAttrs(parent.id, { node: { typeChanged: true } });
        tr.select(
          PinnedSelection.fromPin(Pin.toStartOf(parent)!),
          ActionOrigin.UserInput
        );
        tr.dispatch();
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    stop(e);
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    stop(e);
    const { value } = e.target;
    const text = app.schema.text(value)!;
    app.enable(() => {
      app.tr.setContent(node.id, BlockContent.create([text])).dispatch();
    });
  };

  return (
    <CarbonBlock node={node}>
      <Box className="fastype-code-content">
        <Highlight theme={themes.github} code={node.textContent!} language="go">
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className="fastype-pre" style={style}>
              <code className="fastype-code">
                {tokens.map((line, i) => (
                    <span key={i} {...getLineProps({ line })}>
                    {/*<span className='line-number'>{i + 1}.</span>*/}
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </span>
                ))}
              </code>
            </pre>
          )}
        </Highlight>
      </Box>
      <Box pos={"absolute"} top={0} left={0} w="full">
        <Textarea
          ref={refText}
          className="fastype-code-textarea"
          defaultValue={node?.textContent}
          placeholder="Write code here..."
          _focus={{
            outline: "none",
            boxShadow: "none",
            border: "none",
          }}
          borderRadius={0}
          display={"block"}
          border={"none"}
          overflow="hidden"
          as={ResizeTextarea}
          resize={"none"}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onChange={handleOnChange}
          onFocus={() => {
            app.tr.selectNodes([]).dispatch();
            app.disable();
          }}
          onBlur={() => app.enable()}
        />
      </Box>
    </CarbonBlock>
  );
};
