import {CarbonBlock, CarbonChildren, RendererProps, useCarbon} from "@emrgen/carbon-react";
import {CollapsedPath, PinnedSelection, Point, Pin, prevent, preventAndStop, stop} from "@emrgen/carbon-core";

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


  const handleInsertSection = (e) => {
    preventAndStop(e)
    const section = app.schema.type('section').default()
    app.cmd
      .Insert(Point.toAfter(node), section!)
      .Select(PinnedSelection.fromPin(Pin.toStartOf(section!)!))
      .Dispatch()
  }


  return (
    <CarbonBlock node={node}>
      <div className={'carbon-cell-container'}>
        <div className={'carbon-cell-handle'} onClick={handleToggleCell} onMouseDown={stop}>
          {isCollapsed() ? '▸' : '▾'}
          {/*<div className={'carbon-cell-insert-before'}>+</div>*/}
          <div className={'carbon-cell-insert-after'} onClick={handleInsertSection}>+</div>
        </div>
        <div className={'carbon-cell-view'}>
          {isCollapsed() ? <CarbonBlock node={node.children[0]!}/> : <CarbonChildren node={node}/>}
        </div>
      </div>
    </CarbonBlock>
  )
}
