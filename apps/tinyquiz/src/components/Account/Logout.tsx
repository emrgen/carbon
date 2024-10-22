import { Square, Tooltip } from "@chakra-ui/react";
import { HiLogout } from "react-icons/hi";
import { useLogout } from "./useLogout";

export const Logout = () => {
  const handleLogout = useLogout();

  return (
    <Tooltip label="Logout" placement="right" hasArrow openDelay={700}>
      <Square
        size={8}
        pos={"absolute"}
        bottom={3}
        cursor={"pointer"}
        onClick={handleLogout}
      >
        <HiLogout onClick={handleLogout} />
      </Square>
    </Tooltip>
  );
};
