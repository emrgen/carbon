import {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";
import {
  ActivatedPath,
  CarbonBlock,
  CarbonChildren,
  CarbonNode, CarbonNodeChildren, CarbonNodeContent, EventsOut,
  Node,
  NodeId, preventAndStop,
  RendererProps, RenderPath, stop, Transaction, useCarbon, useCarbonMounted, useNodeChange,
  With,

} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { AiOutlinePlus } from "react-icons/ai";
import {first} from "lodash";

const TableContext = createContext<{
  onSelect: With<Node>;
  activeTabId: NodeId;
}>({
  onSelect: (id) => {},
  activeTabId: NodeId.IDENTITY,
});


const getActiveTabId = (node: Node) => {
  return node.properties.get<string>('remote/state/activeTabId') ?? '';
}

const setActiveTabId = (cmd: Transaction, node: Node, tabId: string) => {
  cmd.update(node,{
    ['remote/state/activeTabId']: tabId,
  })
  .dispatch();
}

const getTabName = (tab: Node) => {
  return tab.properties.get<string>('remote/state/tabName') ?? '';
}

export const TabGroupComp = (props: RendererProps) => {
  const {node} = props;
  const {children} = node;
  const [activeTabNode, setActiveTabNode] = useState(Node.IDENTITY);
  const app = useCarbon()

  console.log(node.key, activeTabNode.textContent);

  const activeTabId = useMemo(() => getActiveTabId(node),[node]);

  const handleActiveTabChange = useCallback((tab: Node) => {
    console.log('handleActiveTabChange', tab)
    const {cmd} = app;
    setActiveTabId(cmd, node, tab.id.toString());
    setActiveTabNode(tab);
  },[app, node])

  useEffect(() => {
    const onMounted = () => {
      const activeTabId = getActiveTabId(node);
      const {children} = node;
      if (!activeTabId && children.length > 0) {
        const firstTab = first(children);
        // avoid cycle
        const firstTabId = firstTab?.id.toString();
        if (firstTabId === activeTabId) {
          return;
        }

        if (firstTab) {
          setActiveTabId(app.cmd, node, firstTab.id.toString());
          setActiveTabNode(firstTab);
        }
      }
    }

    app.on(EventsOut.mounted, onMounted)
    return () => {
      app.off(EventsOut.mounted, onMounted)
    }
  },[app, node])

  console.log('activeTabId', getActiveTabId(node))

  return (
    <CarbonBlock node={node}>
      <div className={'carbon-tab-header'}>
        <div className={'carbon-tab-names'}>
          {children.map(tab => {
            return (
              <TabTitleComp
                key={tab.key}
                node={tab}
                onTabChange={handleActiveTabChange}
                activeTabId={getActiveTabId(node)}
              />
            )
          })}
        </div>
      </div>
      <div className={'carbon-tab-content'}>
        {!activeTabNode.eq(Node.IDENTITY) && <CarbonNode node={activeTabNode} key={activeTabId}/>}
      </div>
    </CarbonBlock>
  )
}

export const TabComp = (props: RendererProps) => {
  const {node} = props;

  return (
    <CarbonBlock node={node}>
      <CarbonNodeContent node={node} />
      <CarbonNodeChildren node={node} />
    </CarbonBlock>
  )
}

interface TabTitleProps extends RendererProps {
  activeTabId: string;
  onTabChange: (tab: Node) => void;
}

const TabTitleComp = (props: TabTitleProps) => {
  const {node: tab, onTabChange, activeTabId} = props;

  const titleNode = tab.child(0)!;
  useNodeChange({node: titleNode});
  const titleContent = titleNode?.textContent ?? '';

  const attributes = useMemo(() => {
    const isActive = tab.id.toString() === activeTabId;
    if (isActive) {
      return {
        'data-active': true
      }
    }
    return {};
  },[tab, activeTabId]);

  console.log('TabTitleComp', titleNode.key, activeTabId)
  const tabName = useMemo(() => getTabName(tab),[tab])
  return (
    <div
      className={'carbon-tab-name'}
      onClick={(e) => {
        stop(e);
        onTabChange(tab)
      }}
      onMouseDown={preventAndStop}
      key={tab.key}
      data-id={tab.key}
      {...attributes}
    >
      {tabName && tabName}
      {!tabName && 'Click to edit'}
    </div>
  )
}
