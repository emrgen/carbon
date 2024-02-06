import {CarbonBlock, RendererProps, useCarbon} from "@emrgen/carbon-react";
import {useCallback, useMemo, useRef} from "react";
import {range} from "lodash";
import {EndPath, StartPath, StepPath, ValuePath} from "@emrgen/carbon-blocks";
import {MultiPath} from "@emrgen/carbon-core";

export default function ScaleComp(props: RendererProps) {
  const {node} = props;
  const app = useCarbon();
  const ref = useRef(null);

  const {start, end, step, value} = useMemo(() => {
    return {
      start: node.props.get<number>(StartPath, 0),
      end: node.props.get<number>(EndPath, 10),
      step: node.props.get<number>(StepPath, 1),
      value: node.props.get<number[]>(ValuePath, []),
      multi: node.props.get<boolean>(MultiPath, false),
    }
  }, [node]);

  const handleToggle = useCallback((value: number) => {
    app.cmd.scale.toggleValue(node, value).Dispatch();
  },[app, node]);

  return (
    <CarbonBlock ref={ref} {...props}>
      {range(start, end+1, step).map((i) => {
        if (value.includes(i)) {
          return (
            <div key={i} data-selected={true} className={'carbon-scale-option'}
                 onClick={() => handleToggle(i)}>{i}</div>
          )
        } else {
          return (
            <div key={i} className={'carbon-scale-option'} onClick={() => handleToggle(i)}>{i}</div>
          )
        }
      })}
    </CarbonBlock>
  )
}

