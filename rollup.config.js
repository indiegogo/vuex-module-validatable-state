import typescript from 'rollup-plugin-typescript2';
import pkg from "./package.json";

export default {
  input: "./src/index.ts",
  plugins: [
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
