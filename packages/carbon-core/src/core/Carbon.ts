import {Optional} from "@emrgen/types";
import {Node} from "./Node";
import {EventEmitter} from "events";
import {querySelector} from "../utils/domElement";
import {State} from "./State";
import {ChangeManager} from "./ChangeManager";
import {EventsIn, EventsOut} from "./Event";
import {EventManager} from "./EventManager";
import {NodeStore} from "./NodeStore";
import {PinnedSelection} from "./PinnedSelection";
import {PluginManager} from "./PluginManager";
import {Schema} from "./Schema";
import {SelectionManager} from "./SelectionManager";
import {Transaction} from "./Transaction";
import {TransactionManager} from "./TransactionManager";
import {With} from "./types";
import {first} from "lodash";
import {CarbonPlugin, PluginType} from "./CarbonPlugin";
import {RuntimeState} from "./RuntimeState";
import {PluginEmitter} from "./PluginEmitter";
import {PluginStates} from "./PluginState";
import {CarbonCommand} from "./CarbonCommand";
import {ActionOrigin} from "@emrgen/carbon-core";
import {BlockSelection} from "./BlockSelection";
import {Encoder, NodeEncoder, TreeEncoder, Writer} from "./Encoder";

export class Carbon extends EventEmitter {
	private readonly pm: PluginManager;
	private readonly em: EventManager;
	private readonly sm: SelectionManager;
	private readonly tm: TransactionManager;

	// for external application use
	private readonly pluginBus: PluginEmitter;
	private readonly pluginStates: PluginStates;
	private readonly commands: CarbonCommand;

  // TODO: move to external package if possible
  // string encoder is required clipboard
  private encoder: NodeEncoder<string>;

	schema: Schema;
	state: State; // immutable state
	runtime: RuntimeState;
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
	ticks: With<Transaction>[];

	committed: boolean;
	private counter: number = 0;

	constructor(state: State, schema: Schema, pm: PluginManager) {
		super();

		this.committed = true;

		this.pm = pm;
		this.schema = schema;

		this.state = state.activate()
		this.runtime = new RuntimeState();

		this.store = new NodeStore(this);

		this.sm = new SelectionManager(this);

		this.tm = new TransactionManager(this, pm, this.sm, (state, tr) => {
			this.updateState(state, tr);
		});

		this.change = new ChangeManager(this, this.sm, this.tm, pm);
    this.em = new EventManager(this, pm, this.change);

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
			p.init(this, this.pluginBus, state);
		})

    // create a string encoder
    const plugins = this.pm.plugins.filter(p => p.type ===  PluginType.Node);
    const encoder = TreeEncoder.from<string>();
    this.encoder = {
      encode(writer: Writer, node: Node) {
        return encoder.encode(writer, encoder, node);
      }
    }

    plugins.forEach(p => {
      encoder.addEncoder(p.name, {
        encode: (writer: Writer, node: Node) => {
          return p.encode(writer, this.encoder, node);
        }
      })
    });
	}

  encode(writer: Writer, node: Node) {
    const {encoder} = this;
    encoder.encode(writer, node);
  }

	get content(): Node {
		return this.state.content;
	}

	get selection(): PinnedSelection {
		return this.state.selection;
	}

  get blockSelection(): BlockSelection {
    return this.state.blockSelection;
  }

	get focused() {
		return this.sm.focused;
	}

	get element(): Optional<HTMLElement> {
		this._element = this._element ?? this.store.element(this.content.id)?.querySelector("[contenteditable=true]")
		return this._element;
	}

	get portal(): Optional<HTMLElement> {
		this._portal = this._portal ?? querySelector('.carbon-react > .carbon-portal') as any ?? null;
		return this._portal;
	}

	get contentElement(): Optional<HTMLElement> {
		this._contentElement = this._contentElement ?? document.querySelector('[data-name=carbon]') as any ?? null;
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

		if (state.eq(this.state) && state.selection.origin !== ActionOrigin.UserInput) {
			console.warn('skipping ui sync: new state is the same as current', state.content.renderVersion, this.state.content.contentVersion);
			return
		}

		// keep three previous states
		this.state = state.activate()
        // console.log('updateState', this.state.content.textContent, this.state.isContentChanged, this.state.isSelectionChanged);
		this.change.update(tr, state)

		this.emit(EventsOut.transactionCommit, tr);
	}

	// sanitize(node: Node): SerializedNode {
	// 	return this.pm.serialize(this, node);
	// }

	blur() {
		// this.sm.blur();
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
      const cmd = this.cmd;
			tick?.(cmd);
      cmd.Dispatch();
			// if (!tr) return
			// if (tr instanceof Transaction) {
			// 	// tr.onTick = true;
			// 	tr.Dispatch();
			// } else if (isFunction(tr)) {
			// 	(tr as Function)(this);
			// 	return true;
			// }
			return true;
		}
		return false;
	}
}
