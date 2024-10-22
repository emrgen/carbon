export const toggleAddRemove  = <T>(arg: T[], prev: T, predicate: (a:T,b:T) => boolean) => {
  return arg.some((a) => predicate(a, prev)) ? arg.filter((a) => !predicate(a, prev)) : [...arg, prev];
}