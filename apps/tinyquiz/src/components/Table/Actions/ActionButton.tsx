import {
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
} from "@chakra-ui/react";
import { BsThreeDots } from "react-icons/bs";
import { stopEvent } from "@/utils/event.ts";
import React from "react";
import { noop } from "lodash";

export interface MenuItemProps {
  icon: any;
  label: string;
  key?: string;
  onClick?: () => void;
}

export interface ActionButtonProps {
  items: MenuItemProps[];
}

export const ActionButton = (props: ActionButtonProps) => {
  return (
    <Stack direction={"row"} spacing={2} justify={"center"}>
      <Menu>
        <MenuButton
          as={IconButton}
          aria-label={"Edit"}
          icon={<BsThreeDots />}
          onClick={stopEvent}
          variant={"ghost"}
          size={"xs"}
          borderRadius={16}
        >
          Actions
        </MenuButton>
        <MenuList
          onClick={(e) => {
            return e.stopPropagation();
          }}
        >
          {props.items.map((item) => {
            return (
              <MenuItem
                key={item.key ?? item.label}
                onClick={item.onClick ?? noop}
              >
                <HStack>
                  {item.icon}
                  <Text>{item.label}</Text>
                </HStack>
              </MenuItem>
            );
          })}
        </MenuList>
      </Menu>
    </Stack>
  );
};
