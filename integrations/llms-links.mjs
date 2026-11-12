// Rewrite the relative links in the generated llms files to absolute site URLs.
//
// starlight-llms-txt concatenates the pages and keeps each page's Markdown links
// relative to that page. From the served llms file, `../glossary/` resolves
// outside `/bof3-wiki/`, so a reader cannot follow it. Each generated file keeps
// the page title as a top-level heading; use that to resolve the links against
// the page's own URL.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const LINK = /\]\(([^)\s]+)\)/g;

async function pageTitles() {
  const nav = JSON.parse(await readFile(join(ROOT, 'nav.json'), 'utf8'));
  const slugs = ['index', ...nav.flatMap((group) => group.items)];
  const titles = new Map();
  for (const slug of slugs) {
    const candidates = slug === 'index'
      ? [join(ROOT, 'src/content/docs/index.mdx')]
      : [
          join(ROOT, `src/content/docs/${slug}.md`),
          join(ROOT, `src/content/docs/${slug}.mdx`),
          join(ROOT, `src/content/docs/${slug}/index.md`),
        ];
    const file = await firstFile(candidates);
    if (!file) continue;
    const text = await readFile(file, 'utf8');
    const match = text.match(/^title: "(.*)"$/m);
    if (match) titles.set(JSON.parse(`"${match[1]}"`), slug);
  }
  return titles;
}

async function firstFile(candidates) {
  for (const file of candidates) {
    try {
      await readFile(file);
      return file;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

function pageUrl(slug, base) {
  return slug === 'index' ? `${base}/` : `${base}/${slug}/`;
}

function absolute(target, slug, site, base) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//')) return target;

  const [rawPath, fragment] = target.split('#');
  let path = rawPath;
  if (!path) {
    path = pageUrl(slug, base);
  } else if (path.startsWith('/')) {
    if (!path.startsWith(`${base}/`) && path !== base) path = `${base}${path}`;
  } else {
    path = posix.resolve(pageUrl(slug, base), path);
  }
  if (path.length > 1 && !path.endsWith('/') && !posix.extname(path)) path += '/';
  return `${site}${path}${fragment === undefined ? '' : `#${fragment}`}`;
}


async function rewriteFile(file, titles, site, base) {
  const text = await readFile(file, 'utf8');
  let slug = null;
  let fenced = false;
  const lines = text.split('\n').map((line) => {
    if (line.startsWith('```')) {
      fenced = !fenced;
      return line;
    }
    if (fenced) return line;
    if (line.startsWith('# ')) {
      slug = titles.get(line.slice(2).trim()) ?? null;
      return line;
    }
    if (!slug) return line;
    return line.replace(LINK, (match, target) => `](${absolute(target, slug, site, base)})`);
  });
  await writeFile(file, lines.join('\n'));
}

async function checkRelative(file, failures) {
  const text = await readFile(file, 'utf8');
  let fenced = false;
  for (const line of text.split('\n')) {
    if (line.startsWith('```')) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    if (line.includes('](../') || line.includes('](./')) failures.push(file);
  }
}

export default function llmsLinks({ site, base }) {
  return {
    name: 'llms-links',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const dist = fileURLToPath(dir);
        const titles = await pageTitles();
        const files = [join(dist, 'llms.txt'), join(dist, 'llms-full.txt'), join(dist, 'llms-small.txt')];
        const groups = join(dist, '_llms-txt');
        for (const name of await readdir(groups).catch(() => [])) {
          if (name.endsWith('.txt')) files.push(join(groups, name));
        }
        for (const file of files) await rewriteFile(file, titles, site, base);

        const failures = [];
        for (const file of files) await checkRelative(file, failures);
        if (failures.length) {
          throw new Error(`relative links remain in ${[...new Set(failures)].join(', ')}`);
        }
      },
    },
  };
}
