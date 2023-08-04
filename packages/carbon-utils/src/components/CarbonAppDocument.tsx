import { Carbon, CarbonOverlayContext } from "@emrgen/carbon-core";
import { useEffect } from "react";
import { RecoilRoot } from "recoil";

import {
  CarbonChangeContext,
  CarbonContent,
  CarbonContext,
  CarbonEvents,
} from "@emrgen/carbon-core";
import { DndContext, RectSelectContext } from "@emrgen/carbon-dragon";

interface CarbonAppDocumentProps {
  app: Carbon;
}

export function CarbonAppDocument(props: CarbonAppDocumentProps) {
  const { app } = props;
  // @ts-ignore
  window.app = app;
  // console.log(app.content)

  useEffect(() => {
    app.focus();
    app.emit("app:mounted");
  }, [app]);

  return (
    <CarbonContext app={app}>
      <CarbonOverlayContext>
        <DndContext>
          <RecoilRoot>
            <CarbonEvents>
              <CarbonChangeContext>
                <RectSelectContext>
                  {/* <BlockMenu /> */}
                  <CarbonContent />
                </RectSelectContext>
              </CarbonChangeContext>
            </CarbonEvents>
          </RecoilRoot>
        </DndContext>
      </CarbonOverlayContext>
    </CarbonContext>
  );
}
