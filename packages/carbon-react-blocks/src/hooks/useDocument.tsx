import { createContext, useContext } from "react";
import { Node } from "@emrgen/carbon-core";

const InnerDocumentContext = createContext<Node | null>(null);

interface DocumentContextProps {
  document: Node;
  children: React.ReactNode;
}

export const DocumentContext = (props: DocumentContextProps) => {
  return (
    <InnerDocumentContext.Provider value={props.document}>
      {props.children}
    </InnerDocumentContext.Provider>
  );
};

export const useDocument = () => {
  return useContext(InnerDocumentContext);
};
