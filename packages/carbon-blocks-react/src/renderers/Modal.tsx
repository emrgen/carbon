
import {
  CarbonBlock,
  CarbonChildren,
  CarbonNode,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps
} from "@emrgen/carbon-react";
import {Children} from "react";
import {prevent, preventAndStop, stop} from "@emrgen/carbon-core";

interface IModal {
}

export const Modal = (props: RendererProps) => {
  const {node} = props;

  const header = node.links['header'];
  const footer = node.links['footer'];

  return (
    <IsolatedNode>
      <CarbonBlock {...props}>
        <div className="modal">
          {header && <div className="modal__header" contentEditable={'false'} suppressContentEditableWarning={true} onMouseDown={stop}>
            <h3 className="modal__title">
              <CarbonNode node={header}/>
            </h3>
          </div>}
          <div className="modal__content">
            <CarbonChildren {...props}/>
          </div>
          {footer && <div className="modal__footer" contentEditable={'false'} suppressContentEditableWarning={true} onMouseDown={stop}>
            <CarbonNode node={footer}/>
          </div>}
        </div>
      </CarbonBlock>
    </IsolatedNode>
  );
};

const IsolatedNode = (props) => {
  return (
    <div contentEditable={'false'} suppressContentEditableWarning={true} onMouseDown={stop}>
      {props.children}
    </div>
  )
}


