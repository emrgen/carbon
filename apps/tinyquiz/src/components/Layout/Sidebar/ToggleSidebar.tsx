import {Square} from "@chakra-ui/react";
import {PiSidebarSimple} from "react-icons/pi";
import {useSidebar} from "@/components/Layout/Sidebar/useSidebar.ts";

export const ToggleSidebar = () => {
  const {toggle} = useSidebar()
  return (
    <Square size={6} cursor={"pointer"} onClick={toggle} _hover={{bg: '#eee'}} borderRadius={4}>
      <PiSidebarSimple/>
    </Square>
  )
};