import {Box, Flex, HStack, Square, Tooltip, useColorMode} from "@chakra-ui/react";
import {useSidebar} from "./useSidebar";
import {ReactNode, useEffect, useMemo} from "react";
import {Link} from "react-router-dom";
import {Routes} from "@/hooks/useActiveKey.ts";
import {useSidebarGroup} from "@/components/Layout/Sidebar/useSidebarGroup.ts";

interface SidebarItemProps {
  pathPrefix: keyof typeof Routes;
  label?: ReactNode;
  icon: ReactNode;
  path?: string;
  isHidden?: boolean;
  tooltip?: string;
}

export function SidebarItem(props: SidebarItemProps) {
  const {label, icon, pathPrefix, isHidden = false, tooltip} = props;
  const {isOpen, activeKey, setActiveKey, setActiveGroupKey} = useSidebar();
  const {colorMode} = useColorMode();
  const {groupKey} = useSidebarGroup()

  useEffect(() => {
    if (pathPrefix === activeKey) {
      setActiveGroupKey(groupKey);
    }
  }, [pathPrefix, activeKey, groupKey, setActiveKey]);

  const style = useMemo(() => {
    if (pathPrefix === activeKey) {
      if (colorMode === "dark") {
        return {
          // boxShadow: `2px 0 0 0px var(--chakra-colors-gray-800), 0 0 0 1px #000`,
        };
      }

      return {
        // boxShadow: `2px 0 0 0px #fff, 0 0 0 1px #ddd`,
        bg: '#efefef'
      };
    }

    return {};
  }, [pathPrefix, activeKey, colorMode]);

  return (
    <>
      {!isHidden && (
        <Tooltip
          label={tooltip ?? label}
          placement="right"
          hasArrow
          hidden={isOpen}
          openDelay={700}
        >
          <Box px={2}>
            <Flex
              w="full"
              cursor={"pointer"}
              pos="relative"
              borderRadius={6}
              {...style}
              // transition={"all 0.0s ease"}

              // onClick={() => {
              //   if (!pathPrefix) return;
              //   setActiveKey(pathPrefix);
              //   navigate(value.path ?? pathPrefix);
              // }}
              className={"sidebar-item"}
            >
              <Link
                to={props.path ?? pathPrefix}
                style={{
                  width: '100%',
                  display: 'flex',
                  padding: '0 6px',
                }}
              >
                <HStack px={0} spacing={1} w="full" pos="relative" justifyContent={'center'}>
                  <Square size={7} fontSize={"sm"}>
                    {icon}
                  </Square>
                  <Box
                    opacity={isOpen ? "full" : "0"}
                    w={isOpen ? "full" : "0"}
                    overflow={"hidden"}
                    whiteSpace={"nowrap"}
                    transition={isOpen ? "all 0.3s ease" : "all 0s ease"}
                    fontSize={'xs'}
                    flex={1}
                    display={isOpen ? 'block' : 'none'}
                  >
                    {label}
                  </Box>
                </HStack>
                {/* <Square
              pos={"absolute"}
              size={2.5}
              bg={colorMode === "dark" ? "gray.100" : "gray.800"}
              opacity={pathPrefix === activeKey ? "1" : "0"}
              left={-1.5}
              top={"50%"}
              transform={"translateY(-50%) rotate(45deg)"}
              // borderRadius={"md"}
            /> */}
              </Link>
            </Flex>
          </Box>
        </Tooltip>
      )}
    </>
  );
}
