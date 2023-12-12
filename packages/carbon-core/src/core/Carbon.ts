import { Optional, With } from "@emrgen/types";
import { Node } from './Node';
import { EventEmitter } from 'events';
import { querySelector } from '../utils/domElement';
import { CarbonState } from './CarbonState';
import { ChangeManager } from './ChangeManager';
import { EventsIn, EventsOut } from './Event';
import { EventManager } from './EventManager';
import { NodeStore } from './NodeStore';
import { PinnedSelection } from './PinnedSelection';
import { PluginManager } from './PluginManager';
import { RenderManager } from './Renderer';
import { Schema } from './Schema';
import { SelectionManager } from './SelectionManager';
import { Transaction } from './Transaction';
import { TransactionManager } from './TransactionManager';
import { CarbonCommands, Maps, SerializedNode } from "./types";
import { BlockSelection } from './NodeSelection';
import { cloneDeep, first, isFunction, merge } from 'lodash';
import { CarbonCommandChain } from './CarbonCommandChain';
import { CarbonMessageBus } from './MessageBus';
import { CarbonPlugin } from './CarbonPlugin';
import { StateScope } from "./StateScope";
import { NodeMap } from "./NodeMap";

export class Carbon extends EventEmitter {
	private readonly pm: PluginManager;
	private readonly em: EventManager;
	private readonly sm: SelectionManager;
	private readonly rm: RenderManager;
	private readonly tm: TransactionManager;


	// for external application use
	bus: CarbonMessageBus = new CarbonMessageBus();
	kvStore: Map<string, any> = new Map();

	schema: Schema;
	state: CarbonState;
	store: NodeStore;
	cmd: CarbonCommands;
	chain: CarbonCommandChain;
	change: ChangeManager;

	enabled: boolean;
	dragging: boolean;
	ready: boolean;

	_element: Optional<HTMLElement>;
	_portal: Optional<HTMLElement>;
	_contentElement: Optional<HTMLElement>;
	private cursorParkingElement: Optional<HTMLDivElement>;
	ticks: Maps<Carbon, Optional<Transaction>>[];

	constructor(name: string, content: Node, schema: Schema, pm: PluginManager, renderer: RenderManager) {
		super();

		this.pm = pm;
		this.rm = renderer;
		this.schema = schema;

		const map = new NodeMap();
		content.forAll(n => map.set(n.id, n));
		this.state = CarbonState.create(name, content, PinnedSelection.default(content), map);
		StateScope.set(name, this.state.nodeMap);

		this.store = new NodeStore(this.state)

		this.sm = new SelectionManager(this);
		this.em = new EventManager(this, pm);

		this.tm = new TransactionManager(this, pm, this.sm, (state, tr) => {
			this.updateState(state, tr);
		});

		this.change = new ChangeManager(this, this.sm, this.tm, pm);

		this.cmd = pm.commands(this);
		this.chain = new CarbonCommandChain(this, this.tm, this.pm, this.sm);

		this.enabled = true;
		this.dragging = false;
		this.ready = false;
		this.ticks = [];

		// init plugins
		pm.plugins.forEach(p => p.init(this));
	}

	plugin(name: string): Optional<CarbonPlugin> {
		return this.pm.plugin(name);
	}

	mounted() {
		this.ready = true;
		this.emit(EventsOut.mounted);
	}

	get content(): Node {
		return this.state.content;
	}

	get selection(): PinnedSelection {
		return this.state.selection;
	}

	get blockSelection(): BlockSelection {
		return this.state.nodeSelection;
	}

	get runtime() {
		return this.state.runtime;
	}

	get focused() {
		return this.sm.focused;
	}

	get tr(): Transaction {
		// if (this.chain.active) return this.chain;
		return Transaction.create(this, this.tm, this.pm, this.sm);
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
			this.em.onCustomEvent(event);
		} else {
			this.em.onEvent(type, event);
		}
	}

	private updateState(state: CarbonState, tr: Transaction) {
		if (!state.changes.isDirty) {
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

		// console.log(this.state.changes.toJSON());

		this.emit(EventsOut.transactionCommit, tr);
		this.change.update(tr);
	}

	component(name: string) {
		return this.rm.component(name)
	}

	// sanitize(node: Node): SerializedNode {
	// 	return this.pm.serialize(this, node);
	// }

	serialize(node: Node): Optional<SerializedNode> {
		return this.pm.serialize(this, node);
	}

	deserialize(serialized: string): Node[] {
		return this.pm.deserialize(this, serialized);
	}

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

	get(key: string) {
		return this.kvStore.get(key);
	}

	set(key: string, value: any) {
		const prev = this.kvStore.get(key);
		this.kvStore.set(key, merge(cloneDeep(prev), value));
	}

	processTick() {
		if (this.ticks.length) {
			const tick = first(this.ticks);
			this.ticks = this.ticks.slice(1);
			const tr = tick?.(this);
			if (!tr) return
			if (tr instanceof Transaction) {
				tr.onTick = true;
				tr.dispatch();
			} else if (isFunction(tr)) {
				(tr as Function)(this);
				return true;
			}
			return true;
		}
		return false;
	}
}

