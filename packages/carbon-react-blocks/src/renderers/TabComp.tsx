import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
  ContenteditablePath,
  EventsOut, Node, NodeId, onEnter, State,
  TitlePath
} from "@emrgen/carbon-core";
import {first} from "lodash";
import {useCombineConnectors, useConnectorsToProps, useDragDropRectSelect} from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock, CarbonChildren,
  CarbonNode,
  RendererProps,
  useCarbon,
  useNodePropertyWatcher,
  useNodeState,
  useSelectionHalo
} from "@emrgen/carbon-react";
import {getActiveTab, getActiveTabId, getRenamingTabId, getTabTitle, setRenamingTabId} from "@emrgen/carbon-blocks";
import {stop} from "@emrgen/carbon-core/src/utils/event";

export const TabsComp = (props: RendererProps) => {
  const {node: tabs} = props;
  const {children} = tabs;
  const app = useCarbon();

  const ref = useRef<any>(null);
  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({node: tabs, ref});
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  const activeTabNode = getActiveTab(tabs) ?? Node.IDENTITY;
  const activeTabId = activeTabNode.id.toString();

  // console.log('activeTabId', activeTabId)

  useNodePropertyWatcher((after, before) => {
    console.log('tab property changed', after, before)
  }, tabs)

  const handleActiveTabChange = useCallback((tab: Node) => {
    if (tab.id.toString() === activeTabId) {
      return;
    }
    // console.log('handleActiveTabChange', tab)
    const {cmd} = app;
    cmd.tabs.openTab(tabs, tab).dispatch()
  }, [app, tabs, activeTabId])

  useEffect(() => {
    const onMounted = () => {
      const activeTabId = getActiveTabId(tabs);
      const {children} = tabs;
      if (!activeTabId && children.length > 0) {
        const firstTab = first(children);
        // avoid cycle
        const firstTabId = firstTab?.id.toString();
        if (firstTabId === activeTabId) {
          return;
        }

        if (firstTab) {
          app.cmd.tabs.openTab(tabs, firstTab).dispatch();
        }
      }
    }

    app.on(EventsOut.mounted, onMounted)
    return () => {
      app.off(EventsOut.mounted, onMounted)
    }
  }, [app, tabs])

  const handleAddNewTab = useCallback((e) => {
    app.cmd.tabs.create(tabs).dispatch();
  }, [app, tabs]);

  console.log('active node id', activeTabNode.id.toString(), activeTabId)

  return (
    <CarbonBlock node={tabs} ref={ref} custom={connectors}>
      <div className={'carbon-tab-header'}>
        {!tabs.isVoid && <div className={'carbon-tab-names'}>
          {children.map(tab => {
            return (
              <TabTitleComp
                editable={true}
                key={tab.key}
                node={tab}
                onTabChange={handleActiveTabChange}
                activeTabId={activeTabId}
                isRenaming={getRenamingTabId(tabs) === tab.id.toString()}
                onStartRenaming={(tab) => {
                  const {cmd} = app;
                  setRenamingTabId(cmd, tabs, tab.id.toString());
                  cmd.dispatch();
                }}
                onStopRenaming={(tab) => {
                  const {cmd} = app;
                  setRenamingTabId(cmd, tabs, '').dispatch();
                }}
              />
            )
          })}
        </div>
        }
        <div className={'add-new-tab'} onClick={handleAddNewTab}>+</div>
      </div>
      <div className={'carbon-tab-content'}>
        {!activeTabNode.id.eq(NodeId.IDENTITY) && <CarbonNode node={activeTabNode} key={activeTabNode.key}/>}
        {/*{tabs.children.map(tab => {*/}
        {/*  return (*/}
        {/*    <CarbonNode node={tab} key={tab.key}/>*/}
        {/*  )*/}
        {/*})}*/}
      </div>
      {selection.SelectionHalo}
    </CarbonBlock>
  )
}

export const TabComp = (props: RendererProps) => {
  const {node} = props;
  const ref = useRef<any>(null);
  const app = useCarbon();

  const selection = useSelectionHalo(props);
  const {attributes} = useNodeState({node});
  const [isSelecting, setIsSelecting] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  useEffect(() => {
    // const onMouseDown = (e) => {
    //   console.log('tab mouse down', e)
    //   setIsMouseDown(true)
    // }
    // const onMouseUp = (e) => {
    //   console.log('tab mouse up', e)
    //   setIsMouseDown(false)
    //   setIsSelecting(false)
    // }
    // window.addEventListener('mousedown', onMouseDown)
    // window.addEventListener('mouseup', onMouseUp)
    // return () => {
    //   window.removeEventListener('mousedown', onMouseDown)
    //   window.removeEventListener('mouseup', onMouseUp)
    // }
  }, []);

  useEffect(() => {
    // const onChange = (state: State) => {
    //   const {isSelectionChanged} = state;
    //   if (isSelectionChanged && isMouseDown) {
    //     setIsSelecting(true);
    //   }
    //   const {selection} = state;
    //   if (selection.isInline && !selection.tail.node.chain.some(n => n.id.eq(node.id))) {
    //     onMouseOut(null)
    //   }
    // }
    //
    // app.on(EventsOut.changed, onChange)
    // return () => {
    //   app.off(EventsOut.changed, onChange)
    // }
  }, [app, isMouseDown, node]);

  const onMouseOver = useCallback((e) => {
    // console.log('tab mouse over', e , isSelecting)
    // if (isSelecting) return
    // if (node.props.get(ContenteditablePath)) return
    // console.log('-------------', node.props.get(ContenteditablePath))
    // app.cmd.Update(node.id, {
    //   [ContenteditablePath]: true,
    // }).Dispatch();
    // console.log('tab mouse over', e)
  },[app, isSelecting, node])

  const onMouseOut = useCallback((e) => {
    // if (!node.props.get(ContenteditablePath)) return
    // app.cmd.Update(node.id, {
    //   [ContenteditablePath]: false,
    // }).Dispatch();
    // console.log('tab mouse out', e)
  },[app, node])

  return (
    <CarbonBlock {...props} ref={ref} custom={{...attributes, onMouseOver}}>
      <CarbonChildren node={node}/>
      {selection.SelectionHalo}
    </CarbonBlock>
  )
}

interface TabTitleProps extends RendererProps {
  activeTabId: string;
  onTabChange: (tab: Node) => void;
  onStartRenaming?: (tab: Node) => void;
  onStopRenaming?: (tab: Node) => void;
  isRenaming?: boolean;
}

const TabTitleComp = (props: TabTitleProps) => {
  const {node: tab, onTabChange, activeTabId, isRenaming, onStartRenaming, onStopRenaming} = props;
  const app = useCarbon();
  const [tabTitle, setTabTitle] = useState(getTabTitle(tab));
  const ref = useRef<HTMLInputElement>(null);

  const updateTabName = useCallback((value) => {
    app.cmd.update(tab, {
      [TitlePath]: value,
    }).dispatch();
  }, [app, tab]);

  const handleTabNameChange = useCallback((e) => {
    const {value} = e.target;
    updateTabName(value);
    setTabTitle(value)
  }, [updateTabName]);

  const isActive = useMemo(() => {
    return tab.id.toString() === activeTabId;
  }, [tab, activeTabId])

  const attributes = useMemo(() => {
    const attrs = {}

    if (isActive) {
      attrs['data-active'] = true;
    }

    if (isRenaming) {
      attrs['data-editable'] = true;
    }

    return attrs;
  }, [isActive, isRenaming]);

  return (
    <div className={'carbon-tab-name'} {...attributes} data-id={tab.key}>
      <div className={'carbon-tab-name-view'}
        onMouseUp={e => {
         stop(e)
         if (activeTabId !== tab.id.toString()) {
           app.enable();
           onTabChange(tab)
         }
        }}
        onMouseDown={e => {
          stop(e);
          if (isActive) {
            app.disable()
            onStartRenaming?.(tab)
          }
        }}
      >
        {tabTitle && tabTitle}
        {!tabTitle && <span className={'carbon-tab-name-placeholder'}>-</span>}
      </div>
      {isRenaming && (
        <div
          className={'carbon-tab-name-edit'}
          onMouseDown={stop}
          onKeyDown={stop}
          onKeyUp={stop}
          onBeforeInput={stop}
        >
          <input
            value={tabTitle}
            onChange={handleTabNameChange}
            onMouseUp={e => {
              stop(e);
              if (isRenaming) {
                // @ts-ignore
                e.target.focus();
              }
            }}
            onBlur={e => {
              onStopRenaming?.(tab)
              app.enable();
            }}
            onKeyDown={onEnter(() => {
              onStopRenaming?.(tab)
              updateTabName(tabTitle);
              app.enable();
            })}
          />
        </div>
      )}
    </div>
  )
}
