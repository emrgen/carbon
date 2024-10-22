import Select, {ActionMeta, IndicatorSeparatorProps, OnChangeValue} from "react-select";

interface SelectOption {
  label: string;
  value: unknown;
}

interface SelectFilterProps {
  options?: SelectOption[];
  value?: SelectOption;
  defaultValue?: SelectOption | null;
  isDisabled?: boolean;
  onChange?: (value: OnChangeValue<SelectOption, boolean>, actionMeta: ActionMeta<SelectOption>) => void;
}

export const SimpleSelect = (props: SelectFilterProps) => {
  const { options = [], value, ...rest } = props;

  const onChange = (value: OnChangeValue<SelectOption, boolean>, actionMeta: ActionMeta<SelectOption>) => {
    props.onChange?.(value, actionMeta);
  };

  const height = "24px";

  return (
    <Select
      // isDisabled={true}
      // placeholder={""}
      // isLoading={true}
      components={{ IndicatorSeparator, DropdownIndicator }}
      styles={{
        container: (provided) => ({
          ...provided,
          // display: "flex",
          padding: "0px",
          // minWidth: 100,
          fontSize: 12,
          // w: '100%'
        }),

        control: (provided) => ({
          ...provided,
          boxShadow: "none",
          border: "none",
          // fontSize: 12,
          borderColor: "#9e9e9e",
          minHeight: height,
          height: height,
          // lineHeight: height,
          padding: "0px",
          maxWidth: 180,
        }),

        valueContainer: (provided) => ({
          ...provided,
          height: height,
          paddingRight: 3,
        }),

        input: (provided) => ({
          ...provided,
          margin: "0px",
        }),
        indicatorSeparator: () => ({
          display: "none",
        }),
        indicatorsContainer: (provided) => ({
          ...provided,
          height: height,
        }),
        menu: (provided) => ({
          ...provided,
          fontSize: 12,
          minWidth: 100,
        }),

        option: (provided, state) => ({
          ...provided,
          height: height,
          padding: "0px 8px",
          lineHeight: height,
          backgroundColor: state.isSelected ? "#eee" : "transparent",
          color: state.isSelected ? "black" : "black",
          "&:active": {
            background: "#f5f5f5",
          },
          "&:hover": {
            background: "#f5f5f5",
          },
          "&:focus": {
            background: "#f5f5f5",
          },
        }),
      }}
      options={options}
      value={options.find((option) => option?.label === value?.label)}
      onChange={onChange}
      {...rest}
    />
  );
};

const indicatorSeparatorStyle = {
  alignSelf: "stretch",
  marginBottom: 8,
  marginTop: 8,
  width: 1,
};

const IndicatorSeparator = ({ innerProps }: IndicatorSeparatorProps<SelectOption>) => {
  return <span style={indicatorSeparatorStyle} {...innerProps} />;
};

const DropdownIndicator = () => {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ marginTop: 2, marginRight: 8 }}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"
        fill="currentColor"
      ></path>
    </svg>
  );
};
