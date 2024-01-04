import {useCallback, useMemo} from "react";
import prism, { Token, TokenStream } from 'prismjs';
import {CarbonBlock, CarbonChildren, RendererProps} from "@emrgen/carbon-react";

declare module '@emrgen/carbon-core' {
  interface Transaction {
    codeLine: {

    }
  }
}

export const CodeLineComp = (props: RendererProps) => {
  const { node } = props;

  // const parentSize = () => {
  //   if (node.parent) {
  //     return String(node.parent.size).length * 10;
  //   }
  //   return 0;
  // }

  // const tokens = useMemo(() => {
  //   return prism.tokenize(node.textContent, prism.languages.javascript);
  // },[])
  //
  // console.log(tokens)

  const handleMouseOver = useCallback((e) => {
  },[]);

  return (
    <CarbonBlock {...props}>
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};
