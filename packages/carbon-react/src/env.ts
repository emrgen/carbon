export const is_env_development = () => {
  // @ts-ignore
  return import.meta.env.VITE_MODE === "dev";
};
export const environment = () => {
  return process.env.VITE_MODE;
};
