import {
  CarbonBlock,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
  useSelectionHalo
} from "@emrgen/carbon-core";

export default function DividerComp(props: RendererProps) {
  const app = useCarbon();
  const {node} = props;

  const { attributes, SelectionHalo } = useSelectionHalo(props);

  const handleClick = e => {
    e.preventDefault();
    app.tr.selectNodes([node.id]).dispatch();
  }

  return (
    <CarbonBlock
      {...props}
      custom={{
        onClick: handleClick,
      }}
    >
      <div
        className="divider"
        contentEditable="false"
        suppressContentEditableWarning
      ></div>
      <span />
      <CarbonNodeContent node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
}
