import {ActionMeta, components, MultiValueGenericProps, OnChangeValue} from "react-select";
import CreatableSelect from 'react-select/creatable';
import {Tooltip} from "@chakra-ui/react";
import React from "react";

export interface SelectOption {
  label: string;
  key?: string | number;
  value: unknown;
}

interface SelectFilterProps {
  isMulti?: boolean;
  options?: SelectOption[];
  value?: SelectOption;
  defaultValue?: SelectOption | null;
  isDisabled?: boolean;
  onChange?: (value: OnChangeValue<SelectOption, boolean>, actionMeta: ActionMeta<SelectOption>) => void;
  onCreateOption?: (inputValue: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const selectOptionKey = (option: SelectOption) => option.key ?? option.label;
export const isOptionSelected = (option?: SelectOption | null, value?: SelectOption | null) => {
  if (!option || !value) {
    return false;
  }
  return selectOptionKey(option) === selectOptionKey(value);
}

export const ReactCreatableSelect = (props: SelectFilterProps) => {
  const {options = [], value, size = 'sm', ...rest} = props;
  const height = size === 'sm' ? '30px' : '32px';
  const valueHeight = size === 'sm' ? '22px' : '30px';

  const MultiValueContainer = (props: MultiValueGenericProps<any>) => {
    return (
      <Tooltip label={'Customise your multi-value container!'}>
        <components.MultiValueContainer {...props} />
      </Tooltip>
    );
  };

  return (
    <CreatableSelect
      options={options}
      value={value}
      components={{MultiValueContainer}}
      {...rest}
      styles={{
        container: (provided) => ({
          ...provided,
          height: height,
          minHeight: height,
        }),
        multiValue: (provided) => ({
          ...provided,
          height: valueHeight,
          minHeight: valueHeight,
          borderRadius: '4px',
          lineHeight: '1.2',
          // backgroundColor: '#f1f1f1',
          // color: '#333',
          // padding: '0 6px',
          // fontSize: '0.8rem',
          // marginRight: '4px',
        }),
        // multiValueLabel: (provided) => ({
        //   ...provided,
        //   padding: '0',
        //   margin: '0',
        // }),

        control: (provided, state) => ({
          ...provided,
          boxShadow: state.isFocused ? "0 0 0 1px #555" : "none",
          border: state.isFocused ? "1px solid #555" : "1px solid #ddd",
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
      }}/>
  )

}