import {
  Box,
  Flex,
  Heading,
  HStack,
  IconButton,
  Square,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { BiLogInCircle } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import { CompanyIcon } from "../../components/CompanyIcon";
import { LandingContent } from "./LandingContent";

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
        <Box w={"90%"} maxW={"1000px"} margin={"0 auto"}>
          <header>
            <HStack justify={"space-between"} py={1} minH={"56px"}>
              <Flex>
                <Square
                  size={10}
                  // bg={"#000"}
                  color={"#fff"}
                  fontSize={"xl"}
                  userSelect={"none"}
                  cursor={"pointer"}
                >
                  <CompanyIcon />
                </Square>
              </Flex>
              <HStack>
                <Tooltip
                  label={"Sign In"}
                  placement={"right"}
                  hasArrow
                  openDelay={700}
                >
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
                    transform={"rotateZ(90deg)"}
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

      <Box w={"90%"} maxW={"1000px"} margin={"0 auto"} mt={5}>
        {/* image */}
        <Box
          w="full"
          h="400px"
          bg={"#000"}
          color={"#fff"}
          display={"flex"}
          alignItems={"center"}
          justifyContent={"center"}
          gap={10}
        >
          <HStack alignItems={"end"} overflow={"visible"} pos={"relative"}>
            <Heading size={"4xl"} fontFamily={"Geist Sans, Helvetica"}>
              TinyQuiz
            </Heading>
            <Box
              pb={1}
              pos={"absolute"}
              left={"100%"}
              whiteSpace={"nowrap"}
              ml={4}
            >
              <Text fontSize={"lg"}>is preparing</Text>
            </Box>
          </HStack>
        </Box>

        <LandingContent />
      </Box>
    </Stack>
  );
}
