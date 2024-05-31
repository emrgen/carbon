import React, { useCallback, useEffect, useMemo, useState } from "react";
import Select from "react-select";

import { CarbonBlock, RendererProps } from "@emrgen/carbon-react";
import { stop } from "@emrgen/carbon-core";
import {
  AttrCreatedAtPath,
  AttrEmailPath,
  AttrMultiSelectedPath,
  AttrNamePath,
  AttrNumberPath,
  AttrPersonPath,
  AttrSelectedPath,
  AttrSelectOptionsPath,
  AttrStatusOptionsPath,
  AttrStatusPath,
  AttrTextPath,
  AttrTypePath,
} from "../constants";
import { debounce } from "lodash";
import dayjs from "dayjs";

export default function CarbonAttribute(props: RendererProps) {
  const { node } = props;
  const attr = useMemo(() => {
    const type = node.props.get(AttrTypePath, "");
    const name = node.props.get(AttrNamePath, "");
    return {
      type,
      name,
    };
  }, [node]);

  return (
    <CarbonBlock node={node}>
      <div className={"carbon-attribute-label"}>
        <CarbonAttrTypeIcon type={attr.type} />
        <div className="carbon-attribute-name">{attr.name}</div>
      </div>
      <div className="carbon-attribute-value-wrapper">
        <CarbonAttrValue node={node} />
      </div>
    </CarbonBlock>
  );
}

const CarbonAttrTypeIcon = (props: { type: string }) => {
  const icon = useMemo(() => {
    switch (props.type) {
      case "text":
        return "T";
      case "number":
        return "#";
      case "select":
        return "S";
      case "email":
        return "E";
      case "created-at":
        return "D";
      case "updated-at":
        return "D";
      case "status":
        return "S";
      case "person":
        return "P";
      case "multi-select":
        return "M";
      default:
        return "?";
    }
  }, [props.type]);
  return <div className="carbon-attribute-type">{icon}</div>;
};

const CarbonAttrValue = (props: RendererProps) => {
  const { node } = props;

  const value = useMemo(() => {
    const type = node.props.get<string>(AttrTypePath, "");
    switch (type) {
      case "text":
        return <TextAttrValue node={node} />;
      case "number":
        return <NumberAttrValue node={node} />;
      case "select":
        return <SelectAttrValue node={node} />;
      case "email":
        return <EmailAttrValue node={node} />;
      case "created-at":
        return <CreatedAtAttrValue node={node} />;
      case "updated-at":
        return <CreatedAtAttrValue node={node} />;
      case "status":
        return <StatusAttrValue node={node} />;
      case "person":
        return <PersonAttrValue node={node} />;
      case "multi-select":
        return <MultiSelectAttrValue node={node} />;
      default:
        return <DefaultAttrValue />;
    }
  }, [node]);

  return <div className="carbon-attribute-value">{value}</div>;
};

const MultiSelectAttrValue = (props: RendererProps) => {
  const { node } = props;
  const selected = node.props.get(AttrMultiSelectedPath, [] as string[]);
  const options = node.props.get(AttrSelectOptionsPath, [] as string[]);

  const handleChange = useCallback(
    debounce((value: string[]) => {
      console.log("change", value);
    }, 2000),
    [node],
  );

  return (
    <Select
      isMulti
      value={
        selected.map((value) => ({
          label: value,
          value,
        })) as any
      }
      options={options.map((option) => ({
        label: option,
        value: option,
      }))}
      onChange={(selected) => {
        // handleChange(selected.map((option) => option.value));
      }}
      styles={{
        control: (styles) => ({
          ...styles,
          border: "none",
          boxShadow: "none",
        }),
        multiValue: (base) => ({
          ...base,
          borderRadius: "6px",
          fontSize: "18px",
          overflow: "hidden",
        }),
      }}
      components={{
        DropdownIndicator: () => null,
        IndicatorSeparator: () => null,
        ClearIndicator: () => null,
      }}
    />
  );
};

const PersonAttrValue = (props: RendererProps) => {
  const { node } = props;
  const [value, setValue] = useState<string | undefined>(undefined);
  const text = node.props.get(AttrPersonPath, "");

  const handleChange = useCallback(
    debounce((value: string) => {
      console.log("change", value);
    }, 2000),
    [node],
  );

  return (
    <input
      type={"text"}
      value={value}
      onKeyDown={stop}
      onChange={(e) => {
        e.stopPropagation();
        setValue(e.target.value);
        handleChange(e.target.value);
      }}
    />
  );
};

const StatusAttrValue = (props: RendererProps) => {
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
      isMulti
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
      styles={{
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
      }}
      components={{
        DropdownIndicator: () => null,
        IndicatorSeparator: () => null,
        ClearIndicator: () => null,
      }}
    />
  );
};

const CreatedAtAttrValue = (props: RendererProps) => {
  const { node } = props;
  const time = node.props.get(AttrCreatedAtPath, "");

  return (
    <span className={"carbon-attribute-date-text"}>
      {dayjs(time).format("MMMM DD, YYYY hh:mm A")}
    </span>
  );
};

const EmailAttrValue = (props: RendererProps) => {
  const { node } = props;
  const [value, setValue] = useState<string>("");
  const email = node.props.get(AttrEmailPath, "");

  useEffect(() => {
    setValue(email);
  }, [email]);

  const handleChange = useCallback(
    debounce((value: string) => {
      console.log("change", value);
    }, 2000),
    [node],
  );

  return (
    <input
      type={"text"}
      value={value}
      onKeyDown={stop}
      onChange={(e) => {
        e.stopPropagation();
        setValue(e.target.value);
        handleChange(e.target.value);
      }}
    />
  );
};

const SelectAttrValue = (props: RendererProps) => {
  const { node } = props;
  const [value, setValue] = useState<string | undefined>(undefined);
  const text = node.props.get(AttrSelectedPath, "");
  const options = node.props.get(AttrSelectOptionsPath, [] as string[]);

  useEffect(() => {
    setValue(text);
  }, [text]);

  const handleChange = useCallback(
    debounce((value: string) => {
      console.log("change", value);
    }, 2000),
    [node],
  );

  return (
    <Select
      isMulti
      value={
        value
          ? {
              label: value,
              value: value,
            }
          : (undefined as any)
      }
      options={options.map((option) => ({
        label: option,
        value: option,
      }))}
      onChange={(selected) => {
        setValue(selected[0].value);
        // handleChange(selected.map((option) => option.value));
      }}
      styles={{
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
      }}
      components={{
        DropdownIndicator: () => null,
        IndicatorSeparator: () => null,
        ClearIndicator: () => null,
      }}
    />
  );
};

const NumberAttrValue = (props: RendererProps) => {
  const { node } = props;
  const [value, setValue] = useState<number>(0);
  const number = node.props.get(AttrNumberPath, "");

  useEffect(() => {
    setValue(Number(number));
  }, [number]);

  const handleChange = useCallback(
    debounce((value: number) => {
      console.log("change", value);
    }, 2000),
    [node],
  );

  return (
    <input
      type={"number"}
      value={value}
      onKeyDown={stop}
      onChange={(e) => {
        e.stopPropagation();
        setValue(Number(e.target.value));
        handleChange(Number(e.target.value));
      }}
    />
  );
};

const TextAttrValue = (props: RendererProps) => {
  const { node } = props;
  const [value, setValue] = useState("");
  const text = node.props.get(AttrTextPath, "");

  useEffect(() => {
    setValue(text);
  }, [text]);

  const handleChange = useCallback(
    debounce((value: string) => {
      console.log("change", value);
    }, 2000),
    [node],
  );

  return (
    <input
      type={"text"}
      value={value}
      onKeyDown={stop}
      onChange={(e) => {
        e.stopPropagation();
        setValue(e.target.value);
        handleChange(e.target.value);
      }}
    />
  );
};

const DefaultAttrValue = () => {
  return <div className="carbon-attribute-value">default</div>;
};
