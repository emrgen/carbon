import { BiColorFill } from "react-icons/bi";
import { BsTrash3 } from "react-icons/bs";
import { RxCopy } from "react-icons/rx";
import { TbStatusChange } from "react-icons/tb";

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
          label: "Color",
          icon: <BiColorFill />,
          onClick: () => {
            console.log("color");
          },
        },
      ],
    },
  ],
});
