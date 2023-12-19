import { Optional } from "@emrgen/types";
import { CarbonPlugin, PluginName, PluginType, Transaction } from "@emrgen/carbon-core";
import { each, sortBy, values } from "lodash";

interface CommandHandler {
  type: PluginType;
  name: PluginName;
  priority: number;
  fn: Function;
}

type PluginCommandName = string;

type CommandMap = Record<PluginCommandName, CommandHandler>;
type PluginCommandMap = Record<PluginName, CommandMap>;

export class CarbonCommand {
  private readonly carbonCommands: CommandMap;
  private readonly pluginCommands: PluginCommandMap;

  static tr: Optional<Transaction>;

  static from(plugins: CarbonPlugin[]): CarbonCommand {
    const commands: Record<PluginCommandName, CommandHandler[]> = {}
    const carbonCommands: CommandMap = {};
    const pluginCommands: PluginCommandMap = {};

    plugins.forEach(p => {
      each(p.commands(), (fn, name) => {
        fn = fn.bind(p);
        // if (p.type !== PluginType.Node) {
        commands[name] = commands[name] ?? [];
        const handler = {
          type: p.type,
          name: p.name,
          priority: p.priority,
          fn,
        }
        commands[name].push(handler);

        pluginCommands[p.name] = pluginCommands[p.name] ?? {};
        pluginCommands[p.name][name] = handler;
      })

    })

    const typeOrder = {
      [PluginType.Before]: 0,
      [PluginType.Node]: 1,
      [PluginType.After]: 2,
    }

    const comparePluginType = (a: PluginType, b: PluginType) => {
      return typeOrder[a] - typeOrder[b];
    }

    // sort commands by priority
    values(commands).forEach(commands => {
      commands.sort((a, b) => {
        const type = comparePluginType(a.type, b.type);
        if (type !== 0) {
          return type;
        }
        return b.priority - a.priority
      });
    })

    each(commands, (commands, name) => {
      const fn = (tr: Transaction, ...args: any) => {
        commands.some(c => {
          return c.fn(tr, ...args);
        });

        return tr;
      };

      carbonCommands[name] = {
        type: PluginType.Node,
        name,
        priority: 0,
        fn
      }
    })

    return new CarbonCommand(carbonCommands, pluginCommands)
  }

  constructor(carbonCommands: CommandMap, pluginCommands: PluginCommandMap) {
    this.carbonCommands = carbonCommands;
    this.pluginCommands = pluginCommands;
  }

  // get command by name
  command(pluginName: string): Optional<CommandHandler> {
    return this.carbonCommands[pluginName];
  }

  plugin(pluginName: string): Optional<CommandMap> {
    return this.pluginCommands[pluginName];
  }
}

export class PluginCommand {
  private plugin: PluginName;
  private tr: Transaction;
  private commands: CommandMap;

  static from(tr: Transaction, plugin: PluginName, commands: CommandMap): PluginCommand {
    return new PluginCommand(tr, plugin, commands);
  }

  constructor(tr: Transaction, plugin: PluginName, commands: CommandMap) {
    this.plugin = plugin;
    this.tr = tr;
    this.commands = commands;
  }

  proxy() {
    return new Proxy(this, {
      get: (target, prop) => {
        if (prop in target) return target[prop];
        const command = target.commands[prop.toString()];
        if (!command) {
          throw new Error(`Command ${prop.toString()} not found`);
        }

        // inject tr as first argument
        return (...args: any[]) => {
          command.fn(target.tr, ...args)
          return target.tr;
        }
      }
    })
  }
}
