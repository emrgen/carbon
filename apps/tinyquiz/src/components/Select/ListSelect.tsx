import {
  isOptionSelected,
  SelectOption,
  selectOptionKey,
} from "@/components/Select/ReactSelect.tsx";
import { Box, Stack, Text } from "@chakra-ui/react";
import React from "react";

interface ListSelectProps {
  options: SelectOption[];
  value?: SelectOption | null;
  onChange?: (value: SelectOption) => void;
}

export const ListSelect = (props: ListSelectProps) => {
  const { options, value, onChange } = props;

  return (
    <Stack spacing={1}>
      {options.map((op) => {
        return (
          <Box
            key={selectOptionKey(op)}
            bg={isOptionSelected(value, op) ? "#eee" : "transparent"}
            onClick={() => {
              return onChange?.(op);
            }}
            px={3}
            py={1}
            _hover={{
              bg: "#ddd",
            }}
            cursor={"pointer"}
            borderRadius={4}
          >
            <Text fontSize={"sm"}>{op.label}</Text>
          </Box>
        );
      })}
    </Stack>
  );
};
