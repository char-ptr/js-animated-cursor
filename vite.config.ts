import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, "./src/index"),
			name: "js-animated-cursor-canvas",
			fileName: "index",
		},
	},
	plugins: [dts({ rollupTypes: false })],
});
