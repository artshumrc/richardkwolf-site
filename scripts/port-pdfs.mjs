/**
 * The offprint port: fetch every PDF the WordPress pages link to, optimise it
 * with Ghostscript, and write the legacy-URL map that the page extraction
 * reads to rewrite those links.
 *
 * Re-runnable without harm. Originals are cached under `.port-cache/`, so a
 * second run refetches nothing.
 *
 * Unlike images, offprints keep their filenames rather than being
 * content-addressed: they are citable scholarly artifacts and the filename is
 * part of how a reader finds and shares one (ADR 0001 governs images only).
 *
 * Usage: node scripts/port-pdfs.mjs [--force] [--printer <name>...]
 */
import { execFile } from 'node:child_process';
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

const ORIGIN = 'https://www.richardkwolf.com';
const PAGES_DIR = 'migration/source/pages';
const CACHE_DIR = '.port-cache/pdfs';
const PDF_DIR = 'static/pdfs';
const SOURCE_MAP_PATH = 'migration/pdf-sources.json';
const SERVED_BASE = '/pdfs';

/** A fetch smaller than this is a redirect stub or an error page, not a PDF. */
const MINIMUM_BYTES = 10 * 1024;
const CONCURRENCY = 4;

const args = process.argv.slice(2);
const force = args.includes('--force');
/**
 * Offprints whose scanned pages are illegible at `/ebook`'s 150 dpi and are
 * downsampled at 300 dpi instead. Legibility wins over the size target.
 */
const printerQuality = new Set(
	args.flatMap((arg, index) => (args[index - 1] === '--printer' ? [arg] : []))
);

/** Every self-hosted PDF the preserved pages link to, as site paths. */
async function referencedPdfs() {
	const paths = new Set();
	for (const file of await readdir(PAGES_DIR)) {
		const html = await readFile(join(PAGES_DIR, file), 'utf8');
		for (const [, url] of html.matchAll(/href="(https?:\/\/[^"]+\.pdf)"/gi)) {
			const { hostname, pathname } = new URL(url);
			if (!/^(www\.)?richardkwolf\.com$/i.test(hostname)) continue;
			paths.add(decodeURI(pathname).replace(/^\/+/, ''));
		}
	}
	return [...paths].sort();
}

async function fetchToCache(sourcePath) {
	const cachePath = join(CACHE_DIR, sourcePath);
	if (existsSync(cachePath) && !force) return { bytes: await readFile(cachePath), cached: true };
	// The naked host these links name 301s twice, so redirects must be followed.
	const response = await fetch(`${ORIGIN}/${sourcePath}`, { redirect: 'follow' });
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	const bytes = Buffer.from(await response.arrayBuffer());
	if (bytes.length < MINIMUM_BYTES) throw new Error(`${bytes.length} bytes: not a PDF`);
	if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error('no PDF header');
	await mkdir(join(cachePath, '..'), { recursive: true });
	await writeFile(cachePath, bytes);
	return { bytes, cached: false };
}

/**
 * Ghostscript, then whichever of the two files is smaller. Several of these
 * offprints are scans whose own encoder beats pdfwrite's, and gs happily
 * writes a larger file than it read; keeping the original there costs nothing
 * and risks no legibility.
 */
async function optimise(sourcePath, name) {
	const out = join(PDF_DIR, name);
	if (existsSync(out) && !force) return { written: false, kept: false };
	const original = join(CACHE_DIR, sourcePath);
	await run('gs', [
		'-sDEVICE=pdfwrite',
		'-dCompatibilityLevel=1.5',
		`-dPDFSETTINGS=${printerQuality.has(name) ? '/printer' : '/ebook'}`,
		// Left on — the default — pdfwrite copies DCT-encoded scans through
		// verbatim, so a JPEG-scanned offprint comes out byte for byte as big.
		'-dPassThroughJPEGImages=false',
		'-dNOPAUSE',
		'-dQUIET',
		'-dBATCH',
		'-dDetectDuplicateImages=true',
		`-sOutputFile=${out}`,
		original
	]);
	if ((await stat(out)).size >= (await stat(original)).size) {
		await copyFile(original, out);
		return { written: true, kept: true };
	}
	return { written: true, kept: false };
}

async function mapWithConcurrency(items, worker) {
	let cursor = 0;
	await Promise.all(
		Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
			while (cursor < items.length) await worker(items[cursor++]);
		})
	);
}

const sources = await referencedPdfs();
await mkdir(PDF_DIR, { recursive: true });

const counts = { fetched: 0, cached: 0, optimised: 0, kept: 0 };
const failures = [];
const sourceMap = {};

await mapWithConcurrency(sources, async (sourcePath) => {
	const name = basename(sourcePath);
	try {
		const { cached } = await fetchToCache(sourcePath);
		counts[cached ? 'cached' : 'fetched'] += 1;
		const { written, kept } = await optimise(sourcePath, name);
		if (written) counts.optimised += 1;
		if (kept) counts.kept += 1;
		sourceMap[sourcePath] = { path: `${SERVED_BASE}/${name}`, source: `${ORIGIN}/${sourcePath}` };
	} catch (error) {
		failures.push(`${sourcePath}: ${error.message}`);
	}
});

const sorted = Object.fromEntries(
	Object.entries(sourceMap).sort(([a], [b]) => a.localeCompare(b))
);
await writeFile(SOURCE_MAP_PATH, `${JSON.stringify(sorted, null, '\t')}\n`);

const files = (await readdir(PDF_DIR)).filter((file) => file.endsWith('.pdf'));
const sizes = await Promise.all(files.map((file) => stat(join(PDF_DIR, file))));
const total = sizes.reduce((sum, { size }) => sum + size, 0);

console.log(
	[
		`referenced ${sources.length}`,
		`fetched ${counts.fetched}`,
		`skipped ${counts.cached} (cached original)`,
		`optimised ${counts.optimised}${printerQuality.size ? ` (${printerQuality.size} at /printer)` : ''}`,
		`kept as scanned ${counts.kept} (Ghostscript's output was larger)`,
		`failed ${failures.length}`,
		'',
		`committed ${files.length} PDFs, ${(total / 1024 ** 2).toFixed(1)} MiB total`,
		`legacy URLs mapped ${Object.keys(sorted).length}`
	].join('\n')
);
if (failures.length > 0) {
	console.log('\nfailures (link removed rather than ported):');
	for (const failure of failures) console.log(`  - ${failure}`);
}
