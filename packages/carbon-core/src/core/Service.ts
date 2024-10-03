import { entries, isEmpty } from "lodash";
import { CarbonPlugin } from "./CarbonPlugin";

type ServiceMap = Record<string, Record<string, Function>>;

export class Service {
  static from(plugins: CarbonPlugin[]) {
    const services = plugins.reduce((acc, plugin) => {
      const services = plugin.services();
      if (isEmpty(services)) return acc;

      const functions = entries(services).reduce(
        (acc, [name, service]) => {
          return {
            ...acc,
            [name]: (...args: any) => service.bind(plugin)(...args),
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
