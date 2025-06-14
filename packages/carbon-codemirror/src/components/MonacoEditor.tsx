import { EditorState } from "@codemirror/state";
import { Node, stop } from "@emrgen/carbon-core";
import { useCarbon } from "@emrgen/carbon-react";
import * as monaco from "monaco-editor";
import { useEffect, useRef, useState } from "react";

interface MonacoEditorProps {
  onChange?: (editor: EditorState) => void;
  onSave?: (editor: EditorState) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  node: Node;
  extensions?: any[];
}

export const MonacoEditor = (props: MonacoEditorProps) => {
  const { node } = props;
  const app = useCarbon();
  const ref = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (ref.current && !editor) {
      const container = ref.current!;
      // Initialize Monaco Editor
      const editor = monaco.editor.create(container, {
        value: "",
        language: "javascript",
        // theme: "vs-dark",
        lineNumbers: "off",

        wordWrap: "on", // wraps long lines
        wrappingIndent: "same", // keeps indent when wrapped

        scrollBeyondLastLine: false,
        smoothScrolling: true,
        automaticLayout: true, // auto-resize with container
        folding: false,

        scrollbar: {
          horizontal: "hidden",
          vertical: "hidden",
          useShadows: false,
          verticalScrollbarSize: 0,
          horizontalScrollbarSize: 0,
        },

        minimap: { enabled: false },
        overviewRulerLanes: 0,
        renderLineHighlight: "none",

        // Enable suggestions & hints
        suggestOnTriggerCharacters: true,
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false,
        },
        parameterHints: {
          enabled: true,
        },
        autoClosingBrackets: "always",
        autoIndent: "full",
        formatOnType: true,
        acceptSuggestionOnEnter: "on",
      });

      monaco.editor.defineTheme("myGrayTheme", {
        base: "vs",
        inherit: true,
        rules: [],
        colors: {
          "editor.background": "#f5f5f5",
          // "editorLineNumber.foreground": "#888",
          // "editor.foreground": "#000000",
          // "editorCursor.foreground": "#333333",
          // "editor.lineHighlightBackground": "#e0e0e0",
          // "editorLineNumber.activeForeground": "#444",
        },
      });

      monaco.editor.setTheme("myGrayTheme");

      function updateEditorHeight() {
        const lineCount = editor.getModel()!.getLineCount();
        const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight);
        const height = lineCount * lineHeight + 16; // extra padding
        container.style.height = `${height}px`;
        editor.layout();
      }

      // Hook into content change
      editor.onDidChangeModelContent(updateEditorHeight);

      // Initial sizing
      updateEditorHeight();

      new ResizeObserver(() => {
        editor.layout();
      }).observe(container);

      setEditor(editor);
    }
  }, [ref, editor]);

  return (
    <div className="carbon-monaco-editor" onKeyDown={stop}>
      <div className="monaco-editor-container" ref={ref}>
        {/* Placeholder for Monaco Editor */}
      </div>
    </div>
  );
};
