import {Stack, StackProps, useColorMode} from "@chakra-ui/react";
import {ReactNode, useEffect, useState} from "react";
import React from "react";
import {SidebarContext} from "./useSidebar";
import {useRecoilState} from "recoil";
import {sidebarState} from "@/components/Layout/Sidebar/atom.ts";
import {ToggleSidebarArrow} from "@/components/Layout/Sidebar/ToggleSidebarArrow.tsx";

interface SidebarProps extends StackProps {
  header?: ReactNode;
  activeKey?: string;
}

export function Sidebar(props: SidebarProps) {
  const { children, header } = props;
  const { colorMode } = useColorMode();
  const [activeKey, setActiveKey] = useState<string>(props.activeKey ?? "");
  const [activeGroupKey, setActiveGroupKey] = useState<string>("");
  const [{isOpen}, setSidebar] = useRecoilState(sidebarState);

  useEffect(() => {
    setActiveKey(props.activeKey ?? "");
  }, [props.activeKey]);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        toggle: () => setSidebar((s) => ({...s, isOpen: !s.isOpen})),
        activeKey,
        activeGroupKey,
        setActiveKey,
        setActiveGroupKey,
      }}
    >
      <Stack
        w={isOpen ? "200px" : "50px"}
        h="full"
        pos={"relative"}
        boxShadow={"0 0 0 1px #efefef"}
        transition={"all 0.2s ease"}
        spacing={0}
        userSelect={"none"}
      >
        {/*sidebar header*/}
        {header}

        {/*sidebar content*/}
        <Stack spacing={1} h={'full'}>{children}</Stack>

        {/*toggle page sidebar*/}
        <ToggleSidebarArrow />
      </Stack>
    </SidebarContext.Provider>
  );
}
