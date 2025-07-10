import {Cell} from "./Cell";
import {Module} from "./Module";

const immutableId = (id: string) => `immutable/${id}`;

const hiddenId = (id: string) => `hidden/${id}`;
const hiddenName = (name: string) => `hidden_${name}`;

const mutableId = (id: string) => `mutable/${id}`;
const mutableName = (name: string) => `mutable_${name}`;

const parseValue = (el) => {
  // console.log(el.type)
  switch (el.type) {
    case "file":
      return el.files[0]
    default:
      return el.value
  }
}

export const createViewOf = (module: Module, cell: Cell) => {
  const viewOfCellName = hiddenName(cell.name);
  const hiddenCellId = hiddenId(cell.id);

  // delete old instance
  const dispose = () => {
    module.delete(hiddenCellId);
    module.delete(cell.id);
  };

  const accessor = {
    data: undefined,
    get value() {
      return this.data;
    },
    set value(value: any) {
      if (this.data !== value) {
        this.data = value;
        const variable = module.variable(hiddenCellId);
        if (variable) {
          module.runtime.markDirty(variable);
          module.runtime.schedule();
        } else {
          console.warn(`Variable with id ${hiddenCellId} not found in module.`);
        }
      }
    },
  };

  module.define(
    Cell.create({
      id: cell.id,
      name: viewOfCellName,
      dependencies: cell.dependencies,
      version: cell.version,
      code: cell.code,
      dispose,
      definition: (...args: any) => {
        const el = cell.definition(...args);
        el.oninput = (e: any) => {
          accessor.value = parseValue(el)
        };

        const value = parseValue(el);
        if (value !== undefined) {
          accessor.value = value
        }

        return el;
      },
    }),
    false,
  );

  module.define(
    Cell.create({
      id: hiddenCellId,
      name: cell.name,
      dependencies: [viewOfCellName],
      version: cell.version,
      definition: () => {
        return accessor.value;
      },
    }),
    false,
  );

  module.runtime.schedule();
};

export const createMutable = (module: Module, cell: Cell) => {
  const hiddenCellId = hiddenId(cell.id);
  const hiddenCellName = hiddenName(cell.name);
  const mutableCellName = mutableName(cell.name);
  const mutableCellId = mutableId(cell.id);

  const dispose = () => {
    module.delete(hiddenCellId);
    module.delete(mutableCellId);
    module.delete(cell.id);
  };

  const accessor = {
    data: undefined,
    get value() {
      return this.data;
    },
    set value(value: any) {
      if (this.data !== value) {
        this.data = value;
        const variable = module.variable(cell.id);
        if (variable) {
          module.runtime.markDirty(variable);
          module.runtime.schedule();
        } else {
          console.warn(`Variable with id ${hiddenCellId} not found in module.`);
        }
      } else {
        console.log("No change in value, not updating runtime.");
      }
    },
  };

  const immutable = module.define(
    Cell.create({
      id: cell.id,
      name: cell.name,
      version: cell.version,
      dependencies: [hiddenCellName],
      code: cell.code,
      dispose,
      definition: () => {
        return accessor.value;
      },
    }),
    false,
  );

  const hidden = module.define(
    Cell.create({
      id: hiddenCellId,
      name: hiddenCellName,
      dependencies: cell.dependencies,
      version: cell.version,
      definition: (...args: any) => {
        const value = cell.definition(...args);
        accessor.value = value;
        return value;
      },
    }),
    false,
  );

  const mutable = module.define(
    Cell.create({
      id: mutableCellId,
      name: mutableCellName,
      version: cell.version,
      dependencies: [hiddenCellName],
      definition: function () {
        return accessor;
      },
    }),
    false,
  );

  module.runtime.schedule();
};

export const removeMutable = (module: Module, cell: Cell) => {
  module.delete(cell.id);
  module.delete(hiddenId(cell.id));
  module.delete(mutableId(cell.id));
};
