import { domRect, ElementRect } from "@emrgen/carbon-dragon";
import { RefObject, useEffect, useLayoutEffect, useState } from "react";

export type UseDimensionsHook = ElementRect | null;

export function useDimensions(
  ref: RefObject<HTMLElement>,
  liveMeasure = true,
): UseDimensionsHook {
  const [dimensions, setDimensions] = useState<ElementRect | null>(null);
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
