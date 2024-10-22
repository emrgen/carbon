import Select, {ActionMeta, OnChangeValue} from "react-select";
import React, {ReactNode} from "react";
import {Square, Stack} from "@chakra-ui/react";
import {CgChevronDown} from "react-icons/cg";

export interface SelectOption<T = unknown> {
  label: string;
  value: T
  key?: string | number;
  data?: any;
}

interface SelectFilterProps {
  isMulti?: boolean;
  options?: SelectOption[];
  value?: SelectOption;
  defaultValue?: SelectOption | null;
  isDisabled?: boolean;
  onChange?: (value: OnChangeValue<SelectOption, boolean>, actionMeta: ActionMeta<SelectOption>) => void;
  placeholder?: string | ReactNode;
  size?: 'sm' | 'md' | 'lg';
  isClearable?: boolean;
  menuPortalTarget?: HTMLElement;
}

export const selectOptionKey = (option: SelectOption) => option.key ?? option.label;
export const isOptionSelected = (option?: SelectOption | null, value?: SelectOption | null) => {
  if (!option || !value) {
    return false;
  }
  return selectOptionKey(option) === selectOptionKey(value);
}

const DropdownIndicator = () => {
  return (
    <Stack justifyContent={'center'} alignItems={'center'} h={'full'} px={1.5}>
      <Square size={5} fontSize={'sm'}>
        <CgChevronDown/>
      </Square>
    </Stack>
  )
}

export const ReactSelect = (props: SelectFilterProps) => {
  const {options = [], value, size = 'sm', ...rest} = props;
  const height = size === 'sm' ? '30px' : '32px';

  return (
    <Select
      options={options}
      value={value}
      {...rest}
      components={{DropdownIndicator}}
      styles={{
        container: (provided) => ({
          ...provided,
          height: height,
          minHeight: height,
        }),

        control: (provided, state) => ({
          ...provided,
          boxShadow: state.isFocused ? "0 0 0 1px #555" : "none",
          border: state.isFocused ? "1px solid #555" : "1px solid #eee",
          padding: 0,
          height: height,
          minHeight: height,
          '&:hover': {
            borderColor: state.isFocused ? "#555" : "#ddd",
          },
        }),
        valueContainer: (provided, state) => ({
          ...provided,
          height: height,
          padding: '0 6px',
          top: -1
        }),
        input: (provided, state) => ({
          ...provided,
          margin: '0px',
        }),
        indicatorSeparator: state => ({
          display: 'none',
        }),
        indicatorsContainer: (provided, state) => ({
          ...provided,
          height: height,
        }),
      }}
    />
  )
}