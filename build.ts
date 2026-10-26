// Static build: `bun build.ts` writes the finished site to dist/, ready for any static host.
import { cp, mkdir, rm } from "node:fs/promises";
import { listPages, renderPage } from "./render";

const root = import.meta.dir;
const out = `${root}/dist`;

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(`${root}/public`, out, { recursive: true });
for (const file of await listPages()) await Bun.write(`${out}/${file}`, (await renderPage(file))!);
console.log(`Built ${(await listPages()).length} pages to dist/`);
