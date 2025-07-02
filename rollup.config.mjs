import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import postcss from "rollup-plugin-postcss";
import tailwindcss from "@tailwindcss/postcss";
import tailwindConfig from "./tailwind.config.js";

export default [
  {
    input: [
      "src/content_scripts/scrollListener.ts",
      "src/background_scripts/background.ts",
      "src/popup/script.ts",
      "src/popup/settings.ts",
    ],
    output: {
      dir: "dist",
      format: "esm",
      preserveModules: true,
      preserveModulesRoot: "src",
      sourcemap: false,
    },
    plugins: [
      resolve(),
      typescript({ tsconfig: "./tsconfig.json" }),
      postcss({
        extract: "popup/style.css", // cria um CSS por entrada
        plugins: [tailwindcss(tailwindConfig)],
        minimize: false,
        sourceMap: false,
      }),
    ],
    treeshake: false,
  },
];
