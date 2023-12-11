import { Carbon, CarbonOverlayContext, preventAndStop } from "@emrgen/carbon-core";
import { useEffect, useRef } from "react";
import { RecoilRoot } from "recoil";

import {
  CarbonChangeContext,
  CarbonContent,
  CarbonContext,
  CarbonEvents,
} from "@emrgen/carbon-core";
import { DndContext, RectSelectContext } from "@emrgen/carbon-dragon";

interface CarbonAppProps {
  app: Carbon;
  children?: React.ReactNode;
}

export function CarbonApp(props: CarbonAppProps) {
  const { app, children } = props;
  // @ts-ignore
  window.app = app;
  // console.log(app.content)
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    app.focus();
    app.mounted()
  }, [app]);

  useEffect(() => {
    if (ref.current) {
      app.setCursorRest(ref.current);
    }
  }, [app, ref]);

  return (
    <CarbonContext app={app}>
      <CarbonOverlayContext>
        <DndContext>
          <RecoilRoot>
            <CarbonEvents>
              <div
                ref={ref}
                className="carbon-app-cursor-rest"
                contentEditable={true}
                suppressContentEditableWarning
                // onKeyDown={preventAndStop}
                // onKeyUp={preventAndStop}
              ></div>
              <CarbonChangeContext>
                <RectSelectContext>
                  <CarbonContent />
                  {children}
                </RectSelectContext>
              </CarbonChangeContext>
            </CarbonEvents>
          </RecoilRoot>
        </DndContext>
      </CarbonOverlayContext>
    </CarbonContext>
  );
}
