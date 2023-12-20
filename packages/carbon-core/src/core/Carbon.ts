import { Optional } from "@emrgen/types";
import { Node } from "./Node";
import { EventEmitter } from "events";
import { querySelector } from "../utils/domElement";
import { State } from "./State";
import { ChangeManager } from "./ChangeManager";
import { EventsIn, EventsOut } from "./Event";
import { EventManager } from "./EventManager";
import { NodeStore } from "./NodeStore";
import { PinnedSelection } from "./PinnedSelection";
import { PluginManager } from "./PluginManager";
import { RenderManager } from "./Renderer";
import { Schema } from "./Schema";
import { SelectionManager } from "./SelectionManager";
import { Transaction } from "./Transaction";
import { TransactionManager } from "./TransactionManager";
import {  Maps, SerializedNode } from "./types";
import { first, isFunction } from "lodash";
import { CarbonPlugin } from "./CarbonPlugin";
import { StateScope } from "./StateScope";
import { Runtime } from "./Runtime";
import { PluginEmitter } from "./PluginEmitter";
import { PluginStates } from "./PluginState";
import { CarbonCommand } from "./CarbonCommand";

declare module '@emrgen/carbon-core' {
	export interface Carbon {
		print(): void;
	}
}

export class Carbon extends EventEmitter {
	private readonly pm: PluginManager;
	private readonly em: EventManager;
	private readonly sm: SelectionManager;
	private readonly rm: RenderManager;
	private readonly tm: TransactionManager;


	// for external application use
	private readonly pluginBus: PluginEmitter;
	private readonly pluginStates: PluginStates;
	private readonly commands: CarbonCommand;

	schema: Schema;
	state: State; // immutable state
	runtime: Runtime;
	store: NodeStore;

	// chain: CarbonCommandChain;
	change: ChangeManager;

	enabled: boolean;
	dragging: boolean;
	ready: boolean;

	_element: Optional<HTMLElement>;
	_portal: Optional<HTMLElement>;
	_contentElement: Optional<HTMLElement>;
	private cursorParkingElement: Optional<HTMLDivElement>;
	ticks: Maps<Carbon, Optional<Transaction>>[];

	committed: boolean;
	private counter: number = 0;

	constructor(state: State, schema: Schema, pm: PluginManager, renderer: RenderManager) {
		super();

		this.committed = true;

		this.pm = pm;
		this.rm = renderer;
		this.schema = schema;

		this.state = state;
		StateScope.set(this.state.scope, this.state.nodeMap);
		this.runtime = new Runtime();

		this.store = new NodeStore(this);

		this.sm = new SelectionManager(this);
		this.em = new EventManager(this, pm);

		this.tm = new TransactionManager(this, pm, this.sm, (state, tr) => {
			this.updateState(state, tr);
		});

		this.change = new ChangeManager(this, this.sm, this.tm, pm);

		this.commands = pm.commands();
		// this.chain = new CarbonCommandChain(this, this.tm, this.pm, this.sm);

		this.enabled = true;
		this.dragging = false;
		this.ready = false;
		this.ticks = [];

		this.pluginBus = new PluginEmitter();
		this.pluginStates = new PluginStates();

		this.pm.plugins.forEach(p => {
			this.pluginBus.register(p);
			const state = this.pluginStates.register(p);
			p.init(this.pluginBus, state);
		})
	}

	get content(): Node {
		return this.state.content;
	}

	get selection(): PinnedSelection {
		return this.state.selection;
	}

	get focused() {
		return this.sm.focused;
	}

	get element(): Optional<HTMLElement> {
		this._element = this._element ?? this.store.element(this.content.id)?.querySelector("[contenteditable=true]")
		return this._element;
	}

	get portal(): Optional<HTMLElement> {
		this._portal = this._portal ?? querySelector('.carbon-app > .carbon-portal') as any ?? null;
		return this._portal;
	}

	get contentElement(): Optional<HTMLElement> {
		this._contentElement = this._contentElement ?? document.getElementsByClassName('.editor > .editor-content')?.[0] as any ?? null;
		return this._contentElement;
	}

	// return a proxy transaction
	get cmd(): Transaction {
		// if (!this.committed) {
		// 	throw new Error('cannot create a new command while there is a pending transaction')
		// }
		this.committed = false;
		return Transaction.create(this, this.commands, this.tm, this.pm, this.sm).Proxy();
	}

	// create a new transaction
	get tr(): Transaction {
		if (!this.committed) {
			throw new Error('cannot create a new transaction while there is a pending transaction')
		}
		this.committed = false;
		return Transaction.create(this, this.commands, this.tm, this.pm, this.sm);
	}

	plugin(name: string): Optional<CarbonPlugin> {
		return this.pm.plugin(name);
	}

	mounted() {
		this.ready = true;
		this.emit(EventsOut.mounted);
	}

	// all events are emitted through this method
	onEvent(type: EventsIn, event: any) {
		// emit event to external application
		this.emit(type, event);

		if (type === EventsIn.selectionchange) {
			const selection = window.getSelection();
			if (selection) {
				const { anchorNode, focusNode } = selection;
				if (anchorNode === this.cursorParkingElement && focusNode === this.cursorParkingElement) {
					console.log('selectionchange: cursorRest');
					return
				}
			}
		}

		if (type === EventsIn.custom) {
			this.em.onCustomEvent(type, event);
		} else {
			this.em.onEvent(type, event);
		}
	}

	private updateState(state: State, tr: Transaction) {
		if (!state.isContentChanged && !state.isSelectionChanged) {
			console.warn('new state is not dirty');
			return
		}

		if (this.state === state) {
			console.warn('new state is the same as current');
			return
		}

		// keep three previous states
		this.state = state;
		StateScope.set(state.scope, state.nodeMap);
		this.change.update(tr, state)

		this.emit(EventsOut.transactionCommit, tr);
	}

	component(name: string) {
		return this.rm.component(name)
	}

	// sanitize(node: Node): SerializedNode {
	// 	return this.pm.serialize(this, node);
	// }

	blur() {
		this.sm.blur();
	}

	focus() {
		this.sm.focus();
	}

	enable(fn?: Function) {
		this.enabled = true;
		console.log('enable');

		if (fn) {
			fn();
			this.disable()
		}
	}

	disable() {
		console.log('disable');
		this.enabled = false;
	}

	setCursorRest(div: HTMLDivElement) {
		this.cursorParkingElement = div;
	}

	parkCursor() {
		this.cursorParkingElement?.focus();
	}

	cleanTicks() {
		this.ticks = [];
	}

	nextTick(cb) {
		this.ticks.push(cb);
	}

	processTick() {
		if (this.ticks.length) {
			const tick = first(this.ticks);
			this.ticks = this.ticks.slice(1);
			const tr = tick?.(this);
			if (!tr) return
			if (tr instanceof Transaction) {
				// tr.onTick = true;
				tr.Dispatch();
			} else if (isFunction(tr)) {
				(tr as Function)(this);
				return true;
			}
			return true;
		}
		return false;
	}
}
