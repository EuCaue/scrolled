import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import postcss from "rollup-plugin-postcss";
import tailwindcss from "@tailwindcss/postcss";
import tailwindConfig from "./tailwind.config.js";

export default [
  {
    input: "src/content_scripts/scrollListener.ts",
    output: {
      dir: "dist/content_scripts",
      format: "esm",
      entryFileNames: "scrollListener.js",
      sourcemap: false,
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: "./tsconfig.json",
      }),
    ],
    treeshake: true, 
  },

  {
    input: "src/background_scripts/background.ts",
    output: {
      dir: "dist/background_scripts",
      format: "esm",
      entryFileNames: "background.js",
      sourcemap: false,
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: "./tsconfig.json",
      }),
    ],
    treeshake: true,
  },

  {
    input: {
      script: "src/popup/script.ts", 
      settings: "src/popup/settings.ts", 
    },
    output: {
      dir: "dist/popup", 
      format: "esm",
      sourcemap: false,
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: "./tsconfig.json",
      }),
      postcss({
        extract: "style.css",
        plugins: [tailwindcss(tailwindConfig)],
        minimize: false,
        sourceMap: false,
      }),
    ],
    treeshake: true,
  },
];
