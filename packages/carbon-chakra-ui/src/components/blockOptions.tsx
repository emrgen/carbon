import { Square } from "@chakra-ui/react";
import { BiColorFill, BiLink } from "react-icons/bi";
import { BsTrash3 } from "react-icons/bs";
import { RxCopy } from "react-icons/rx";
import { TbBrandCarbon, TbStatusChange } from "react-icons/tb";

const injectId = (item, depth = 0) => {
  return {
    ...item,
    id: randomId(),
    depth: depth,
    items: item?.items?.map((n) => injectId(n, depth + 1)),
  };
};

const randomId = () => {
  return Math.random().toString(36).substring(7);
};

enum BlockOption {
  Delete = "Delete",
  Duplicate = "Duplicate",
  Copy = "Copy",
  Change = "Change",
  Color = "Color",
}

const defaultBackground = {
  name: "Default",
  value: "white",
};

const defaultTextColor = {
  name: "Default",
  value: "black",
};

const colors = [
  {
    name: "Ivory",
    value: "#FBF4DB",
  },
  {
    name: "Yellow",
    value: "#ffce26",
  },
  {
    name: "Orange",
    value: "orange",
  },
  {
    name: "Red",
    value: "#FF4545",
  },
  {
    name: "Purple",
    value: "#AA5486",
  },
];

export const blockMenu = injectId({
  type: "menu",
  placement: "left-start",
  items: [
    {
      type: "group",
      items: [
        {
          type: "search",
          onClick: () => {
            console.log("Delete");
          },
        },
      ],
    },
    {
      type: "group",
      items: [
        {
          type: "option",
          label: "Delete",
          icon: <BsTrash3 />,
          shortcut: "Del",
          style: {
            _hover: {
              color: "red.500",
            },
          },
          onClick: () => {
            console.log("Delete");
          },
        },
        {
          type: "option",
          label: "Duplicate",
          icon: <RxCopy />,
          style: {
            _hover: {},
          },
          onClick: () => {
            console.log("Duplicate");
          },
        },
        {
          type: "option",
          label: "Change",
          icon: <TbStatusChange />,
          style: {
            _hover: {},
          },
          onClick: () => {
            console.log("Change");
          },
        },
      ],
    },
    {
      type: "group",
      items: [
        {
          type: "option",
          label: "Copy link",
          icon: <BiLink />,
          shortcut: "Alt+Shift+L",
          style: {
            _hover: {},
          },
          onClick: () => {
            console.log("Copy");
          },
        },
      ],
    },
    {
      type: "group",
      items: [
        {
          type: "option",
          label: "Color",
          icon: <BiColorFill />,
          items: [
            {
              type: "group",
              label: "Text Color",
              items: ([defaultTextColor, ...colors] as any).map((color) => {
                return {
                  type: "option",
                  label: `${color.name} Text`,
                  icon: <TbBrandCarbon color={color.value} fontSize={"20px"} />,
                  style: {
                    _hover: {},
                  },
                  onClick: () => {
                    console.log("Red");
                  },
                };
              }),
            },
            {
              type: "group",
              label: "Background Color",
              items: ([defaultBackground, ...colors] as any).map((color) => {
                return {
                  type: "option",
                  label: `${color.name} Background`,
                  icon: (
                    <Square
                      size={5}
                      bg={color.value}
                      borderRadius={3}
                      border={"1px solid #eee"}
                    />
                  ),
                  style: {
                    _hover: {},
                  },
                  onClick: () => {
                    console.log("Red");
                  },
                };
              }),
            },
          ],
        },
      ],
    },
  ],
});
