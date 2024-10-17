import { createContext } from "react";
import { useContext } from "react";
import { EditorView } from "codemirror";
import { Optional } from "@emrgen/types";

export interface CodeMirrorContextValue {
  editor: Optional<EditorView>;
  setEditor(editor: Optional<EditorView>): void;
}

const InnerCodeMirrorContext = createContext<CodeMirrorContextValue>(null!);

export const CodeMirrorProvider = InnerCodeMirrorContext.Provider;

export const useCodeMirror = () => {
  return useContext(InnerCodeMirrorContext);
};
