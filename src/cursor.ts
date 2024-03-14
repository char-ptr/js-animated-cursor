// test
interface BaseConfig {
	size: number;
	trail_speed: number;
	trail_size: number;
}
function MakeBaseConfig(base_config?: Partial<BaseConfig>): BaseConfig {
	return {
		size: base_config?.size ?? 10,
		trail_speed: base_config?.trail_speed ?? 1,
		trail_size: base_config?.trail_size ?? 10,
	};
}

interface CursorState {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	cursor: BaseConfig;
	_lerp_cursor: BaseConfig;
	cursor_pos: [number, number];
	trail_pos: [number, number];
	cursor_down: boolean;
	_last_delta: number;
	is_touch: boolean;
	_killed: boolean;
	config: ConfigData;
}
interface ConfigData {
	cursor: BaseConfig;
	selector: { [x: string]: BaseConfig };
	mouse_down: BaseConfig;
}
function onTouchStart(state: CursorState, _e: TouchEvent) {
	state.is_touch = true;
	state.cursor = state.config.mouse_down;
}
function onTouchEnd(state: CursorState, _e: TouchEvent) {
	state.is_touch = false;
	state.cursor = state.config.cursor;
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
}
function onPointerDown(state: CursorState, _e: PointerEvent) {
	state.cursor_down = true;
}
function onMouseMove(state: CursorState, e: MouseEvent) {
	state.cursor_pos = [e.clientX, e.clientY];
	if (
		(state.trail_pos[0] === 0 && state.trail_pos[1] === 0) ||
		state.cursor_down
	) {
		state.trail_pos = state.cursor_pos;
	}
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
			state.cursor = new_config[1];
			sz_check = true;
			break;
		}
	}
	if (!sz_check) {
		state.cursor = state.config.cursor;
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
	rotation: number,
	speed = 1,
) {
	const speed_clamp = Math.min(Math.max(speed, 1), 1.5);
	// console.log(speed_clamp);
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
	ctx.fillStyle = "rgba(255,255,255)";
	ctx.fill();
	ctx.closePath();
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
export function do_render(state: CursorState, delta: number) {
	const delta_diff = delta - state._last_delta;
	state._last_delta = delta;

	state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
	state.ctx.globalCompositeOperation = "difference";
	state._lerp_cursor.size = damp_lerp(
		state._lerp_cursor.size,
		state.cursor.size,
		1.2,
		delta_diff,
	);
	draw_cursor(state.ctx, state.cursor_pos, state._lerp_cursor.size);
	// only draw the trail if the cursor is not over a clickable element
	if (state.cursor.trail_size !== 0) {
		state._lerp_cursor.trail_size = damp_lerp(
			state._lerp_cursor.trail_size,
			state.cursor.trail_size,
			0.2,
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
