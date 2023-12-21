import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-core";

declare module '@emrgen/carbon-core' {
  interface Transaction {
    codeLine: {

    }
  }
}

export const CodeLineComp = (props: RendererProps) => {
  const { node, custom } = props;

  console.log(custom);

  return (
    <CarbonBlock node={node}>
      {/*{custom.lineNumber && (*/}
      {/*  <div className="carbon-code-line-number">*/}
      {/*    <span className="carbon-code-line-number-text">*/}
      {/*      {custom.lineNumber}*/}
      {/*    </span>*/}
      {/*  </div>*/}
      {/*)}*/}
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};
