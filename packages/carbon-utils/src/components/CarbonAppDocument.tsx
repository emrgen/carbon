import { Carbon } from "@emrgen/carbon-core";
import { useEffect } from "react";
import { RecoilRoot } from "recoil";

import {
  CarbonChangeContext,
  CarbonContent,
  CarbonContext,
  CarbonEvents,
} from "@emrgen/carbon-core";
import { DndContext, RectSelectContext } from "@emrgen/carbon-dragon";
import { BlockMenu } from "./BlockMenu";

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
  }, [app]);

  return (
    <CarbonContext app={app}>
      <RecoilRoot>
        <CarbonEvents>
          <CarbonChangeContext>
            <DndContext>
              <RectSelectContext>
                {/* <BlockMenu /> */}
                <CarbonContent />
              </RectSelectContext>
            </DndContext>
          </CarbonChangeContext>
        </CarbonEvents>
      </RecoilRoot>
    </CarbonContext>
  );
}
