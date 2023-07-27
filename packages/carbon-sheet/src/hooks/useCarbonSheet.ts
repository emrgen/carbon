import { RefObject, useEffect, useState } from 'react';
import { CarbonSheet } from '../core/CarbonSheet';
import { Application } from 'pixi.js';
import { SheetData } from '../core';
import { SheetRenderer } from '../core/SheetRenderer';
import { SheetView } from '../core/SheetView';

interface UseCarbonSheetProps {
  app: Application;
  ref: RefObject<any>;
}

export const useCarbonSheet = (props: UseCarbonSheetProps) => {
  const { app, ref } = props;

  const [sheet] = useState(() => {
    console.log('creating sheet');
    const data = new SheetData();
    const renderer = new SheetRenderer(app);
    const view = new SheetView(data, renderer);
    return new CarbonSheet(data, view);
  });

  useEffect(() => {
    if (ref.current) {
      const { offsetHeight: height, offsetWidth: width } = ref.current;
      sheet.size.set(width, height);
    }
  }, [ref, sheet.size]);


  return sheet;
};
