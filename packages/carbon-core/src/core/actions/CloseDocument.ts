import { NodeId } from "../NodeId";
import { Transaction } from "../Transaction";
import { ActionResult, NULL_ACTION_RESULT } from "./Result";
import { CarbonAction, ActionOrigin, ActionType } from "./types";
import { Point } from '../Point';
import { generateActionId } from './utils';
import { classString } from "../Logger";
import { Node } from "../Node";
import { NodeData } from "../NodeData";
import { Optional } from '@emrgen/types';
import { OpenDocument } from "./OpenDocument";

export class CloseDocument implements CarbonAction {
    id = generateActionId();
    type = ActionType.openDocument;

    prevData: Optional<NodeData>;

    constructor(readonly nodeIds: NodeId[], readonly origin: ActionOrigin = ActionOrigin.UserInput) {

    }

    static fromIds(nodeIds: NodeId[], origin) {
        return new CloseDocument(nodeIds, origin);
    }

    static create(docId, origin) {
        return new CloseDocument([docId], origin);
    }

    execute(tr: Transaction) {
        const { nodeIds } = this;
        const { app } = tr;
        const { store, state } = app;

        const { openNodeIds } = state;
        const beforeOpenedNodes = openNodeIds.map(id => store.get(id)) as Node[];
        const afterOpenedNodes = nodeIds.map(id => store.get(id)) as Node[];

        beforeOpenedNodes.filter(n => n.isOpen).forEach(n => {
            n.updateState({ opened: false });
        });
        afterOpenedNodes.forEach(n => {
            n.updateState({ opened: false });
        });

        tr.opened(...beforeOpenedNodes);
        tr.opened(...afterOpenedNodes);


        return NULL_ACTION_RESULT;
    }

    inverse() {
        const { nodeIds } = this;
        return OpenDocument.fromIds(nodeIds, ActionOrigin.UserInput);
    }

    toString() {
        return classString(this)(this.nodeIds.map(n => n.toString()));
    }

    toJSON() {
        throw new Error("Method not implemented.");
    }
}
