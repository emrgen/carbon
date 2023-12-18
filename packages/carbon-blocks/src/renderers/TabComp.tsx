import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  CarbonBlock,
  CarbonChildren,
  CarbonContent,
  CarbonNode,
  CarbonNodeChildren,
  CarbonNodeContent,
  Node,
  NodeId,
  RendererProps,
  With,
  preventAndStop,
  useCarbon,
} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { AiOutlinePlus } from "react-icons/ai";

const TableContext = createContext<{
  onSelect: With<Node>;
  activeTabId: NodeId;
}>({
  onSelect: (id) => {},
  activeTabId: NodeId.IDENTITY,
});

export const TabComp = (props: RendererProps) => {
  const { node } = props;

  const [activeTabId, setActiveTabId] = useState(NodeId.IDENTITY);
  const [activeTab, setActiveTab] = useState<Optional<Node>>(null);

  const onSelect = useCallback((tabTitle: Node) => {
    // // console.log("onSelect", tabTitle.id);
    // setActiveTabId(tabTitle.id);
    // const tabContent = node.children.find(
    //   (n) =>
    //     tabTitle?.properties?.node?.link && n.properties?.node?.link ===
    //     tabTitle?.properties?.node?.link
    // );
    // console.log("tabContent", tabContent);
    //
    // setActiveTab(tabContent);
  },[node.children]);

  useEffect(() => {
    // const tabItem = node.child(0)?.child(0);
    // if (!tabItem) return;
    // onSelect(tabItem);
  }, [node, onSelect]);

  console.log(activeTab);

  return (
    <TableContext.Provider value={{ onSelect, activeTabId }}>
      <CarbonBlock node={node}>
        <div className="carbon-tab-titles">
          <CarbonChildren node={node.child(0)!} />

          <div className="carbon-add-tab-item">
            <div className="carbon-add-tab-item-button">
              <AiOutlinePlus />
            </div>
          </div>
        </div>

        <div
          className="carbon-tab-item-content"
          contentEditable="false"
          suppressContentEditableWarning
        >
          {activeTab && <CarbonNode node={activeTab} />}
          {!activeTab && <div className="add-tab-content">Click to insert</div>}
        </div>
      </CarbonBlock>
    </TableContext.Provider>
  );
};

export const TabTitlesComp = (props: RendererProps) => {
  const { node } = props;

  return (
    <CarbonBlock node={node}>
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};

export const TextTitleComp = (props: RendererProps) => {
  const { node } = props;
  const { onSelect, activeTabId } = useContext(TableContext);
  const onClick = (e) => {
    preventAndStop(e);
    onSelect(node);
  };

  return (
    <CarbonBlock
      node={node}
      custom={{ "data-active": activeTabId.eq(node.id), onClick }}
    >
      <CarbonNodeContent node={node} />
    </CarbonBlock>
  );
};

export const TabItemComp = (props: RendererProps) => {
  const { node } = props;
  console.log(node.name, name);

  return (
    <CarbonBlock node={node}>
      <CarbonNodeContent node={node} />
      <CarbonNodeChildren node={node} />
    </CarbonBlock>
  );
};
