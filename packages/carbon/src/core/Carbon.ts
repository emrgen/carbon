
import { Optional } from '@emrgen/types';
import { Node } from 'core/Node';
import { EventEmitter } from 'events';
import { querySelector } from '../utils/domElement';
import { CarbonState } from './CarbonState';
import { ChangeManager } from './ChangeManager';
import { EventsIn } from './Event';
import { EventManager } from './EventManager';
import { NodeStore } from './NodeStore';
import { PinnedSelection } from './PinnedSelection';
import { PluginManager } from './PluginManager';
import { CarbonRenderer } from './Renderer';
import { Schema } from './Schema';
import { SelectionManager } from './SelectionManager';
import { Transaction } from './Transaction';
import { TransactionManager } from './TransactionManager';
import { CarbonCommands } from "./types";

export class Carbon extends EventEmitter {
	private readonly pm: PluginManager;
	private readonly em: EventManager;
	private readonly sm: SelectionManager;
	private readonly rm: CarbonRenderer;
	private readonly tm: TransactionManager;

	schema: Schema;
	state: CarbonState;
	cmd: CarbonCommands;
	change: ChangeManager;

	enabled: boolean;

	_element: any;
	_portal: any;
	_contentElement: any;

	constructor(content: Node, schema: Schema, pm: PluginManager, renderer: CarbonRenderer) {
		super();

		this.pm = pm;
		this.em = new EventManager(this, pm);
		this.sm = new SelectionManager(this);
		this.tm = new TransactionManager(this, pm, this.sm);

		this.rm = renderer;
		this.schema = schema;
		this.cmd = pm.commands(this);
		this.state = CarbonState.create(new NodeStore(), content, PinnedSelection.default(content));
		this.change = new ChangeManager(this.state, this.sm, this.tm)

		this.enabled = true;
	}

	get content(): Node {
		return this.state.content;
	}

	get selection(): PinnedSelection {
		return this.state.selection;
	}

	get store() {
		return this.state.store;
	}

	get runtime() {
		return this.state.runtime;
	}

	get focused() {
		return this.sm.focused;
	}

	get tr(): Transaction {
		return Transaction.create(this, this.tm, this.pm, this.sm);
	}


	get element(): Optional<HTMLElement> {
		this._element = this._element ?? this.store.element(this.content.id);
		return this._element;
	}

	get portal(): Optional<HTMLElement> {
		this._portal = this._portal ?? querySelector('.editor > .portal') as any ?? null;
		return this._portal;
	}

	get contentElement(): Optional<HTMLElement> {
		this._contentElement = this._contentElement ?? document.getElementsByClassName('.editor > .editor-content')?.[0] as any ?? null;
		return this._contentElement;
	}

	enable() {
		this.enabled = true;
	}

	disable() {
		this.enabled = false;
	}

	onEvent(type: EventsIn, event: Event) {
		this.em.onEvent(type, event);
	}

	component(name: string) {
		return this.rm.component(name)
	}
}

