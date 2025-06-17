import "./App.css";
import {Button, HStack, Stack} from "@chakra-ui/react";
import {HashRouter, NavLink} from "react-router-dom";
import {Pages} from "./Demo/Pages";

// This file is part of the Carbon Design System project
export default function App() {
  return (
    <HashRouter>
      <div className={"carbon-app-container"}>
        <div className={"carbon-demo-header"}>
          <NavLink to={"/richtext"}>
            <div className={"demo-name"}>RichText</div>
          </NavLink>
          <NavLink to={"/plain"}>
            <div className={"demo-name"}>Plain</div>
          </NavLink>
          <NavLink to={"/list"}>
            <div className={"demo-name"}>List</div>
          </NavLink>
        </div>

        <Stack gap={0} w={'100%'} maxW={'960px'}>
          <HStack bg={"#f5f5f5"} p={3} justifyContent={"end"} w={"full"} px={10}>
            <a href={'https://github.com/emrgen/carbon'} target={"_blank"} rel="noreferrer">
              <Button
                size={"sm"}
                borderRadius={0}
                bg={"#000"}
                color={"#fff"}
                _hover={{bg: "#f5f5f5", color: "#333"}}
              >
                Github
              </Button>
            </a>
          </HStack>
          <Pages/>
        </Stack>
      </div>
    </HashRouter>
  );
}
