import React from "react";
import { AiOutlineDashboard } from "react-icons/ai";
import { Circle, Flex, HStack, Stack } from "@chakra-ui/react";
import { Sidebar } from "@/components/Layout/Sidebar";
import { SidebarItem } from "@/components/Layout/Sidebar/SidebarItem";
import { useNavigate } from "react-router-dom";
import { FiUsers } from "react-icons/fi";
import { sidebarState } from "@/components/Layout/Sidebar/atom.ts";
import { useRecoilState } from "recoil";
import { CompanyIcon } from "@/components/CompanyIcon.tsx";

interface AppSidebarProps {
  activeKey: string;
}

export const AppSidebar = (props: AppSidebarProps) => {
  const { activeKey } = props;
  const navigate = useNavigate();
  const [ { isOpen } ] = useRecoilState(sidebarState);

  return (
    <Sidebar activeKey={activeKey}>
      <Flex
        pt={4}
        pb={2}
        px={4}
        w="full"
        userSelect={"none"}
        justify={"space-between"}
        as={isOpen ? HStack : Stack}
        align={"center"}
        // bg={'#eee'}
        pos={"relative"}
        top={"3px"}
      >
        <Circle
          size={6}
          bg="#000"
          color={"#fff"}
          onClick={() => {
            return navigate("/");
          }}
          cursor={"pointer"}
        >
          <CompanyIcon />
        </Circle>
      </Flex>

      <Stack
        overflow={"auto"}
        flex={1}
        py={2}
        className={"sidebar-content"}
        spacing={1}
      >
        <SidebarItem
          pathPrefix={"/"}
          label="Dashboard"
          icon={<AiOutlineDashboard />}
          path={"/"}
        />

        <SidebarItem
          pathPrefix={"/member"}
          label="Members"
          icon={<FiUsers />}
        />
      </Stack>
    </Sidebar>
  );
};
