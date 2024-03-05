// test
interface CursorState {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cursor_pos: number[];
  cursor_down: boolean;
  cursor_size: number;
  cursor_size_alt: number;
  trail_cursor: number[];
  is_touch: boolean;
  _killed: boolean;
  config: Partial<ConfigData>;
}
interface ConfigData {
  default_size: number;
  big_size: number;
}
function onTouchStart(state: CursorState, _e: TouchEvent) {
  state.is_touch = true;
  state.cursor_size = state.config.big_size ?? 30;
}
function onTouchEnd(state: CursorState, _e: TouchEvent) {
  state.is_touch = false;
  state.cursor_size = state.config.default_size ?? 10;
}
function onTouchMove(state: CursorState, e: TouchEvent) {
  state.cursor_pos = [e.touches[0].clientX, e.touches[0].clientY];
  state.trail_cursor = state.cursor_pos;
}
function onResize(state: CursorState, _e: UIEvent) {
  state.canvas.width = window.innerWidth;
  state.canvas.height = window.innerHeight;
}
function onPointerUp(state: CursorState, _e: PointerEvent) {
  state.cursor_down = false;
}
function onPointerDown(state: CursorState, _e: PointerEvent) {
  state.cursor_down = true;
}
function onMouseMove(state: CursorState, e: MouseEvent) {
  state.cursor_pos = [e.clientX, e.clientY];
  if (
    (state.trail_cursor[0] === 0 && state.trail_cursor[1] === 0) ||
    state.cursor_down
  ) {
    state.trail_cursor = state.cursor_pos;
  }
  const els = document.elementsFromPoint(
    state.cursor_pos[0],
    state.cursor_pos[1],
  );
  let sz_check = false;
  for (const el of els) {
    switch (el.tagName) {
      case "IMG":
      case "A":
        state.cursor_size = state.config.big_size ?? 30;
        sz_check = true;
        state.trail_cursor = state.cursor_pos;
    }
  }
  if (!sz_check) {
    state.cursor_size = state.config.default_size ?? 10;
  }
  state.is_touch = false;
}
export function initCursorWithCanvas(
  canvas: HTMLCanvasElement,
  config?: Partial<ConfigData>,
) {
  window.document.body.style.cursor = "none";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.pointerEvents = "none";
  canvas.style.position = "fixed";
  canvas.style.mixBlendMode = "difference";
  canvas.style.left = "0px";
  canvas.style.top = "0px";

  canvas.style.zIndex = "1000";

  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const state: CursorState = {
    canvas,
    ctx,
    cursor_pos: [0, 0],
    cursor_down: false,
    cursor_size: 0,
    cursor_size_alt: 10,
    trail_cursor: [0, 0],
    _killed: false,
    is_touch: false,
    config: config ?? {},
  };

  document.addEventListener("pointerup", onPointerUp.bind(undefined, state));
  document.addEventListener(
    "pointerdown",
    onPointerDown.bind(undefined, state),
  );
  window.addEventListener("mousemove", onMouseMove.bind(undefined, state));
  window.addEventListener("resize", onResize.bind(undefined, state));
  window.addEventListener("touchstart", onTouchStart.bind(undefined, state));
  window.addEventListener("touchend", onTouchEnd.bind(undefined, state));
  window.addEventListener("touchmove", onTouchMove.bind(undefined, state));
  return state;
}
export function deinitCursor(state: CursorState) {
  state._killed = true;
  document.removeEventListener("pointerup", onPointerUp.bind(undefined, state));
  document.removeEventListener(
    "pointerdown",
    onPointerDown.bind(undefined, state),
  );
  window.removeEventListener("mousemove", onMouseMove.bind(undefined, state));
  window.removeEventListener("resize", onResize.bind(undefined, state));
  window.removeEventListener("touchstart", onTouchStart.bind(undefined, state));
  window.removeEventListener("touchend", onTouchEnd.bind(undefined, state));
  window.removeEventListener("touchmove", onTouchMove.bind(undefined, state));
}
export function initCursor(parent: HTMLElement) {
  const canvas = document.createElement("canvas");
  const state = initCursorWithCanvas(canvas);
  parent.appendChild(canvas);
  return [state, canvas] as const;
}
function draw_cursor(
  ctx: CanvasRenderingContext2D,
  cursr: number[],
  size: number,
) {
  ctx.beginPath();
  ctx.arc(cursr[0], cursr[1], size, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255)";
  ctx.fill();
  ctx.closePath();
}
export function do_render(state: CursorState) {
  state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
  state.ctx.globalCompositeOperation = "difference";
  const lerp_amount = 0.2;
  state.cursor_size_alt = lerp(
    state.cursor_size_alt,
    state.cursor_down ? state.config.big_size ?? 30 : state.cursor_size,
    lerp_amount,
  );
  draw_cursor(state.ctx, state.cursor_pos, state.cursor_size_alt);
  // only draw the trail if the cursor is not over a clickable element
  if (!state.cursor_down && state.cursor_size === 10) {
    state.trail_cursor[0] = lerp(
      state.trail_cursor[0],
      state.cursor_pos[0],
      lerp_amount,
    );
    state.trail_cursor[1] = lerp(
      state.trail_cursor[1],
      state.cursor_pos[1],
      lerp_amount,
    );
    draw_cursor(state.ctx, state.trail_cursor, state.cursor_size_alt);
  }

  if (!state._killed) requestAnimationFrame(do_render.bind(undefined, state));
}
// Linear interpolation
// @param start The start value
// @param end The end value
// @param amt The amount to interpolate commonly known as time in animation through 0-1
function lerp(start: number, end: number, amt: number) {
  return (1 - amt) * start + amt * end;
}
