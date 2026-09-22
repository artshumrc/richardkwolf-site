/**
 * The clean-pages build gate: reader pages ship zero CMS JavaScript, every
 * Editor variant ships it, and every reader page carries distinct metadata.
 *
 * Node only and dependency-free: it greps the build directory with nothing
 * installed but node itself.
 *
 * Sentinel discipline: for each `index.html` the gate resolves the transitive
 * JavaScript closure of its scripts — `src`/`href` attributes plus dynamic
 * `import('…')` specifiers in the HTML, then static `from '…'` imports
 * transitively in JS — and asserts the `uncial-cms` runtime sentinel is absent
 * from every reader page and present on every Editor variant. The Index page
 * (`/uncial/`) is ignored for the sentinel.
 *
 * JS sources follow static imports only, deliberately not dynamic ones: the
 * SvelteKit router dynamically imports every route module lazily, so following
 * dynamic imports in JS would pull every Editor variant into every reader
 * page's closure and the gate could never pass.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const SENTINEL = 'uncial-cms-runtime-sentinel-v1';
const buildDir = process.argv[2] ?? 'build';

function walk(dir) {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		return entry.isDirectory() ? walk(path) : [path];
	});
}

function resolveAppAsset(url) {
	const marker = url.indexOf('_app/');
	return marker === -1 ? null : join(buildDir, url.slice(marker));
}

function scriptClosure(html) {
	const queue = [...html.matchAll(/(?:src|href)="([^"]+\.js)"/g)]
		.map(([, url]) => resolveAppAsset(url))
		.filter(Boolean);
	for (const [, url] of html.matchAll(/import\(?["']([^"']+\.js)["']/g)) {
		const resolved = resolveAppAsset(url);
		if (resolved) queue.push(resolved);
	}
	const seen = new Set();
	while (queue.length > 0) {
		const file = queue.pop();
		if (seen.has(file)) continue;
		seen.add(file);
		let source;
		try {
			source = readFileSync(file, 'utf-8');
		} catch {
			continue;
		}
		for (const [, spec] of source.matchAll(/(?:from|import)\s*["']([^"']+\.js)["']/g)) {
			if (spec.startsWith('.')) queue.push(join(dirname(file), spec));
			else {
				const resolved = resolveAppAsset(spec);
				if (resolved) queue.push(resolved);
			}
		}
	}
	return seen;
}

function pageContainsSentinel(htmlPath) {
	const html = readFileSync(htmlPath, 'utf-8');
	if (html.includes(SENTINEL)) return true;
	for (const file of scriptClosure(html)) {
		if (readFileSync(file, 'utf-8').includes(SENTINEL)) return true;
	}
	return false;
}

function pageTitle(html) {
	return html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? '';
}

function pageDescription(html) {
	const meta =
		html.match(/<meta\s+name="description"\s+content="([^"]*)"/) ??
		html.match(/<meta\s+content="([^"]*)"\s+name="description"/);
	return (meta?.[1] ?? '').trim();
}

const htmlFiles = walk(buildDir).filter((path) => path.endsWith('index.html'));
if (htmlFiles.length === 0) {
	console.error(`No pages found under "${buildDir}" — build the site first.`);
	process.exit(1);
}

const failures = [];
const pages = new Map();
const titles = new Map();
let readerPages = 0;
for (const htmlPath of htmlFiles) {
	const page = `/${relative(buildDir, dirname(htmlPath))}/`.replace(/^\/\.\/$/, '/');
	pages.set(page, htmlPath);
	const html = readFileSync(htmlPath, 'utf-8');
	const isEditorPage = page.endsWith('/edit/');
	const isIndexPage = page === '/uncial/';
	// Editing furniture, like the Index page: it finishes a sign-in and relays
	// the code to the window that opened it. Nobody reads it.
	const isAuthCallback = page === '/auth/callback/';
	const isRedirectStub = html.includes('http-equiv="refresh"');
	const hasSentinel = pageContainsSentinel(htmlPath);
	if (!isEditorPage && !isIndexPage && !isAuthCallback && !isRedirectStub && page !== '/404/') {
		readerPages += 1;
	}

	if (isEditorPage && !hasSentinel) {
		failures.push(`${page} is an editor variant but does not reference the CMS runtime.`);
	} else if (!isEditorPage && !isIndexPage && hasSentinel) {
		failures.push(`${page} is a content page but ships uncial-cms JavaScript.`);
	}

	// Editor variants carry no page metadata of their own; the title and
	// description assertions apply to reader pages and the Index page.
	if (!isEditorPage) {
		const title = pageTitle(html);
		const description = pageDescription(html);
		if (!title) failures.push(`${page} is missing a non-empty title.`);
		else {
			if (!titles.has(title)) titles.set(title, []);
			titles.get(title).push(page);
		}
		if (!description) failures.push(`${page} is missing a non-empty description.`);
	}
}

for (const [title, owners] of titles) {
	if (owners.length > 1) {
		failures.push(`title "${title}" is shared by ${owners.join(', ')}.`);
	}
}

// The Image manifest is the image port's output and lives outside the Content
// directory. A route for it means it has drifted back in, and a save through
// the Editor variant that would come with it would rewrite the manifest as a
// Content document and break every responsive image on the site.
for (const page of pages.keys()) {
	if (/^\/image-manifest\//.test(page)) {
		failures.push(`${page} exists: the Image manifest must have no route of its own.`);
	}
}

// The site is content-complete and closed: 29 pages ported at their existing
// slugs, four Portfolio pieces, and the search route. A change here is either a
// page added on purpose or a document that stopped rendering, and both should be
// deliberate.
const EXPECTED_READER_PAGES = 34;
if (readerPages !== EXPECTED_READER_PAGES) {
	failures.push(
		`expected ${EXPECTED_READER_PAGES} reader pages, found ${readerPages}: update EXPECTED_READER_PAGES if the change was intended.`
	);
}

if (failures.length > 0) {
	console.error('assert:clean-pages FAILED');
	for (const failure of failures) console.error(`  - ${failure}`);
	process.exit(1);
}

console.log(
	`assert:clean-pages OK — ${htmlFiles.length} pages checked, content pages are sentinel-free with distinct titles and descriptions.`
);
