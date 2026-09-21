/**
 * The image port: fetch every photograph the WordPress pages reference,
 * content-address it, derive responsive renditions, and write the Image
 * manifest the renderer reads plus the legacy-URL map later content tickets
 * read.
 *
 * Re-runnable without harm. Originals are cached under `.port-cache/`, and a
 * file's name is a hash of its own bytes, so a second run refetches nothing and
 * writes nothing.
 *
 * Usage: node scripts/port-images.mjs [--limit N] [--force]
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const ORIGIN = 'https://www.richardkwolf.com';
const SOURCE_LIST = 'migration/source/imgs.txt';
const VARIANT_LIST = 'migration/source/allimgs.txt';
const CACHE_DIR = '.port-cache/originals';
const MEDIA_DIR = 'static/uploads';
const MANIFEST_PATH = 'content/image-manifest.json';
const SOURCE_MAP_PATH = 'migration/image-sources.json';

/** Responsive widths. A rendition is never wider than the source. */
const WIDTHS = [400, 800, 1200, 2000];
/** The canonical served file is capped here, as browser uploads are. */
const MAX_WIDTH = 2000;
/** Hash prefix length. 16 hex chars is 64 bits: collision-free at this scale. */
const HASH_LENGTH = 16;
const WEBP = { quality: 72, effort: 6 };
const JPEG = { quality: 72, mozjpeg: true };
const CONCURRENCY = 8;

const args = process.argv.slice(2);
const limit = Number(args[args.indexOf('--limit') + 1]) || Infinity;
const force = args.includes('--force');

/** `…/name-300x225.jpg` → `…/name.jpg`. A path with no size suffix is its own base. */
function baseOf(path) {
	return path.replace(/-(\d+)x(\d+)(\.[A-Za-z]+)$/, '$3');
}

function sizeOf(path) {
	const match = path.match(/-(\d+)x(\d+)\.[A-Za-z]+$/);
	return match ? Number(match[1]) * Number(match[2]) : Infinity;
}

/** `…/name-uai.jpg` → `…/name.jpg`, else null. */
function twinOf(path) {
	const match = path.match(/^(.*)-uai(\.[A-Za-z]+)$/);
	return match ? match[1] + match[2] : null;
}

async function readList(path) {
	const text = await readFile(path, 'utf-8');
	return text.split('\n').map((line) => line.trim()).filter(Boolean);
}

async function fetchToCache(sourcePath) {
	const cachePath = join(CACHE_DIR, sourcePath);
	if (existsSync(cachePath) && !force) return { bytes: await readFile(cachePath), cached: true };
	// The naked host 301s twice, so redirects must be followed.
	const response = await fetch(`${ORIGIN}/${sourcePath}`, { redirect: 'follow' });
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	const bytes = Buffer.from(await response.arrayBuffer());
	await mkdir(dirname(cachePath), { recursive: true });
	await writeFile(cachePath, bytes);
	return { bytes, cached: false };
}

const written = { created: 0, present: 0 };

async function writeRendition(name, bytes) {
	const path = join(MEDIA_DIR, name);
	if (existsSync(path)) {
		written.present += 1;
		return;
	}
	await writeFile(path, bytes);
	written.created += 1;
}

/**
 * Transcode one original into the canonical WebP and its renditions, and return
 * the manifest entry. The canonical file's own bytes are what the hash names,
 * so the port and a browser upload — which likewise caps, transcodes, then
 * commits — produce the same name for the same picture.
 */
async function port(bytes) {
	const source = sharp(bytes, { failOn: 'error' }).rotate();
	const { width: sourceWidth } = await source.metadata();
	if (!sourceWidth) throw new Error('no width in metadata');

	const canonicalWidth = Math.min(sourceWidth, MAX_WIDTH);
	const canonical = await sharp(bytes)
		.rotate()
		.resize({ width: canonicalWidth, withoutEnlargement: true })
		.webp(WEBP)
		.toBuffer();
	const hash = createHash('sha256').update(canonical).digest('hex').slice(0, HASH_LENGTH);

	await writeRendition(`${hash}.webp`, canonical);

	const srcset = [{ src: `/uploads/${hash}.webp`, width: canonicalWidth, type: 'image/webp' }];
	// Renditions sit on the declared grid; a picture narrower than the smallest
	// grid width gets one rendition at its own width so no entry is format-less.
	const widths = WIDTHS.filter((width) => width <= canonicalWidth);
	if (widths.length === 0) widths.push(canonicalWidth);
	for (const width of widths) {
		const scaled = sharp(canonical).resize({ width, withoutEnlargement: true });
		if (width < canonicalWidth) {
			await writeRendition(`${hash}-${width}.webp`, await scaled.clone().webp(WEBP).toBuffer());
			srcset.push({ src: `/uploads/${hash}-${width}.webp`, width, type: 'image/webp' });
		}
		await writeRendition(`${hash}-${width}.jpg`, await scaled.clone().jpeg(JPEG).toBuffer());
		srcset.push({ src: `/uploads/${hash}-${width}.jpg`, width, type: 'image/jpeg' });
	}

	srcset.sort((a, b) => a.type.localeCompare(b.type) || a.width - b.width);
	return { hash, entry: { srcset } };
}

async function mapWithConcurrency(items, worker) {
	const results = new Array(items.length);
	let cursor = 0;
	await Promise.all(
		Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
			while (cursor < items.length) {
				const index = cursor++;
				results[index] = await worker(items[index], index);
			}
		})
	);
	return results;
}

const bases = await readList(SOURCE_LIST);
const referenced = await readList(VARIANT_LIST);

/** Every referenced URL, grouped under the base filename it is a variant of. */
const variantsByBase = new Map(bases.map((base) => [base, new Set([base])]));
for (const path of referenced) {
	const base = baseOf(path);
	if (!variantsByBase.has(base)) variantsByBase.set(base, new Set([base]));
	variantsByBase.get(base).add(path);
}

const baseSet = new Set(bases);
/**
 * The theme's `-uai` crops: their unsuffixed original was never generated (the
 * URL soft-404s with HTML at status 200) and the only sizes the pages reference
 * are 258px thumbnails of a photograph we already port at full size. Each one
 * is therefore aliased to its plain twin rather than ported, so a legacy
 * thumbnail URL resolves to the full responsive set.
 */
const aliases = new Map();
const toPort = [];
for (const base of bases) {
	const twin = twinOf(base);
	if (twin && baseSet.has(twin)) aliases.set(base, twin);
	else toPort.push(base);
}

/** Largest referenced variant of a base: the unsuffixed original when it exists. */
function fetchPathFor(base) {
	return [...variantsByBase.get(base)].sort((a, b) => sizeOf(b) - sizeOf(a))[0];
}

await mkdir(MEDIA_DIR, { recursive: true });

const targets = toPort.slice(0, limit === Infinity ? undefined : limit);
const counts = { fetched: 0, cached: 0 };
const failures = [];
const ported = new Map();

await mapWithConcurrency(targets, async (base) => {
	const sourcePath = fetchPathFor(base);
	const sourceUrl = `${ORIGIN}/${sourcePath}`;
	try {
		const { bytes, cached } = await fetchToCache(sourcePath);
		const { hash, entry } = await port(bytes);
		if (cached) counts.cached += 1;
		else counts.fetched += 1;
		ported.set(base, { hash, entry, sourceUrl });
	} catch (error) {
		failures.push(`${base} (${sourceUrl}): ${error.message}`);
	}
});

const manifest = {};
for (const { hash, entry } of ported.values()) manifest[`/uploads/${hash}.webp`] = entry;

/** Every legacy URL — originals, theme crops, aliased `-uai` sizes — to its served path. */
const sourceMap = {};
for (const [base, { hash, sourceUrl }] of ported) {
	for (const variant of variantsByBase.get(base)) {
		sourceMap[variant] = { path: `/uploads/${hash}.webp`, source: sourceUrl };
	}
}
for (const [base, twin] of aliases) {
	const target = ported.get(twin);
	if (!target) continue;
	for (const variant of variantsByBase.get(base)) {
		sourceMap[variant] = { path: `/uploads/${target.hash}.webp`, source: target.sourceUrl };
	}
}

const sorted = (object) =>
	Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b)));

await mkdir(dirname(MANIFEST_PATH), { recursive: true });
await writeFile(MANIFEST_PATH, `${JSON.stringify(sorted(manifest), null, '\t')}\n`);
await writeFile(SOURCE_MAP_PATH, `${JSON.stringify(sorted(sourceMap), null, '\t')}\n`);

const mediaFiles = await readdir(MEDIA_DIR);
console.log(
	[
		`fetched ${counts.fetched}`,
		`skipped ${counts.cached} (cached original)`,
		`aliased ${aliases.size} (theme -uai crops → plain twin)`,
		`failed ${failures.length}`,
		'',
		`renditions written ${written.created}, already present ${written.present}`,
		`manifest entries ${Object.keys(manifest).length}`,
		`legacy URLs mapped ${Object.keys(sourceMap).length}`,
		`media files ${mediaFiles.length}`
	].join('\n')
);
if (failures.length > 0) {
	console.log('\nfailures:');
	for (const failure of failures) console.log(`  - ${failure}`);
}
