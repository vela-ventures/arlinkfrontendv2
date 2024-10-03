import { runBuilds } from "./buildManager.js";

const builds = [
  {
    gitRepo: "https://github.com/internettrashh/preact-test-template.git",
    branch: "main",
    installCommand: "bun install",
    buildCommand: "bun run build",
    distFolder: "dist",
  },
  // Add more build configurations here
];

runBuilds(builds)
  .then(() => console.log("All builds completed"))
  .catch((error) => console.error("Error running builds:", error));
