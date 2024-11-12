import { flattenDeep } from "lodash";

export const filterMenu = (menu, searchText: string) => {
  const { items } = menu;
  const [searchItem, ...rest] = items;

  const mapMenuItems = rest.map((item, index) => {
    return mapItem(item, searchText);
  });
  const filteredItems = flattenDeep(mapMenuItems).filter((item) => item);

  console.log(filteredItems);

  return {
    ...menu,
    items: [
      searchItem,
      {
        type: "group",
        items: filteredItems,
      },
    ],
  };
};

const mapItem = (item, searchText) => {
  const { type, items = [], label = "" } = item;
  console.log("mapItem", item, searchText);
  if (items.length) {
    return items.map((item) => {
      return mapItem(item, searchText);
    });
  }

  return label.toLowerCase().includes(searchText) ? item : null;
};