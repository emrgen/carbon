import {CarbonBlock, CarbonChildren, RendererProps, useCarbon} from "@emrgen/carbon-react";
import {CollapsedPath, prevent, preventAndStop, stop} from "@emrgen/carbon-core";

export const CellComp = (props: RendererProps) => {
  const {node} = props;
  const app = useCarbon()

  const isCollapsed = () => {
    return node.props.get(CollapsedPath, false)
  }

  const handleToggleCell = (e) => {
    preventAndStop(e)
    app.cmd.collapsible.toggle(node).dispatch()
  }

  console.log(isCollapsed())


  return (
    <CarbonBlock node={node}>
      <div className={'carbon-cell-container'}>
        <div className={'carbon-cell-handle'} onClick={handleToggleCell} onMouseDown={stop}>
          {isCollapsed() ? '▸' : '▾'}
        </div>
        <div className={'carbon-cell-view'}>
          {isCollapsed() ? <CarbonBlock node={node.children[0]!}/> : <CarbonChildren node={node}/>}
        </div>
      </div>
    </CarbonBlock>
  )
}
