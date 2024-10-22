import {Box} from "@chakra-ui/react";
import {Tooltip} from "@chakra-ui/react";
import {useColorMode} from "@chakra-ui/react";
import {HiOutlineChevronLeft} from "react-icons/hi";
import {HiOutlineChevronRight} from "react-icons/hi";
import React from "react";
import {useState} from "react";
import {useCallback} from "react";
import {useEffect} from "react";
import {useRecoilState} from "recoil";
import {sidebarState} from "@/components/Layout/Sidebar/atom.ts";

export const ToggleSidebarArrow = (props) => {
  const {colorMode} = useColorMode();

  const [, setSidebar] = useRecoilState(sidebarState);
  const [isOpen, setIsOpen] = useState(localStorage.getItem("sidebar:open") !== "false");
  useEffect(() => {
    setSidebar({isOpen});
  }, [isOpen, setSidebar]);
  const [opacity, setOpacity] = useState(0);

  const handleToggleSidebar = useCallback(() => {
    setIsOpen((a) => {
      return !a;
    });
    localStorage.setItem("sidebar:open", String(!isOpen));
  }, [isOpen]);

  useEffect(() => {
    const onMouseMove = (event) => {
      const {clientX} = event;
      if (isOpen) {
        if (clientX < 350) {
          setOpacity(1);
        }else {
          setOpacity(0)
        }
      } else {
        if (clientX < 120) {
          setOpacity(1);
        } else {
          setOpacity(0);
        }
      }
    }

    document.addEventListener('mousemove', onMouseMove);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
    }
  }, [isOpen]);

  return (
    <Tooltip
      label={isOpen ? "Collapse" : "Expand"}
      placement="right"
      hasArrow
      marginLeft={isOpen ? "" : "15px"}
      openDelay={800}
    >
      <Box
        opacity={opacity}
        className={'expand-sidebar-button'}
        pos="absolute"
        top={'50%'}
        left={'100%'}
        height={10}
        bg={colorMode === "dark" ? "gray.800" : "#fff"}
        cursor={"pointer"}
        color={colorMode === "dark" ? "#fff" : "#aaa"}
        border={"1px solid #ddd"}
        borderLeftColor={'transparent'}
        borderRightRadius={6}
        transition={"opacity 0.3s ease"}
        fontSize={"xs"}
        onClick={handleToggleSidebar}
        zIndex={1}
        display={"flex"}
        alignItems={'center'}
        _hover={{
          color: colorMode === "dark" ? "#fff" : "#000",
        }}
      >
        {isOpen ? <HiOutlineChevronLeft/> : <HiOutlineChevronRight/>}
      </Box>
    </Tooltip>
  )
}