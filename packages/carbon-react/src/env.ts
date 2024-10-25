export const is_env_development = () => {
 return true
  // @ts-ignore
  if (!import.meta?.env) {
    return false;
  }
  // @ts-ignore
  return import.meta?.env?.VITE_MODE === "dev";
};

export const environment = () => {
  return process?.env?.VITE_MODE;
};
