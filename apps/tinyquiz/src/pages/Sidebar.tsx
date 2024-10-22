import { CompanyIcon } from "@/components/CompanyIcon";
import { Sidebar } from "@/components/Layout/Sidebar";
import { sidebarState } from "@/components/Layout/Sidebar/atom.ts";
import { SidebarItem } from "@/components/Layout/Sidebar/SidebarItem";
import {
  Box,
  Button,
  Circle,
  Flex,
  HStack,
  Stack,
  Tooltip,
} from "@chakra-ui/react";
import React from "react";
import { AiOutlineDashboard } from "react-icons/ai";
import { BiUser } from "react-icons/bi";
import { FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { userState } from "./atom";

interface AppSidebarProps {
  activeKey: string;
}

export const AppSidebar = (props: AppSidebarProps) => {
  const { activeKey } = props;
  const navigate = useNavigate();
  const [ { isOpen } ] = useRecoilState(sidebarState);
  const [ user, setUser ] = useRecoilState(userState);

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
        <Tooltip>
          <Flex px={isOpen ? 4 : 2} w={"full"} mb={4} mt={4}>
            <Button
              variant={"outline"}
              size={"sm"}
              w={"full"}
              padding={"2 0"}
              lineHeight={1}
              fontSize={"14px"}
              h={7}
              colorScheme={"black"}
              _hover={{
                boxShadow: "0 0 0 2px #ddd",
              }}
              _active={{
                boxShadow: "0 0 0 1px #000",
              }}
              onClick={() => navigate("/app")}
            >
              {isOpen ? "Create" : "+"}
            </Button>
          </Flex>
        </Tooltip>

        <SidebarItem
          pathPrefix={"/"}
          label="Dashboard"
          icon={<AiOutlineDashboard />}
          path={"/"}
        />

        <SidebarItem pathPrefix={"/quiz"} label="Quizes" icon={<FiUsers />} />

        <SidebarItem
          pathPrefix={"/question"}
          label="Questions"
          icon={<FiUsers />}
        />

        {/* <SidebarItem pathPrefix={"/app"} label="Logout" icon={<BiUser />} />*/}
        <Box position={"absolute"} bottom={2} w={"full"} fontWeight={"bold"}>
          <SidebarItem
            pathPrefix={"/account"}
            label={user.username}
            icon={<BiUser />}
          />
        </Box>
      </Stack>
    </Sidebar>
  );
};
