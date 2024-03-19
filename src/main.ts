import "./style.css";
import { do_render, initCursor } from "./cursor";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button">test</button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`;

const state = initCursor(document.querySelector<HTMLElement>("#cursor")!, {
	selector: {
		button: {
			colour: "rgb(255,255,0)",
			size: 20,
			trail_size: 0,
		},
	},
	mouse_down: {
		size: 20,
		trail_size: 0,
	},
});
(async () => {
	requestAnimationFrame((delta) => {
		do_render(state[0], delta);
	});
})();
