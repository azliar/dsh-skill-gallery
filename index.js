/**
 * Host half of the Manual Tasks bundle.
 *
 * The whole feature is Client UI: the sidebar entry and the task panel register
 * through `ctx.slots` in `client.js`. This row exists so the package is mounted
 * (and its `dsh.client` half scanned into the web graph); it registers nothing
 * on the Host.
 */
export function apply() {}
