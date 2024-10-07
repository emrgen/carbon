import { useState } from "react";
import { memo } from "react";
import { useEffect } from "react";
import { range } from "lodash";
import { Stack } from "@chakra-ui/react";
import { Heading } from "@chakra-ui/react";
import { Box } from "@chakra-ui/react";
import { EventEmitter } from "events";

const randomString = () => Math.random().toString(36).substring(7);
const app = {
  key: randomString(),
  bus: new EventEmitter(),
  groups: range(5).map(() => ({
    key: randomString(),
    id: randomString(),
    children: range(5).map(() => {
      return {
        key: randomString(),
        id: randomString(),
        label: randomString(),
      };
    }),
  })),
};

export const Grouped = () => {
  const [state, setState] = useState();

  useEffect(() => {
    const interval = setInterval(() => {
      const index = Math.floor(Math.random() * app.groups.length);
      const key = randomString();
      const children = range(5);
      const group = app.groups[index];
      console.log(index);
      const groups = [
        ...app.groups.slice(0, index),
        { key, children, id: group.id },
        ...app.groups.slice(index + 1),
      ];

      const timeout = setTimeout(() => {
        app.bus.emit("update:group", group.id);
        clearTimeout(timeout);
      }, 30);

      return {
        key: app.key,
        groups,
      };
    }, 5050);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const index = Math.floor(Math.random() * app.groups.length);
      const key = randomString();
      const children = range(5);
      const group = app.groups[index];

      const itemIndex = Math.floor(Math.random() * group.children.length);
      const item = group.children[itemIndex];

      const newGroup = {
        ...group,
        key: randomString(),
        children: [
          ...group.children.slice(0, itemIndex),
          { key: randomString(), id: item.id, label: randomString() },
          ...group.children.slice(itemIndex + 1),
        ],
      };

      const groups = [
        ...app.groups.slice(0, index),
        newGroup,
        ...app.groups.slice(index + 1),
      ];

      const timeout = setTimeout(() => {
        app.bus.emit("update:item", item.id);
        clearTimeout(timeout);
      }, 30);

      return {
        key: app.key,
        groups,
      };
    }, 400);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div>
      <h1>Grouped</h1>
      <Stack px={6}>
        <GroupOfGroupsMemo groups={app} />
      </Stack>
    </div>
  );
};

const GroupOfGroups = ({ groups }) => {
  return (
    <Stack spacing={1}>
      {groups.groups.map((group) => (
        <GroupedItemsMemo group={group} app={app} key={group.key} />
      ))}
    </Stack>
  );
};

const GroupOfGroupsMemo = memo(GroupOfGroups, (prev, next) => {
  console.log("GroupOfGroupsMemo", prev, next);
  return prev.groups.key === next.groups.key;
});

const GroupedItems = ({ group, app }) => {
  const [, setUpdateCount] = useState(0);
  useEffect(() => {
    const listener = (id) => {
      if (id === group.id) {
        console.log("update:group");
        setUpdateCount((count) => count + 1);
      }
    };
    app.bus.on("update:group", listener);
    return () => {
      app.bus.off("update:group", listener);
    };
  }, [app, group]);

  return (
    <>
      <Heading size={"sm"}>{group.id}</Heading>
      {group.children.map((child: any) => (
        <Item key={child.key} item={child} app={app} />
      ))}
    </>
  );
};

export const Item = ({ item, app }) => {
  const [, setUpdateCount] = useState(0);
  useEffect(() => {
    const listener = (id) => {
      if (id === item.id) {
        console.log("update:item");
        setUpdateCount((count) => count + 1);
      }
    };
    app.bus.on("update:item", listener);
    return () => {
      app.bus.off("update:item", listener);
    };
  }, [app, item]);
  return <Box pl={10}>{item.label}</Box>;
};

const ItemMemo = memo(Item, (prev, next) => {
  return prev.item.key === next.item.key;
});

const GroupedItemsMemo = memo(GroupedItems);
