import {ActionButton, ActionButtonProps} from "@/components/Table/Actions/ActionButton.tsx";
import React from "react";
import {Td} from "@chakra-ui/react";

interface ActionTdProps {
  items: ActionButtonProps['items'];
}
export const ActionTd = (props: ActionTdProps) => {
  return (
    <Td py={1}>
      <ActionButton items={props.items}/>
    </Td>
  )
}