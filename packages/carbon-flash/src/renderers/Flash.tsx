import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";

export const FlashComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();

  return (
    <CarbonBlock {...props}>
      <div className={"flash-card-content"}>
        <CarbonChildren node={node} />
      </div>
      {/*<div*/}
      {/*  className={"flash-card-controls"}*/}
      {/*  contentEditable={false}*/}
      {/*  suppressContentEditableWarning={true}*/}
      {/*>*/}
      {/*  <button*/}
      {/*    onClick={() => {*/}
      {/*      app.tr*/}
      {/*        .Update(node, {*/}
      {/*          ["local/state/flag"]: !node.props.get(*/}
      {/*            "local/state/flag",*/}
      {/*            false,*/}
      {/*          ),*/}
      {/*        })*/}
      {/*        .Dispatch();*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    Toggle flag*/}
      {/*  </button>*/}

      {/*  <button*/}
      {/*    onClick={() => {*/}
      {/*      app.tr*/}
      {/*        .Update(node, {*/}
      {/*          ["local/state/some"]: !node.props.get(*/}
      {/*            "local/state/some",*/}
      {/*            false,*/}
      {/*          ),*/}
      {/*        })*/}
      {/*        .Dispatch();*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    Toggle some*/}
      {/*  </button>*/}
      {/*</div>*/}
    </CarbonBlock>
  );
};
