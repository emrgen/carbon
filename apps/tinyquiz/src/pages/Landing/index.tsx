import {Box, Flex, HStack, IconButton, Square, Stack, Text, Tooltip} from "@chakra-ui/react";
import {useNavigate} from "react-router-dom";
import {LandingContent} from "./LandingContent";
import {BiLogInCircle} from "react-icons/bi";
import {CompanyIcon} from "@/components/CompanyIcon.tsx";

const disabledStyles = {
  backgroundColor: "transparent",
  borderColor: "transparent",
  outline: "none",
};

export function Landing() {
  const navigate = useNavigate();

  return (
    <Stack w="full">
      <Box boxShadow={"0 0 0 1px #000"}>
        <Box w="1000px" margin={"0 auto"}>
          <header>
            <HStack justify={"space-between"} py={1} minH={'56px'}>
              <Flex>
                <Square size={10} bg={"#000"} color={"#fff"} fontSize={'xl'} userSelect={'none'} cursor={'pointer'}>
                  <CompanyIcon/>
                </Square>
              </Flex>
              <HStack>

                <Tooltip label={"Sign In"} placement={"right"} hasArrow openDelay={700}>
                  <IconButton
                    aria-label={"Sign In"}
                    size={"lg"}
                    p={0}
                    variant={"ghost"}
                    _hover={disabledStyles}
                    _active={disabledStyles}
                    _focus={disabledStyles}
                    onClick={() => {
                      navigate("/login");
                    }}
                    transform={'rotateZ(90deg)'}
                    icon={<BiLogInCircle />}
                  >
                    Sign In
                  </IconButton>
                </Tooltip>
              </HStack>
            </HStack>
          </header>
        </Box>
      </Box>

      <Box w="1000px" margin={"0 auto"}>
        {/* image */}
        <Box
          w="full"
          h="400px"
          bg={"#000"}
          color={"#fff"}
          display={"flex"}
          alignItems={"center"}
          justifyContent={"center"}
        >
          <Text fontSize={"3xl"}>Landing Page</Text>
        </Box>
        <LandingContent/>
      </Box>
    </Stack>
  );
}
