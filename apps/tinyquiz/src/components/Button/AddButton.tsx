import React from "react";

import {Button, ButtonProps} from "@chakra-ui/react";

import {AddIcon} from "@chakra-ui/icons";

interface AddButtonProps extends ButtonProps {

}

export const AddButton = (props: AddButtonProps) => {
  return (
    <Button
      colorScheme="green"
      leftIcon={<AddIcon boxSize={3}/>}
      {...props}
    >
      {props.children}
    </Button>
  )
}