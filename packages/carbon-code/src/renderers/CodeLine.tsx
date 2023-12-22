import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-core";
import {useMemo} from "react";
import prism, { Token, TokenStream } from 'prismjs';

declare module '@emrgen/carbon-core' {
  interface Transaction {
    codeLine: {

    }
  }
}

export const CodeLineComp = (props: RendererProps) => {
  const { node, custom } = props;

  const parentSize = useMemo(() => {
    if (node.parent) {
      return String(node.parent.size).length * 10;
    }
    return 0;
  },[node.parent])

  // const tokens = useMemo(() => {
  //   return prism.tokenize(node.textContent, prism.languages.javascript);
  // },[])
  //
  // console.log(tokens)

 const handleMouseOver = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
   console.log(e)
 }


  return (
    <CarbonBlock node={node} custom={{onMouseOver: handleMouseOver}}>

        <div className="carbon-code-line-number" style={{paddingRight: parentSize + 'px'}} contentEditable={"false"}>
          {/*{custom.lineNumber && (<span className="carbon-code-line-number-text">*/}
          {/*  {custom.lineNumber}*/}
          {/*</span>*/}
          {/*)}*/}
        </div>

      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};
