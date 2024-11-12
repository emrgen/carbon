import { Text } from "@chakra-ui/react";
import { ShowContextMenuEvent } from "@emrgen/carbon-blocks";
import { domRect } from "@emrgen/carbon-dragon";
import { useCarbon, useCarbonOverlay } from "@emrgen/carbon-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BsTrash3 } from "react-icons/bs";
import { ContextMenu } from "./ContextMenu/ContextMenu";
import { ContextMenuGroup } from "./ContextMenu/ContextMenuGroup";
import { ContextMenuItem } from "./ContextMenu/ContextMenuItem";
import { ContextMenuContext } from "./ContextMenu/useContextMenu";

const injectId = (item) => {
  return {
    ...item,
    id: randomId(),
    items: item?.items?.map(injectId),
  };
};

const randomId = () => {
  return Math.random().toString(36).substring(7);
};

const menu = injectId({
  type: "menu",
  placement: "left-start",
  items: [
    {
      type: "group",
      items: [
        {
          type: "option",
          label: "Delete",
          icon: <BsTrash3 />,
          onClick: () => {
            console.log("delete");
          },
        },
      ],
    },
    {
      type: "group",
      items: [
        {
          type: "option",
          label: "123",
          onClick: () => {
            console.log("123");
          },
        },
        {
          type: "option",
          label: "123",
          onClick: () => {
            console.log("123");
          },
        },
      ],
    },
    {
      type: "group",
      items: [
        {
          type: "option",
          label: "123",
          onClick: () => {
            console.log("123");
          },
        },
        {
          type: "option",
          label: "123",
          onClick: () => {
            console.log("123");
          },
        },
      ],
    },
  ],
});

export const BlockContextMenu = () => {
  const app = useCarbon();
  const {
    overlay,
    showOverlay,
    hideOverlay,
    ref: overlayRef,
  } = useCarbonOverlay();
  const [show, setShow] = useState(false);
  const [anchorPosition, setAnchorPosition] = useState({ x: 0, y: 0 });
  const [style, setStyle] = useState({});
  const [blockRef, setBlockRef] = useState<HTMLElement | null>(null);

  // hide overlay on click outside the block context menu
  useEffect(() => {
    const onClickOverlay = (e: MouseEvent) => {
      setShow(false);
    };

    overlay.on("click", onClickOverlay);
    return () => {
      overlay.off("click", onClickOverlay);
    };
  }, [hideOverlay, overlay]);

  useEffect(() => {
    const showContextMenu = (e: ShowContextMenuEvent) => {
      const { node, event } = e;
      e.event.preventDefault();
      const el = app.store.element(node.id);
      if (!el) return;
      setBlockRef(el);

      const rect = domRect(el);
      showOverlay();
      setAnchorPosition({
        x: rect.left,
        y: rect.top,
      });
      setStyle({
        top: rect.top,
        left: rect.left - 10,
        transform: `translateX(-100%)`,
      });
      // get the
      setShow(true);
    };

    app.on("show:context:menu", showContextMenu);
    return () => {
      app.off("show:context:menu", showContextMenu);
    };
  }, [app, showOverlay]);

  const contextMenu = useMemo(() => {
    return (
      <ContextMenuContext>
        <ContextMenuNode show={show} blockRef={blockRef} item={menu} />
      </ContextMenuContext>
    );
  }, [blockRef, show]);

  return <>{createPortal(<>{contextMenu}</>, document.body)}</>;
};

interface ContextMenuNodeProps {
  show?: boolean;
  blockRef: HTMLElement | null;
  item: any;
}

const ContextMenuNode = (props: ContextMenuNodeProps) => {
  const { show, blockRef, item } = props;
  const { type } = item;

  if (type === "menu") {
    return (
      <ContextMenu
        isOpen={show}
        placementRef={blockRef}
        placement={item.placement}
      >
        {item.items.map((item) => {
          return <ContextMenuNode key={item.id} item={item} blockRef={null} />;
        })}
      </ContextMenu>
    );
  }

  if (type === "group") {
    return (
      <ContextMenuGroup>
        {item.items.map((item) => {
          return <ContextMenuNode key={item.id} item={item} blockRef={null} />;
        })}
      </ContextMenuGroup>
    );
  }

  if (type === "option") {
    return (
      <ContextMenuItem item={item}>
        <Text>{item.label}</Text>
      </ContextMenuItem>
    );
  }

  return null;
};
