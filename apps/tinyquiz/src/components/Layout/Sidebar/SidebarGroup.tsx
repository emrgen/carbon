import {Box, HStack, Stack} from "@chakra-ui/react";
import {useSidebar} from "./useSidebar";
import {useSidebarStore} from "@/pages/store.ts";
import React from "react";
import {toggleAddRemove} from "@/utils/update.ts";
import {SidebarGroupContext} from "@/components/Layout/Sidebar/useSidebarGroup.ts";

interface SidebarGroupProps {
  name: string;
  children?: React.ReactNode;
}

export function SidebarGroup(props: SidebarGroupProps) {
  const {isOpen} = useSidebar();
  const collapsedGroups = useSidebarStore(state => state.sidebar.collapsedGroups);
  const setCollapsedGroups = useSidebarStore(state => state.setCollapsedGroups);
  const isCollapsed = collapsedGroups.includes(props.name);
  const {activeGroupKey} = useSidebar()


  return (
    <SidebarGroupContext.Provider value={{groupKey: props.name}}>
      <Stack pb={1} spacing={1}>
        <HStack
          w="full"
          px={2}
          fontSize={'xs'}
          fontWeight={"bold"}
          color={isOpen ? '#aaa' : 'transparent'}
          overflow={"hidden"}
          whiteSpace={"nowrap"}
          height={isOpen ? 'auto' : '10px'}
          spacing={0}
        >
          <HStack
            bg={isCollapsed && activeGroupKey === props.name ? '#f0f0f0' : 'transparent'}
            _hover={{
              bg: isOpen ? '#f1f1f1' : 'transparent',
            }}
            w={'full'}
            px={2}
            py={0.5}
            borderRadius={6}
            cursor={isOpen ? 'pointer' : ''}
            onClick={(e) => {
              setCollapsedGroups((prev: string[]) => {
                return toggleAddRemove(prev, props.name, (a, b) => a === b);
              });
            }}
            justify={'space-between'}
          >
            <Box>
              {props.name}
            </Box>
          </HStack>
        </HStack>
        <Stack
          className={['sidebar-group-content', isCollapsed && isOpen ? 'collapsed' : 'expanded'].join(' ')}
          spacing={1}
        >
          {props.children}
        </Stack>
      </Stack>
    </SidebarGroupContext.Provider>
  )
}
