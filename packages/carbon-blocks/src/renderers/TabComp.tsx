import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import {
  ActivatedPath,
  CarbonBlock,
  CarbonChildren,
  CarbonNode,
  CarbonNodeChildren,
  CarbonNodeContent,
  EventsOut,
  Node,
  NodeChangeType,
  NodeId,
  prevent,
  preventAndStop,
  RendererProps,
  RenderPath,
  stop,
  TitlePath,
  Transaction,
  useCarbon,
  useCarbonChange,
  useCarbonMounted,
  useNodeChange,
  useSelectionHalo,
  With,

} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { AiOutlinePlus } from "react-icons/ai";
import {first} from "lodash";
import {useCombineConnectors, useConnectorsToProps, useDragDropRectSelect} from "@emrgen/carbon-dragon";

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

const getTabTitle = (node: Node) => {
  return node.properties.get<string>(TitlePath) ?? '';
}

export const TabGroupComp = (props: RendererProps) => {
  const {node} = props;
  const {children} = node;
  const [activeTabNode, setActiveTabNode] = useState(Node.IDENTITY);
  const app = useCarbon()
  const ref = useRef(null);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({node, ref});
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  console.log(node.key, activeTabNode.textContent);

  const activeTabId = useMemo(() => getActiveTabId(node),[node]);

  const handleActiveTabChange = useCallback((tab: Node) => {
    if (tab.id.toString() === activeTabId) {
      return;
    }
    console.log('handleActiveTabChange', tab)
    const {cmd} = app;
    setActiveTabId(cmd, node, tab.id.toString());
    setActiveTabNode(tab);
  },[app, node, activeTabId])

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
    <CarbonBlock node={node} ref={ref} custom={connectors}>
      <div className={'carbon-tab-header'}>
        <div className={'carbon-tab-names'}>
          {children.map(tab => {
            return (
              <TabTitleComp
                editable={true}
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
      {selection.SelectionHalo}
    </CarbonBlock>
  )
}

export const TabComp = (props: RendererProps) => {
  const {node} = props;
  const ref = useRef(null);

  const selection = useSelectionHalo(props);

  return (
    <CarbonBlock node={node} ref={ref}>
      <CarbonChildren node={node} />
      {selection.SelectionHalo}
    </CarbonBlock>
  )
}

interface TabTitleProps extends RendererProps {
  activeTabId: string;
  onTabChange: (tab: Node) => void;
  editable?: boolean;
}

const TabTitleComp = (props: TabTitleProps) => {
  const {node: tab, onTabChange, activeTabId, editable} = props;
  const app = useCarbon();
  const change = useCarbonChange();
  const [tabTitle, setTabTitle] = useState(getTabTitle(tab));

  useEffect(() => {
    const onChange = (value: Node, parent: Optional<Node>, counter: number) => {
      // setNode(value);
      // setCounter(counter);
      // setParent(parent);
      // console.log(value.version, node.version, value.id.toString(), value.textContent);
      console.log("tab title changed", value.name, value.id.toString(), getTabTitle(value));
      setTabTitle(getTabTitle(value));
    };

    change.on(tab.id, NodeChangeType.update, onChange);
    return () => {
      // console.log('unmounting', node.id.toString());
      change.off(tab.id, NodeChangeType.update, onChange);
    };
  }, [change, tab]);

  const attributes = useMemo(() => {
    const isActive = tab.id.toString() === activeTabId;
    if (isActive) {
      return {
        'data-active': true
      }
    }
    return {};
  },[tab, activeTabId]);

  const handleChange = useCallback((e) => {
    setTabTitle(e.target.value);
    // console.log('value', e.target.value)
    // app.cmd.update(tab, {
    //   [TitlePath]: e.target.value,
    // }).dispatch();
  },[app])

  const handleStartRenaming = useCallback((e) => {
    if (isRenaming()) {
      return;
    }
    app.cmd.update(tab.parent!, {
      ['local/state/renaming/tabId']: tab.id.toString(),
    }).dispatch();

  },[app, tab.parent])

  const isRenaming = useCallback(() => {
    return (tab.parent!.properties.get<boolean>('local/state/renaming/tabId') ?? '') === tab.id.toString();
  },[tab.parent])

  const isActive = useMemo(() => {
    return tab.id.toString() === activeTabId;
  },[tab, activeTabId])

  return (
    <>
      {!isActive && <div
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
        {tabTitle && tabTitle}
        {!tabTitle && 'Click to edit'}
      </div>}
      {isActive && <div
        data-id={tab.key}
        className={'carbon-tab-name-edit'}
        data-editable={isRenaming()}
        onMouseOver={e => {
          if (isRenaming()) {
            return;
          }

          app.disable()
        }}
        onBlur={e => {
          app.enable()
        }}
        onMouseOut={e => {
          if (isRenaming()) {
            return;
          }
          app.enable()
        }}

        onClick={(e) => {
          console.log('focus', tab.id.toString())
          handleStartRenaming(e);
        }}
        // onKeyDown={(e) => {
        //   stop(e);
        // }}
        // onKeyUp={(e) => {
        //   stop(e);
        // }}
        // onBeforeInput={(e) => {
        //   stop(e);
        // }}
        data-active={isActive}
      >
        <input value={tabTitle} onChange={handleChange} data-editable={isRenaming()}/>
      </div>}
    </>
  )
}
