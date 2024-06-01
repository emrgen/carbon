import { RendererProps } from "@emrgen/carbon-react";
import React, { useCallback, useState } from "react";
import { AttrStatusOptionsPath, AttrStatusPath } from "../constants";
import { debounce } from "lodash";
import { Select } from "./Select";

export const StatusAttrValue = (props: RendererProps) => {
  const { node } = props;
  const [value, setValue] = useState<string | undefined>(undefined);
  const text = node.props.get(AttrStatusPath, "");
  const options = node.props.get(AttrStatusOptionsPath, [] as string[]);

  const handleChange = useCallback(
    debounce((value: string) => {
      console.log("change", value);
    }, 2000),
    [node],
  );

  return (
    <Select
      value={
        text
          ? {
              label: text,
              value: text,
            }
          : (undefined as any)
      }
      options={options.map((option) => ({
        label: option,
        value: option,
      }))}
      onChange={(selected) => {
        // handleChange(selected.map((option) => option.value));
      }}
    />
  );
};
