export const is_env_development = () => {
 return true

  // @ts-ignore
  const {env} = import.meta as any ?? {}

  if (!env) {
    return false;
  }

  return env?.VITE_MODE === "dev";
};

export const environment = () => {
  const {env} = process ??{}
  return env?.VITE_MODE;
};
