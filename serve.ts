// Local preview server: `bun serve.ts`
// Pages are assembled from pages/ + partials/ on each request; static files come from public/.
// POST /api/demo appends demo requests to submissions/demo.jsonl. This is for local preview
// only; choose a form backend before the site goes live.
import { appendFile, mkdir } from "node:fs/promises";
import { renderPage } from "./render";

const root = import.meta.dir;
const fields = ["interest", "name", "email", "organization", "role", "state", "size", "times", "timezone", "notes"] as const;
const required = ["name", "email", "organization", "role", "state"];

async function saveDemoRequest(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return Response.json({ error: "invalid" }, { status: 400 });
  if (body.website) return Response.json({ ok: true }); // spam trap filled in: drop silently
  const entry: Record<string, string> = { receivedAt: new Date().toISOString() };
  for (const f of fields) entry[f] = String(body[f] ?? "").trim().slice(0, f === "notes" ? 1500 : 200);
  const missing = required.filter((f) => !entry[f]);
  if (missing.length || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email))
    return Response.json({ error: "invalid", missing }, { status: 422 });
  await mkdir(`${root}/submissions`, { recursive: true });
  await appendFile(`${root}/submissions/demo.jsonl`, JSON.stringify(entry) + "\n");
  return Response.json({ ok: true });
}

Bun.serve({
  port: 4321,
  async fetch(req) {
    let path = decodeURIComponent(new URL(req.url).pathname);
    if (path === "/api/demo") return req.method === "POST" ? saveDemoRequest(req) : new Response(null, { status: 405 });
    if (path.includes("..")) return new Response("Not found", { status: 404 });
    if (path.endsWith("/")) path += "index.html";
    if (path.endsWith(".html")) {
      const html = await renderPage(path.slice(1));
      if (html) return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    const file = Bun.file(`${root}/public${path}`);
    return (await file.exists()) ? new Response(file) : new Response("Not found", { status: 404 });
  },
});
console.log("Zeporah site on http://localhost:4321");
