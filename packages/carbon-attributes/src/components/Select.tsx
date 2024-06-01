import ReactSelect, { components, MultiValueRemoveProps } from "react-select";
import React, { useMemo, useState } from "react";
import { cloneDeep, merge } from "lodash";

export const Select = (props) => {
  const [focused, setFocused] = useState(false);

  const merged = useMemo(() => {
    return merge(cloneDeep(props), {
      isMulti: true,
      onFocus: (e) => {
        setFocused(true);
      },
      onBlur: (e) => {
        setFocused(false);
      },
      styles: {
        control: (styles) => ({
          ...styles,
          border: "none",
          boxShadow: "none",
        }),
        multiValue: (base) => ({
          ...base,
          borderRadius: "14px",
          fontSize: "18px",
          padding: "0 2px",
          overflow: "hidden",
        }),
        multiValueLabel: (base) => ({
          ...base,
          padding: "1px 4px",
        }),
        multiValueRemove: (base) => ({
          ...base,
          color: "#aaa",
          "&:hover": {
            backgroundColor: "transparent",
            color: "#bbb",
          },
        }),
      },
      components: {
        DropdownIndicator: () => null,
        IndicatorSeparator: () => null,
        ClearIndicator: () => null,
        MultiValue: (props) => {
          return (
            <components.MultiValue {...props}>
              {props.children}
            </components.MultiValue>
          );
        },
        MultiValueRemove: (props: MultiValueRemoveProps<any>) => {
          return (
            <div className={"multi-value-remove"}>
              <components.MultiValueRemove
                {...props}
              ></components.MultiValueRemove>
            </div>
          );
        },
        MultiValueLabel: (props) => {
          return (
            <div className={"multi-value-label"}>
              <components.MultiValueLabel {...props}>
                {props.children}
              </components.MultiValueLabel>
            </div>
          );
        },
      },
    });
  }, [props]);

  return (
    <ReactSelect className={focused ? "select-focused" : ""} {...merged} />
  );
};
