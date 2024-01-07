import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, ChakraProvider } from "@chakra-ui/react";
import { TrBus } from "../core/TrBus";
import {
  Carbon,
  EventsOut,
  Transaction,
  addClass,
  removeClass,
  State
} from "@emrgen/carbon-core";
import { CarbonApp } from "@emrgen/carbon-utils";
import { BlockMenu, PorterOverlay } from "@emrgen/fastype-utils";

const blinkClass = "fastype-cursor--blinking";
const focusClass = "fastype-cursor--focused";

interface CustomCursorProps {
  app: Carbon;
}

export const FastypeCursor = (props: CustomCursorProps) => {
  const { app } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [bound, setBound] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const updateCursorPosition = useCallback(() => {
      const { head } = app.selection.bounds(app.store);
      if (!head) return;
      const { x, y, width, height } = head;
      setBound((style) => {
        return {
          ...style,
          left: x - 1,
          top: y,
          height: height,
        };
      });
    }, [app, setBound]);

  useEffect(() => {
    const timeouts: any[] = [];
    const onChange = (state: State) => {
      if (!ref.current) return;
      const cursor = ref.current;
      if (state.blockSelection.isActive) {
        addClass(cursor, `hidden`);
        return
      } else {
        removeClass(cursor, `hidden`);
      }

      // if (!tr.updatesSelection) return
      updateCursorPosition();

      removeClass(cursor, blinkClass);
      while (timeouts.length) {
        clearTimeout(timeouts.pop());
      }

      const timeout = setTimeout(() => {
        if (app.selection.isCollapsed) {
          addClass(cursor, blinkClass);
        }
      }, 200);
      timeouts.push(timeout);
    };

    app.on(EventsOut.transaction, onChange);
    app.on(EventsOut.selectionUpdated, onChange);
    return () => {
      app.off(EventsOut.transaction, onChange);
      app.off(EventsOut.selectionUpdated, onChange);
    };
  }, [app, ref, updateCursorPosition]);

  useEffect(() => {
    const cursor = ref.current;
    if (!cursor) return;

    const onBlur = () => {
      removeClass(cursor, `${blinkClass} ${focusClass}`);
    };

    const onFocus = () => {
      if (app.selection.isCollapsed) {
        addClass(cursor, `${blinkClass} ${focusClass}`);
      } else {
        addClass(cursor, `${focusClass}`);
      }
      removeClass(cursor, `hidden`);
    };

    const onHideCursor = () => {
      addClass(cursor, `hidden`);
    }

    const onShowCursor = () => {
      setTimeout(() => {
        removeClass(cursor, `hidden`);
      }, 100);
    };

    app.on("document:blur", onBlur);
    app.on("document:focus", onFocus);
    app.on("document:cursor:hide", onHideCursor);
    app.on("document:cursor:show", onShowCursor);
    return () => {
      app.off("document:blur", onBlur);
      app.off("document:focus", onFocus);
      app.off("document:cursor:hide", onHideCursor);
      app.off("document:cursor:show", onShowCursor);
    };
  }, [app, ref]);

  useEffect(() => {
    const onScroll = (e) => {
      updateCursorPosition();
    };

    app.on("scroll", onScroll);
    window.addEventListener("resize", updateCursorPosition);
    return () => {
      app.off("scroll", onScroll);
      window.removeEventListener("resize", updateCursorPosition);
    };
  }, [app, updateCursorPosition]);

  return (
    <Box
      ref={ref}
      className={`fastype-cursor ${blinkClass} ${focusClass}`}
      style={{
        top: bound.top,
        left: bound.left,
        height: bound.height,
      }}
    />
  );
};
