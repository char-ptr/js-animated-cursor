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
    image:
      "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/25d45014-8cc3-4c98-b02c-5a0cf3a55ddd/dd5aicf-5aab2c9c-ae67-4349-a6a7-689c75b0201c.png/v1/fill/w_1280,h_1149/white_lily_flower_on_a_transparent_background__by_prussiaart_dd5aicf-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTE0OSIsInBhdGgiOiJcL2ZcLzI1ZDQ1MDE0LThjYzMtNGM5OC1iMDJjLTVhMGNmM2E1NWRkZFwvZGQ1YWljZi01YWFiMmM5Yy1hZTY3LTQzNDktYTZhNy02ODljNzViMDIwMWMucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.e7nFTq3ZYwRkKDc8yU-KZmYHcVgxtUh2r6TEQz47ffM",
    size: 20,
    trail_size: 0,
  },
});
(async () => {
  requestAnimationFrame((delta) => {
    do_render(state[0], delta);
  });
})();
