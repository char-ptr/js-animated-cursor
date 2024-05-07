// test
type RGB = `rgb(${string})`;
type RGBA = `rgba(${string})`;
type HEX = `#${string}`;
type HSL = `hsl(${string})`;
type HSLA = `hsla(${string})`;
type VAR = `var(${string})`;

type CssGlobals = "inherit" | "initial" | "revert" | "unset";

export type CssColor =
  | "currentColor"
  | "transparent"
  | RGB
  | RGBA
  | HEX
  | HSL
  | HSLA
  | VAR
  | CssGlobals;
export interface BaseConfig {
  size: number;
  colour: CssColor;
  image?: string;
  trail_speed: number;
  trail_size: number;
  trail_colour: CssColor;
  disable_blend: boolean;
}
function MakeBaseConfig(base_config?: Partial<BaseConfig>): BaseConfig {
  return {
    image: base_config?.image,
    size: base_config?.size ?? 10,
    trail_speed: base_config?.trail_speed ?? 1,
    trail_size: base_config?.trail_size ?? 10,
    trail_colour: base_config?.trail_colour ?? "rgb(255,255,255)",
    colour: base_config?.colour ?? "rgb(255,255,255)",
    disable_blend: base_config?.disable_blend ?? false,
  };
}

export interface CursorState {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cursor: BaseConfig;
  disable_blend: false;
  _lerp_cursor: BaseConfig;
  cursor_pos: [number, number];
  trail_pos: [number, number];
  cursor_down: boolean;
  _last_szcheck: boolean;
  _last_delta: number;
  is_touch: boolean;
  _killed: boolean;
  config: ConfigData;
  _img_cache?: { [x: string]: HTMLImageElement };
}
export interface ConfigData {
  /**
   * default state for the cursor
   */
  cursor: Partial<BaseConfig>;
  /**
   * use a selector as the key, when the mouse is over an element which matches it will use the value as the cursor config.
   */
  selector: { [x: string]: Partial<BaseConfig> };
  /**
   * when the user is holding down the mouse button it will use this config
   */
  mouse_down: Partial<BaseConfig>;
}
function onTouchStart(state: CursorState, _e: TouchEvent) {
  state.is_touch = true;
  state.cursor = MakeBaseConfig(state.config.mouse_down);
}
function onTouchEnd(state: CursorState, _e: TouchEvent) {
  state.is_touch = false;
  state.cursor = MakeBaseConfig(state.config.cursor);
}
function onTouchMove(state: CursorState, e: TouchEvent) {
  state.cursor_pos = [e.touches[0].clientX, e.touches[0].clientY];
  state.trail_pos = state.cursor_pos;
}
function onResize(state: CursorState, _e: UIEvent) {
  state.canvas.width = window.innerWidth;
  state.canvas.height = window.innerHeight;
}
function onPointerUp(state: CursorState, _e: PointerEvent) {
  state.cursor_down = false;
  state.cursor = MakeBaseConfig(state.config.cursor);
  state.trail_pos = state.cursor_pos;
}
function onPointerDown(state: CursorState, _e: PointerEvent) {
  state.cursor_down = true;
  state.cursor = MakeBaseConfig(state.config.mouse_down);
}
function onMouseMove(state: CursorState, e: MouseEvent) {
  state.cursor_pos = [e.clientX, e.clientY];
  // if (
  // 	(state.trail_pos[0] === 0 && state.trail_pos[1] === 0) ||
  // 	state.cursor_down
  // ) {
  // 	state.trail_pos = state.cursor_pos;
  // }
  const els = document.elementsFromPoint(
    state.cursor_pos[0],
    state.cursor_pos[1],
  );
  let sz_check = false;
  for (const el of els) {
    const new_config = Object.entries(state.config.selector).find((x) =>
      el.matches(x[0]),
    );
    if (new_config) {
      state.cursor = MakeBaseConfig(new_config[1]);
      sz_check = true;
      break;
    }
  }
  if (!sz_check) {
    state.cursor = state.cursor_down
      ? MakeBaseConfig(state.config.mouse_down)
      : MakeBaseConfig(state.config.cursor);
    if (state._last_szcheck) {
      state.trail_pos = state.cursor_pos;
    }
  }
  state._last_szcheck = sz_check;
  state.is_touch = false;
}
function getImgCacheOrEl(state: CursorState, img: string) {
  if (state._img_cache?.[img]) {
    return state._img_cache[img];
  }
  const img_el = new Image();
  img_el.src = img;
  if (state._img_cache) {
    state._img_cache[img] = img_el;
  }
  return img_el;
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
  const new_config = {
    cursor: MakeBaseConfig(config?.cursor),
    selector: config?.selector ?? {},
    mouse_down: MakeBaseConfig(config?.mouse_down),
  };
  const state: CursorState = {
    canvas,
    ctx,
    _lerp_cursor: new_config.cursor,
    cursor: new_config.cursor,
    cursor_pos: [0, 0],
    cursor_down: false,
    trail_pos: [0, 0],
    _killed: false,
    _last_delta: 0,
    _last_szcheck: false,
    is_touch: false,
    config: {
      cursor: MakeBaseConfig(config?.cursor),
      selector: config?.selector ?? {},
      mouse_down: MakeBaseConfig(config?.mouse_down),
    },
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
/**
 * initalizes a new cursor for the *parent* element.
 *
 * after calling this, you need to use the {@link do_render} function to render the cursor on every animation frame.
 *
 * ## notes
 * in react you will want to use `useEffect`.
 * on destructure make sure to call {@link deinitCursor}
 *
 * ## example
 * ```ts
 * let [state, _canvas] = initCursor(document.body)
 *
 *  requestAnimationFrame((delta) => {
 *    do_render(state, delta);
 * });
 * ```
 * */
export function initCursor(parent: HTMLElement, config?: Partial<ConfigData>) {
  const canvas = document.createElement("canvas");
  const state = initCursorWithCanvas(canvas, config);
  parent.appendChild(canvas);
  return [state, canvas] as const;
}
function draw_trail(
  ctx: CanvasRenderingContext2D,
  cursr: number[],
  size: number,
  colour: CssColor,
  rotation: number,
  speed = 1,
) {
  const speed_clamp = Math.min(Math.max(speed, 1), 1.5);
  ctx.beginPath();
  ctx.ellipse(
    cursr[0],
    cursr[1],
    size / speed_clamp,
    size * speed_clamp,
    -rotation,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = colour;
  ctx.fill();
  ctx.closePath();
}
function draw_cursor_img(
  ctx: CanvasRenderingContext2D,
  cursr: number[],
  size: number,
  img: HTMLImageElement,
) {
  ctx.drawImage(img, cursr[0] - size, cursr[1] - size, size * 2, size * 2);
}
function draw_cursor(
  ctx: CanvasRenderingContext2D,
  cursr: number[],
  size: number,
  colour: CssColor,
) {
  ctx.beginPath();
  ctx.arc(cursr[0], cursr[1], size, 0, Math.PI * 2);
  ctx.fillStyle = colour;
  ctx.fill();
  ctx.closePath();
}
export function do_render(state: CursorState, delta: number) {
  console.log(state.cursor);
  if (state.disable_blend !== state.cursor.disable_blend) {
    if (state.cursor.disable_blend) {
      state.canvas.style.mixBlendMode = "normal";
    } else {
      state.canvas.style.mixBlendMode = "difference";
    }
  }
  const delta_diff = delta - state._last_delta;
  state._last_delta = delta;

  state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
  state.ctx.globalCompositeOperation = "difference";
  state._lerp_cursor.size = damp_lerp(
    state._lerp_cursor.size,
    state.cursor.size,
    0.02,
    delta_diff,
  );
  if (state.cursor.image) {
    draw_cursor_img(
      state.ctx,
      state.cursor_pos,
      state._lerp_cursor.size,
      getImgCacheOrEl(state, state.cursor.image),
    );
  } else {
    draw_cursor(
      state.ctx,
      state.cursor_pos,
      state._lerp_cursor.size,
      state.cursor.colour,
    );
  }
  // only draw the trail if the cursor is not over a clickable element
  if (state.cursor.trail_size !== 0) {
    state._lerp_cursor.trail_size = damp_lerp(
      state._lerp_cursor.trail_size,
      state.cursor.trail_size,
      0.01,
      delta_diff,
    );
    state.trail_pos[0] = damp_lerp(
      state.trail_pos[0],
      state.cursor_pos[0],
      state.cursor.trail_speed / 100,
      delta_diff,
    );
    state.trail_pos[1] = damp_lerp(
      state.trail_pos[1],
      state.cursor_pos[1],
      state.cursor.trail_speed / 100,
      delta_diff,
    );
    const rot = rotation_axis(state.trail_pos, state.cursor_pos);
    const distance_x = state.cursor_pos[0] - state.trail_pos[0];
    const distance_y = state.cursor_pos[1] - state.trail_pos[1];
    const distance = Math.sqrt(
      distance_x * distance_x + distance_y * distance_y,
    );
    const speed = distance / delta_diff / 7;
    // console.log(speed);

    // let speed = console.log(rot);
    draw_trail(
      state.ctx,
      state.trail_pos,
      state._lerp_cursor.trail_size,
      state.cursor.trail_colour,
      rot,
      speed,
    );
  } else {
    state._lerp_cursor.trail_size = damp_lerp(
      state._lerp_cursor.trail_size,
      state.cursor.trail_size,
      0.02,
      delta_diff,
    );
    const rot = rotation_axis(state.trail_pos, state.cursor_pos);
    const distance_x = state.cursor_pos[0] - state.trail_pos[0];
    const distance_y = state.cursor_pos[1] - state.trail_pos[1];
    const distance = Math.sqrt(
      distance_x * distance_x + distance_y * distance_y,
    );
    const speed = distance / delta_diff / 7;

    draw_trail(
      state.ctx,
      state.trail_pos,
      state._lerp_cursor.trail_size,
      state.cursor.trail_colour,
      rot,
      speed,
    );
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
function damp_lerp(start: number, end: number, lambda: number, delta: number) {
  return lerp(start, end, 1 - Math.exp(-lambda * delta));
}
function rotation_axis(axis: [number, number], point: [number, number]) {
  return Math.atan2(point[0] - axis[0], point[1] - axis[1]);
  // return (Math.atan2(point[0] - axis[0], point[1] - axis[1]) * 180) / Math.PI;
}
