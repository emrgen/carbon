import {CarbonBlock, CarbonNodeContent, RendererProps, useCarbon} from "@emrgen/carbon-react";
import {useEffect} from "react";

export const FlashComp = (props: RendererProps) => {
  const {node} = props;
  const app = useCarbon();

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     app.tr.Update(node, {
  //       ['local/state/flag']: !node.props.get('local/state/flag', false)
  //     }).Dispatch()
  //   }, 1000);
  //
  //   return () => {
  //     clearInterval(interval);
  //   }
  // }, [app, node]);

  return (
    <CarbonBlock {...props}>
      <CarbonNodeContent node={node}/>
      <div className={'flash-card-content'} contentEditable={false} suppressContentEditableWarning={true}>
        {JSON.stringify(node.props.toJSON())}
      </div>

      <div className={'flash-card-controls'} contentEditable={false} suppressContentEditableWarning={true}>
        <button onClick={() => {
          app.tr.Update(node, {
            ['local/state/flag']: !node.props.get('local/state/flag', false)
          }).Dispatch()
        }}>Toggle flag</button>

        <button onClick={() => {
          app.tr.Update(node, {
            ['local/state/some']: !node.props.get('local/state/some', false)
          }).Dispatch()
        }}>Toggle some</button>
      </div>
    </CarbonBlock>
  )
}
