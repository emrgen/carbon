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
import { CloseDocument } from "./CloseDocument";
import { NodeIdSet } from '../BSet';

export class OpenDocument implements CarbonAction {
    id = generateActionId();
    type = ActionType.openDocument;

    constructor(readonly nodeIds: NodeId[], readonly origin: ActionOrigin = ActionOrigin.UserInput) {
    }

    static fromIds(nodeIds: NodeId[], origin) {
        return new OpenDocument(nodeIds, origin);
    }

    static create(nodeId: NodeId, origin) {
        return new OpenDocument([nodeId], origin);
    }

    execute(tr: Transaction) {
        const { nodeIds } = this;
        const { app } = tr;
        const { store, state } = app;

        const { openNodeIds } = state;
        const beforeOpenedNodes = openNodeIds.map(id => store.get(id)) as Node[];
        const afterOpenedNodes = this.nodeIds.map(id => store.get(id)) as Node[];

        beforeOpenedNodes.filter(n => n.isOpen).forEach(n => {
            n.updateState({ opened: false });
        });
        afterOpenedNodes.forEach(n => {
            n.updateState({ opened: true });
        });

        tr.opened(...beforeOpenedNodes);
        tr.opened(...afterOpenedNodes);


        return NULL_ACTION_RESULT;
    }

    inverse() {
        const { nodeIds } = this;
        return CloseDocument.fromIds(nodeIds, ActionOrigin.UserInput);
    }

    toString() {
        return classString(this)(this.nodeIds.map(n => n.toString()));
    }

    toJSON() {
        throw new Error("Method not implemented.");
    }
}
