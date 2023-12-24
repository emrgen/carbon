import {createContext, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
  CarbonBlock,
  CarbonChildren,
  CarbonNode, CarbonPlaceholder,
  EventsOut,
  Node,
  NodeChangeType,
  NodeId,
  preventAndStop,
  RendererProps,
  stop,
  TitlePath,
  Transaction,
  useCarbon,
  useCarbonChange, useNodeContentWatcher, useNodePropertyWatcher, useNodeWatcher,
  useSelectionHalo,
  With,
} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {first} from "lodash";
import {useCombineConnectors, useConnectorsToProps, useDragDropRectSelect} from "@emrgen/carbon-dragon";

const RenamingTabIdPath = 'local/state/rename/tabId';

const TableContext = createContext<{
  onSelect: With<Node>;
  activeTabId: NodeId;
}>({
  onSelect: (id) => {
  },
  activeTabId: NodeId.IDENTITY,
});

const getActiveTabId = (node: Node) => {
  return node.properties.get<string>('remote/state/activeTabId') ?? '';
}

const setActiveTabId = (cmd: Transaction, node: Node, tabId: string) => {
  cmd.update(node, {
    ['remote/state/activeTabId']: tabId,
  })
  return cmd
}

const getTabTitle = (node: Node) => {
  return node.properties.get<string>(TitlePath) ?? '';
}


const getRenamingTabId = (node: Node) => {
  return node.properties.get<string>(RenamingTabIdPath) ?? '';
}

const setRenamingTabId = (cmd: Transaction, node: Node, tabId: string) => {
  cmd.update(node, {
    [RenamingTabIdPath]: tabId,
  })

  return cmd
}


export const TabsComp = (props: RendererProps) => {
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

  const activeTabId = useMemo(() => getActiveTabId(node), [node]);

  useNodeContentWatcher((after, before) => {
    if (after.size !== before.size) {
      console.log('tab count changed', after.size, before.size)
    }
  }, node)

  useNodePropertyWatcher((after, before) => {
    console.log('tab property changed', after, before)
  }, node)

  const handleActiveTabChange = useCallback((tab: Node) => {
    if (tab.id.toString() === activeTabId) {
      return;
    }
    // console.log('handleActiveTabChange', tab)
    const {cmd} = app;
    setActiveTabId(cmd, node, tab.id.toString());
    setRenamingTabId(cmd, node, '');
    cmd.dispatch();
    setActiveTabNode(tab);
  }, [app, node, activeTabId])

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
          setActiveTabId(app.cmd, node, firstTab.id.toString()).dispatch();
          setActiveTabNode(firstTab)
        }
      }
    }

    app.on(EventsOut.mounted, onMounted)
    return () => {
      app.off(EventsOut.mounted, onMounted)
    }
  }, [app, node])

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
                isRenaming={getRenamingTabId(node) === tab.id.toString()}
                onStartRenaming={(tab) => {
                  const {cmd} = app;
                  setRenamingTabId(cmd, node, tab.id.toString());
                  cmd.dispatch();
                }}
                onDoneRenaming={(tab) => {
                  const {cmd} = app;
                  setRenamingTabId(cmd, node, '').dispatch();
                }}
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
      <CarbonChildren node={node}/>
      {selection.SelectionHalo}
    </CarbonBlock>
  )
}

interface TabTitleProps extends RendererProps {
  activeTabId: string;
  onTabChange: (tab: Node) => void;
  onStartRenaming?: (tab: Node) => void;
  onDoneRenaming?: (tab: Node) => void;
  isRenaming?: boolean;
}

const TabTitleComp = (props: TabTitleProps) => {
  const {node: tab, onTabChange, activeTabId, isRenaming, onStartRenaming, onDoneRenaming} = props;
  const app = useCarbon();
  const change = useCarbonChange();
  const [tabTitle, setTabTitle] = useState(getTabTitle(tab));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onChange = (value: Node, parent: Optional<Node>, counter: number) => {
      // console.log("tab title changed", value.name, value.id.toString(), getTabTitle(value));
      setTabTitle(getTabTitle(value));
    };

    change.on(tab.id, NodeChangeType.update, onChange);
    return () => {
      change.off(tab.id, NodeChangeType.update, onChange);
    };
  }, [change, tab]);

  const handleTabNameChange = useCallback((e) => {
    const {value} = e.target;
    app.cmd.update(tab, {
      [TitlePath]: value,
    }).dispatch();
  }, [app, tab]);

  const isActive = useMemo(() => {
    return tab.id.toString() === activeTabId;
  }, [tab, activeTabId])

  const attributes = useMemo(() => {
    if (isActive) {
      return {
        'data-active': true
      }
    }
    return {};
  }, [isActive]);

  useEffect(() => {
    if (isRenaming && ref.current) {
      console.log('focus')
      setTimeout(() => {
        ref.current?.focus();
      }, 1000)
    }
  }, [isRenaming, tab.key, ref])

  return (
    <>
      {!isRenaming && <div
        className={'carbon-tab-name'}
        onMouseDown={e => {
          stop(e);
          if (isActive) {
            app.disable()
            onStartRenaming?.(tab)
          } else if (activeTabId !== tab.id.toString()) {
            app.enable();
            onTabChange(tab)
          }
        }}
        key={tab.key}
        data-id={tab.key}
        {...attributes}
      >
        {tabTitle && tabTitle}
        {!tabTitle && <span className={'carbon-tab-name-placeholder'}>Untitled</span>}

      </div>}
      {isRenaming && <div
        ref={ref}
        data-id={tab.key}
        className={'carbon-tab-name-edit'}
        data-editable={isRenaming}
        data-active={isActive}
        onMouseDown={stop}
        onKeyDown={stop}
        onKeyUp={stop}
        onBeforeInput={stop}
      >
        <input
          value={tabTitle}
          onChange={handleTabNameChange}
          data-editable={isRenaming}
          onMouseUp={e => {
           stop(e);
           if (isRenaming) {
             e.target.focus();
             console.log('focus now')
           }
          }}
          onBlur={e => {
            onDoneRenaming?.(tab)
            app.enable();
          }}
        />
      </div>}
    </>
  )
}
