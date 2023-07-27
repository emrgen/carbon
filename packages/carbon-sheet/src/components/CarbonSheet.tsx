import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePixiApp } from "../hooks/usePixiApp";
import { useCarbonSheet } from "../hooks/useCarbonSheet";

const HEIGHT_CHANGE_STEP = 1000;
const WIDTH_CHANGE_STEP = 20;

export function CarbonSheet() {
  const ref = useRef<HTMLDivElement>(null);
  const app = usePixiApp({ ref });
  const sheet = useCarbonSheet({app, ref});

  useEffect(() => {
    const onResize = () => {
      // const { width, height } = sheet;
      // setWidth(width);
      // setHeight(height);
    };

    sheet.on("resize", onResize);

    return () => {
      sheet.off("resize", onResize);
    };
  }, [sheet]);

  const [width, setWidth] = useState(2000);
  const [height, setHeight] = useState(2000);

  const handleOnScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const {
        scrollTop,
        scrollLeft,
        scrollHeight,
        scrollWidth,
        clientHeight,
        clientWidth,
      } = e.currentTarget;
      const scrollLeftRatio = scrollLeft / (scrollWidth - clientWidth);
      const scrollTopRatio = scrollTop / (scrollHeight - clientHeight);

      // console.log(scrollTopRatio);

      if (scrollTopRatio >= 0.96) {
        setHeight((prev) => prev + HEIGHT_CHANGE_STEP);
      }

      if (scrollLeftRatio >= 0.96) {
        setWidth((prev) => prev + WIDTH_CHANGE_STEP);
      }

      sheet.position.set(-scrollTop, -scrollLeft);
      sheet.render();
    },
    [sheet]
  );

  // render of the sheet after the canvas is mounted
  useEffect(() => {
    if (ref.current) {
      sheet.render()
    }
  }, [ref, sheet])

  return (
    <div className="carbon-sheet">
      <div className="carbon-sheet-canvas" ref={ref}>
        <div className="carbon-sheet-left-top-cell" />
      </div>
      <div className="carbon-sheet-viewport" onScroll={handleOnScroll}>
        <div className="carbon-sheet-size" style={{ width, height }} />
      </div>
    </div>
  );
}
