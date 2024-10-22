import {Box, HStack, Stack} from "@chakra-ui/react";
import {Logout} from "./Logout";
import {userState} from "@/pages/atom.ts";
import {useRecoilState} from "recoil";

export function Account() {
  const [user] = useRecoilState(userState);
  return (
    <>
      <Stack p={6}>
        <HStack>
          <Box>Username:</Box>
          <Box>{user.username}</Box>
        </HStack>
        <HStack>
          <Box>Email:</Box>
          <Box>{user.email}</Box>
        </HStack>
      </Stack>

      <Logout />
    </>
  );
}
