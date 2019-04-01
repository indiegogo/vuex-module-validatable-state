import typescript from 'rollup-plugin-typescript2';
import commonjs from "rollup-plugin-commonjs";
import pkg from "./package.json";

export default {
  input: "./src/index.ts",
  plugins: [
    commonjs(),
    typescript({
      clean: true,
      useTsconfigDeclarationDir: true
    })
  ],
  output: {
    file: pkg.main,
    format: "cjs",
    exports: "named"
  },
  external: ["vuex"]
}
