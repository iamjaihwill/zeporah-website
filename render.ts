// Assembles a page from pages/<name>.html and the shared partials.
// A page starts with a front-matter comment: <!-- title: … | description: … -->
const root = import.meta.dir;
const partial = (name: string) => Bun.file(`${root}/partials/${name}.html`).text();

export async function renderPage(file: string): Promise<string | null> {
  const page = Bun.file(`${root}/pages/${file}`);
  if (!(await page.exists())) return null;
  const source = await page.text();
  const meta = source.match(/^<!--\s*title:\s*(.*?)\s*\|\s*description:\s*(.*?)\s*-->/s);
  let body = source.slice(meta?.[0].length ?? 0);
  // <!-- include: name --> pulls in partials/name.html
  for (const [tag, name] of body.matchAll(/<!--\s*include:\s*([\w-]+)\s*-->/g)) body = body.replace(tag, await partial(name));
  const [head, header, footer] = await Promise.all([partial("head"), partial("header"), partial("footer")]);
  return (head + header + body + footer)
    .replace("{{title}}", meta?.[1] ?? "Zeporah")
    .replace("{{description}}", meta?.[2] ?? "")
    .replaceAll(`href="${file}" data-nav`, `href="${file}" data-nav aria-current="page"`);
}

export async function listPages(): Promise<string[]> {
  return [...new Bun.Glob("*.html").scanSync(`${root}/pages`)];
}
