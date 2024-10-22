export const is_env_development = () => {
  // @ts-ignore
  if (!import.meta.env) {
    return false;
  }

  return import.meta.env.VITE_MODE === "dev";
};
export const environment = () => {
  return process?.env?.VITE_MODE;
};
