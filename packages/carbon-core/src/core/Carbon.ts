import { ActionOrigin, TextWriter } from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { EventEmitter } from "events";
import { first, isFunction } from "lodash";
import { querySelector } from "../utils/domElement";
import { BlockSelection } from "./BlockSelection";
import { CarbonCommand } from "./CarbonCommand";
import { CarbonDom } from "./CarbonDom";
import { CarbonPlugin, PluginType } from "./CarbonPlugin";
import { ChangeManager } from "./ChangeManager";
import { CustomEvent } from "./CustomEvent";
import { NodeEncoder, TreeEncoder, Writer } from "./Encoder";
import { EventsIn, EventsOut } from "./Event";
import { EventManager } from "./EventManager";
import { Node } from "./Node";
import { NodeStore } from "./NodeStore";
import { PinnedSelection } from "./PinnedSelection";
import { PluginEmitter } from "./PluginEmitter";
import { PluginManager } from "./PluginManager";
import { PluginStates } from "./PluginState";
import { RuntimeState } from "./RuntimeState";
import { Schema } from "./Schema";
import { SelectionManager } from "./SelectionManager";
import { Service } from "./Service";
import { State } from "./State";
import { Transaction } from "./Transaction";
import { TransactionManager } from "./TransactionManager";
import { With } from "./types";

export class Carbon extends EventEmitter {
  private readonly pm: PluginManager;
  private readonly em: EventManager;
  private readonly sm: SelectionManager;
  private readonly tm: TransactionManager;

  // for external application use
  private readonly pluginBus: PluginEmitter;
  private readonly pluginStates: PluginStates;
  private readonly commands: CarbonCommand;
  readonly service: Service;

  // TODO: move to external package if possible
  // string encoder is required clipboard
  private readonly encoder: NodeEncoder;

  schema: Schema;
  state: State;
  store: NodeStore;
  runtime: RuntimeState;
  dom: CarbonDom;

  change: ChangeManager;

  enabled: boolean;
  dragging: boolean;
  ready: boolean;

  _element: Optional<HTMLElement>;
  _portal: Optional<HTMLElement>;
  _contentElement: Optional<HTMLElement>;
  private cursorParkingElement: Optional<HTMLDivElement>;
  private ticks: With<Transaction>[];

  committed: boolean;
  now: number;

  constructor(state: State, schema: Schema, pm: PluginManager) {
    super();

    this.committed = true;

    this.pm = pm;
    this.schema = schema;

    // NOTE: without the state activation the node map is not updated with state nodes
    this.state = state.activate();
    this.runtime = new RuntimeState();
    this.dom = new CarbonDom(this);

    this.store = new NodeStore(this);

    this.sm = new SelectionManager(this);

    this.tm = new TransactionManager(this, pm, this.sm, (state, tr) => {
      return this.updateState(state, tr);
    });

    this.change = new ChangeManager(this, pm);
    this.em = new EventManager(this, pm, this.change);

    this.commands = pm.commands();
    this.service = pm.services(this);
    // this.chain = new CarbonCommandChain(this, this.tm, this.pm, this.sm);

    this.enabled = true;
    this.dragging = false;
    this.ready = false;
    this.ticks = [];

    this.pluginBus = new PluginEmitter();
    this.pluginStates = new PluginStates();

    this.pm.plugins.forEach((p) => {
      this.pluginBus.register(p);
      const state = this.pluginStates.register(p);
      p.init(this, this.pluginBus, state);
    });

    this.pm.plugins.forEach((p) => {
      p.created();
    });

    // create a string encoder
    const plugins: CarbonPlugin[] = this.pm.plugins.filter((p) => p.type === PluginType.Node);

    const encoder = TreeEncoder.from<string>();
    this.encoder = {
      encode(writer: Writer, node: Node) {
        return encoder.encode(writer, encoder, node);
      },

      encodeHtml(writer: Writer, node: Node) {
        return encoder.encodeHtml(writer, encoder, node);
      },
    };

    plugins.forEach((p) => {
      encoder.addEncoder(p.name, {
        encode: (writer: Writer, node: Node) => {
          return p.encode(writer, this.encoder, node);
        },

        encodeHtml: (writer: Writer, node: Node) => {
          return p.encodeHtml(writer, this.encoder, node);
        },
      });
    });
  }

  get prevEvents() {
    return this.em.prevEvents;
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
    this._element =
      this._element ?? this.store.element(this.content.id)?.querySelector("[contenteditable=true]");
    return this._element;
  }

  get portal(): Optional<HTMLElement> {
    this._portal = this._portal ?? (querySelector(".carbon-react > .carbon-portal") as any) ?? null;
    return this._portal;
  }

  get contentElement(): Optional<HTMLElement> {
    this._contentElement =
      this._contentElement ?? (document.querySelector("[data-name=carbon]") as any) ?? null;
    return this._contentElement;
  }

  // return a proxy transaction
  get cmd(): Transaction {
    if (!this.committed) {
      throw new Error("cannot create a new command while there is a pending transaction");
    }
    // this.committed = false;
    this.now = Date.now();
    return Transaction.create(this, this.commands, this.tm, this.pm, this.sm).Proxy();
  }

  // create a new transaction
  get tr(): Transaction {
    if (!this.committed) {
      throw new Error("cannot create a new transaction while there is a pending transaction");
    }
    this.committed = false;
    return Transaction.create(this, this.commands, this.tm, this.pm, this.sm);
  }

  // return markdown
  markdown(node: Node = this.state.content) {
    const writer = new TextWriter();
    this.encode(writer, node);

    return writer.toString();
  }

  // encode a node to string
  encode(writer: Writer, node: Node): Writer {
    const { encoder } = this;
    encoder.encode(writer, node);

    return writer;
  }

  // encode a node to html string
  encodeHtml(writer: Writer, node: Node): Writer {
    const { encoder } = this;
    encoder.encodeHtml(writer, node);

    return writer;
  }

  // get a plugin by name
  plugin(name: string): Optional<CarbonPlugin> {
    return this.pm.plugin(name);
  }

  mounted() {
    this.ready = true;
    this.emit(EventsOut.mounted);
  }

  unmounted() {
    this.ready = false;
    this.emit(EventsOut.unmounted);
  }

  // all events are emitted through this method
  onEvent(type: EventsIn, event: any) {
    // emit event to external listeners
    this.emit(type, event);

    // // if cursor is parked, ignore selection change
    // if (type === EventsIn.selectionchange) {
    //   const selection = window.getSelection();
    //   console.log(event);
    //   if (selection) {
    //     const { anchorNode, focusNode } = selection;
    //     if (
    //       anchorNode === this.cursorParkingElement &&
    //       focusNode === this.cursorParkingElement
    //     ) {
    //       console.log("selectionchange: cursorRest");
    //       return;
    //     }
    //   }
    // }

    if (type === EventsIn.custom) {
      this.em.onCustomEvent(type, event);
    } else {
      this.em.onEvent(type, event);
    }
  }

  private updateState(state: State, tr: Transaction): boolean {
    console.log("updateState", Date.now() - this.now);
    if (!state.isContentChanged && !state.isSelectionChanged && !state.isMarksChanged) {
      console.warn("new state is not dirty");
      return false;
    }

    if (state.eq(this.state) && state.selection.origin !== ActionOrigin.UserInput) {
      console.warn(
        "skipping ui sync: new state is the same as current",
        state.content.renderVersion,
        this.state.content.contentVersion,
      );

      return false;
    }

    // keep three previous states
    this.state = state.activate();

    // console.log(
    //   "updateState",
    //   this.state.content.textContent,
    //   this.state.isContentChanged,
    //   this.state.isSelectionChanged,
    // );

    // console.log("updateState", state.content.textContent);
    this.em.onEventOut(
      EventsOut.updateView,
      CustomEvent.create("updateView", this.state.content, {
        state,
      }),
    );
    this.change.update(state, tr);
    this.emit(EventsOut.transactionCommit, tr);
    return true;
  }

  blur() {
    // this.sm.blur();
  }

  focus() {
    this.sm.focus();
  }

  enable(fn?: Function) {
    const isEnable = this.enabled;
    this.enabled = true;
    console.log("enable");
    if (fn) {
      fn();
      if (!isEnable) {
        this.disable();
      }
    }
  }

  disable() {
    console.log("disable");
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

  nextTick(cb: With<Transaction>) {
    this.ticks.push(cb);
  }

  processTick(tr: Transaction) {
    if (this.ticks.length) {
      const tick = first(this.ticks);
      this.ticks = this.ticks.slice(1);
      this.tm.unlock(tr);
      if (isFunction(tick)) {
        tick(this.cmd);
      }
      return true;
    } else {
      this.tm.unlock(tr);
    }
    return false;
  }
}
