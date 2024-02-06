import {createContext, useContext} from "react";
import {Node} from "@emrgen/carbon-core";

const InnerPageContext = createContext<Node>(Node.IDENTITY);

export const PageContext = InnerPageContext.Provider;

export const usePage = () => {
  return useContext(InnerPageContext)
}
