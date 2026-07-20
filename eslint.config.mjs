import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      "node_modules/",
      ".next/",
      "out/",
      "build/",
      "dist/",
      "coverage/",
      "*.min.js",
    ],
  },
  ...nextVitals,
  ...nextTs,
];

export default eslintConfig;
