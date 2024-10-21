import { entries, isEmpty } from "lodash";
import { CarbonPlugin } from "./CarbonPlugin";
import { Carbon } from "./Carbon";

type ServiceMap = Record<string, Record<string, Function>>;

// Service is a proxy object that allows plugins to access each other's services
// the services are bound to the plugin instance and accessed via the plugin name
export class Service {
  static from(app: Carbon, plugins: CarbonPlugin[]) {
    const services = plugins.reduce((acc, plugin) => {
      const services = plugin.services();
      if (isEmpty(services)) return acc;

      const functions = entries(services).reduce(
        (acc, [name, service]) => {
          return {
            ...acc,
            [name]: (...args: any) => service.bind(plugin)(app, ...args),
          };
        },
        {} as Record<string, Function>,
      );

      return {
        ...acc,
        [plugin.name]: functions,
      };
    }, {});

    return new Service(services).proxy();
  }

  private constructor(private readonly services: ServiceMap) {}

  private proxy(): Service {
    const { services } = this;
    return new Proxy(this, {
      get: (target, prop) => {
        if (prop === "isProxy") {
          return true;
        }

        const propName = prop.toString();
        const plugin = services[propName];

        if (!plugin) {
          console.log(services);
          throw new Error(`Service ${propName} not found`);
        }

        return plugin;
      },
    });
  }
}
