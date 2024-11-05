import { ModePath, Node } from "@emrgen/carbon-core";
import { createContext, ReactNode, useContext, useMemo } from "react";

interface DocumentContextProps {
  doc: Node;
  isEditable: boolean;
}

const InnerDocumentContext = createContext<DocumentContextProps>({
  doc: Node.IDENTITY,
  isEditable: false,
});

interface DocumentContextCompProps {
  document: Node;
  children: ReactNode;
}

export const DocumentContext = (props: DocumentContextCompProps) => {
  const { document } = props;
  const isEditable = useMemo(
    () => document.props.get(ModePath) === "edit",
    [document],
  );

  return (
    <InnerDocumentContext.Provider value={{ doc: document, isEditable }}>
      {props.children}
    </InnerDocumentContext.Provider>
  );
};

export const useDocument = () => {
  return useContext(InnerDocumentContext);
};
