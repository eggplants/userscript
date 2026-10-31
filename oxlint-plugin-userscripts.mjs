// oxlint resolves bare plugin specifiers on the filesystem, which can't see
// packages in pnpm's store; importing here goes through pnpm's store loader
export { default } from "eslint-plugin-userscripts";
