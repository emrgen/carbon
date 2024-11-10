import { domRect, elementBound } from "@emrgen/carbon-dragon";
import { useState, useCallback, useLayoutEffect, Ref, RefObject, useEffect } from "react";
export interface DimensionObject {
  width: number;
  height: number;
  top: number;
  left: number;
  x: number;
  y: number;
  right: number;
  bottom: number;
}

export type UseDimensionsHook = {} | DimensionObject

function getDimensionObject(node: HTMLElement): DimensionObject {
  const rect = node.getBoundingClientRect();

  return {
    width: rect.width,
    height: rect.height,
    top: rect.top,
    left: rect.left,
    x: rect.x,
    y: rect.y,
    right: rect.right,
    bottom: rect.bottom,
  };
}

export function useDimensions(
  ref: RefObject<HTMLElement>,
  liveMeasure = true,
): UseDimensionsHook {
  const [dimensions, setDimensions] = useState({});
  const [node, setNode] = useState<HTMLElement>(null!);

  useEffect(() => {
    if (ref.current) {
      setNode(ref.current);
    }
  }, [ref]);

  useLayoutEffect(() => {
    if (node) {
      const measure = () => {
        window.requestAnimationFrame(() => setDimensions(domRect(node)));
      };

      // initial measure
      measure();

      if (liveMeasure) {
        window.addEventListener("resize", measure);
        window.addEventListener("scroll", measure);

        return () => {
          window.removeEventListener("resize", measure);
          window.removeEventListener("scroll", measure);
        };
      }
    }
  }, [liveMeasure, node]);

  return dimensions;
}

