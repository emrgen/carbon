import { EventContext } from "../core";

export const skipKeyEvent = (ctx: EventContext<KeyboardEvent>) => {
  ctx.event.preventDefault();
  ctx.event.stopPropagation();
  ctx.stopPropagation();
  return false;
}
