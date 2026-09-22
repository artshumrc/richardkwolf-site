// Port a preserved rendered page to a Content document.
//
// The point of doing this with a script rather than by hand is the
// orthography: the prose carries transliterated Tamil, Persian, Wakhi and
// Russian that retyping would corrupt. Text is carried across byte-faithfully
// (entities decoded, NFC-normalised) and everything the theme wrapped it in is
// discarded. The design is rebuilt by eye elsewhere.
//
// Usage: node scripts/extract-pages.mjs [slug...]   (default: every slug in
// migration/pages.json). Run the two ports first: this reads the source maps
// they write.
//
// HAZARD: the committed Content documents are the edited copy and re-running
// this overwrites them. Captions in particular were repaired by hand after the
// original extraction — an attribute-borne caption containing a double quote
// is truncated at the quote here — so a re-run silently regresses them. Diff
// the result before keeping it.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parse } from 'node-html-parser';
import { CURRENT_DOCUMENT_VERSION } from 'uncial/core';

const SOURCE_DIR = 'migration/source/pages';
const CONTENT_DIR = 'content';
const TITLE_SUFFIX = ' - Richard K. Wolf';

// Origins the source pages call themselves by. The bare IP is a leftover
// staging server; links to it are internal links written by accident.
const SELF_ORIGIN = /^https?:\/\/(?:www\.)?(?:richardkwolf\.com|159\.203\.177\.179)(?=[/?#]|$)/i;

const WP_UPLOADS = /^\/wp-content\//i;

// The metadata schema is one flat set written out in full on every document, so
// a Content page carries the site-wide fields empty rather than omitting them.
// Their declaration of record is `metaFields` in src/lib/blocks.ts; only the
// Site document fills them in.
const SITE_WIDE_META = { siteName: '', email: '', contactLines: '', copyright: '' };

// The theme styles a page's opening sentence as a heading element. A real
// section title on these pages runs to at most 46 characters and the shortest
// such lede to 120, so length separates the two with room to spare.
const HEADING_TEXT_LIMIT = 80;

const FLOW_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'BLOCKQUOTE']);
const MARK_TAGS = new Map([
	['EM', 'italic'],
	['I', 'italic'],
	['STRONG', 'bold'],
	['B', 'bold'],
	['S', 'strike'],
	['STRIKE', 'strike'],
	['DEL', 'strike'],
	['CODE', 'code']
]);

const pagesFile = JSON.parse(readFileSync('migration/pages.json', 'utf8'));
const imageSources = JSON.parse(readFileSync('migration/image-sources.json', 'utf8'));
const pdfSources = JSON.parse(readFileSync('migration/pdf-sources.json', 'utf8'));
const vimeoPosters = JSON.parse(readFileSync('migration/vimeo-posters.json', 'utf8'));

/**
 * The retired posts whose galleries fold into a surviving page. The Legacy
 * route map redirects each retired URL to the page that absorbed it.
 */
const ABSORBED = { 'tamil-songs': ['tamil'] };

/**
 * Retired pages whose inline links repoint at the surviving page covering the
 * same material, so that the prose around them keeps working. Only prose links
 * are followed: a post-index module pointing at a retired page is the module
 * of a page that no longer exists, and is dropped with it. The Legacy route
 * map redirects the retired URL itself.
 */
const RETIRED_LINKS = { '/shahd-and-qalabandi/': '/music-of-central-asia/' };

/**
 * The homepage's Featured Audio Annotation section is a decided special case:
 * the module that pulled the retired Shahd and Qalabandi post goes, Richard's
 * prose about the recording stays, and the link the module carried moves onto
 * the performer's name in that prose. The recording's material now sits on the
 * Music of Central Asia page.
 */
const REPOINTED_PROSE = {
	index: { phrase: 'Ismoil Nazriev', href: '/music-of-central-asia/' }
};

const VIMEO_URL = /player\.vimeo\.com\/video\/(\d+)/;

const text = (value) => (value ?? '').normalize('NFC');

/** The served media path a WordPress image URL was ported to, if any. */
function mediaPath(url) {
	if (!url) return '';
	const key = decodeURI(new URL(url, 'https://www.richardkwolf.com/').pathname).replace(/^\/+/, '');
	return imageSources[key]?.path ?? '';
}

function altFor(path) {
	const alt = pagesFile.alt?.[path];
	if (!alt) throw new Error(`No alt text recorded for ${path}; add it to migration/pages.json`);
	return text(alt);
}

/** Pages whose absolute self-origin links this run could not resolve. */
const unported = new Set();

/** The served path an offprint's WordPress URL was ported to, if any. */
function pdfPath(pathname) {
	return pdfSources[decodeURI(pathname).replace(/^\/+/, '')]?.path ?? '';
}

/**
 * An internal URL becomes a site-relative path, so the renderer can prefix the
 * base path; anything else is left exactly as written. A link to a page no
 * later ticket has ported yet keeps its absolute URL, because the prerenderer
 * crawls site-relative links and would fail the build on the missing route;
 * re-running once that page exists completes the rewrite.
 */
function rewriteHref(href) {
	const raw = text(href).trim();
	if (!SELF_ORIGIN.test(raw)) return { href: raw, internal: false };
	const url = new URL(raw);
	if (WP_UPLOADS.test(url.pathname)) {
		// An offprint the port could not retrieve — one PDF has 404ed on the
		// WordPress site for years — loses its link and keeps its prose, rather
		// than carrying a dead URL across.
		const path = pdfPath(url.pathname);
		return path ? { href: path, internal: true } : { href: '', internal: false };
	}
	const path = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
	if (!existsSync(`${CONTENT_DIR}/${path.slice(1, -1)}.json`)) {
		unported.add(path);
		return { href: raw, internal: false };
	}
	// The theme's named anchors are page-builder chrome and do not survive the
	// rebuild, so a fragment pointing at one would be a dead link.
	return { href: `${path}${url.search}`, internal: true };
}

/** A link to a retired page, rewritten to the page that inherited its material. */
function retire(href) {
	const raw = text(href ?? '').trim();
	if (!SELF_ORIGIN.test(raw)) return raw;
	const url = new URL(raw);
	const replacement = RETIRED_LINKS[url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`];
	if (!replacement) return raw;
	url.pathname = replacement;
	return url.href;
}

function linkMark(el) {
	const { href, internal } = rewriteHref(retire(el.getAttribute('href')));
	if (!href) return null;
	const target = internal ? null : el.getAttribute('target') || null;
	return {
		type: 'link',
		attrs: { href, target, rel: target ? el.getAttribute('rel') || null : null, title: null, class: null }
	};
}

/** Merge runs of text carrying identical marks, which theme spans split up. */
function mergeText(nodes) {
	const merged = [];
	for (const node of nodes) {
		const last = merged.at(-1);
		if (
			node.type === 'text' &&
			last?.type === 'text' &&
			JSON.stringify(last.marks ?? []) === JSON.stringify(node.marks ?? [])
		) {
			last.text += node.text;
		} else {
			merged.push(node);
		}
	}
	return merged;
}

function inlineNodes(el, marks = []) {
	const out = [];
	for (const child of el.childNodes) {
		if (child.nodeType === 3) {
			const value = text(child.text);
			if (value) out.push(marks.length ? { type: 'text', marks, text: value } : { type: 'text', text: value });
			continue;
		}
		if (child.nodeType !== 1) continue;
		const tag = child.tagName;
		if (tag === 'BR') {
			out.push({ type: 'hardBreak' });
		} else if (tag === 'A') {
			const mark = linkMark(child);
			out.push(...inlineNodes(child, mark ? [...marks, mark] : marks));
		} else if (MARK_TAGS.has(tag)) {
			out.push(...inlineNodes(child, [...marks, { type: MARK_TAGS.get(tag) }]));
		} else {
			out.push(...inlineNodes(child, marks));
		}
	}
	return mergeText(out);
}

/** Trim the whitespace the theme's pretty-printed markup leaves at the edges. */
function trimInline(nodes) {
	const out = nodes.slice();
	while (out.length && out[0].type === 'hardBreak') out.shift();
	while (out.length && out.at(-1).type === 'hardBreak') out.pop();
	if (out[0]?.type === 'text') out[0].text = out[0].text.replace(/^\s+/, '');
	if (out.at(-1)?.type === 'text') out.at(-1).text = out.at(-1).text.replace(/\s+$/, '');
	return out.filter((node) => node.type !== 'text' || node.text.length);
}

function paragraph(el) {
	const content = trimInline(inlineNodes(el));
	return content.length ? { type: 'paragraph', content } : null;
}

function heading(el, level) {
	const content = trimInline(inlineNodes(el));
	return content.length ? { type: 'heading', attrs: { level }, content } : null;
}

function list(el) {
	const items = [];
	for (const li of el.querySelectorAll(':scope > li')) {
		const content = trimInline(inlineNodes(li));
		if (content.length) items.push({ type: 'listItem', content: [{ type: 'paragraph', content }] });
	}
	if (!items.length) return null;
	return { type: el.tagName === 'OL' ? 'orderedList' : 'bulletList', content: items };
}

/**
 * The Date / Location / Performers row a portfolio piece closes on, which the
 * theme laid out as label-and-value spans inside one paragraph.
 */
function detailList(el) {
	const items = el.querySelectorAll('.detail-container').map((container) => {
		const label = text(container.querySelector('.detail-label')?.text ?? '').trim();
		const value = text(container.querySelector('.detail-value')?.text ?? '').trim();
		if (!label || !value) return null;
		return {
			type: 'listItem',
			content: [
				{
					type: 'paragraph',
					content: [
						{ type: 'text', marks: [{ type: 'bold' }], text: `${label}: ` },
						{ type: 'text', text: value }
					]
				}
			]
		};
	});
	const content = items.filter(Boolean);
	return content.length ? { type: 'bulletList', content } : null;
}

function flowNode(el) {
	const tag = el.tagName;
	if (tag === 'P') return detailList(el) ?? paragraph(el);
	if (tag === 'BLOCKQUOTE') {
		const inner = el.childNodes.filter((n) => n.nodeType === 1 && FLOW_TAGS.has(n.tagName)).map(flowNode);
		const content = inner.filter(Boolean);
		return content.length ? { type: 'blockquote', content } : null;
	}
	if (tag === 'UL' || tag === 'OL') return list(el);
	return heading(el, Math.min(4, Math.max(2, Number(tag.slice(1)))));
}

function soundcloudBlock(src) {
	const url = new URL(src, 'https://w.soundcloud.com/');
	const resourceUrl = url.searchParams.get('url') ?? '';
	const match = /api\.soundcloud\.com\/(track|playlist)s\/(\d+)/.exec(resourceUrl);
	if (!match) return null;
	return {
		type: 'soundcloud',
		attrs: { resource: match[1], soundcloudId: match[2], title: '' }
	};
}

function figureBlock(wrapper) {
	const img = wrapper.querySelector('img');
	const path = mediaPath(img?.getAttribute('data-guid') || img?.getAttribute('src'));
	if (!path) return null;
	const caption = text(wrapper.querySelector('figcaption')?.text ?? '').trim();
	return { type: 'figure', attrs: { path, alt: altFor(path), caption } };
}

/** A tile's title and caption, wherever the theme happened to put them. */
function tileText(tile, anchor) {
	const title = anchor?.getAttribute('data-title') ?? tile.querySelector('.t-entry-title')?.text ?? '';
	const caption = anchor?.getAttribute('data-caption') ?? tile.querySelector('.t-entry-meta')?.text ?? '';
	return {
		title: text(title).replace(/\s+/g, ' ').trim(),
		caption: text(caption).replace(/\s+/g, ' ').trim()
	};
}

/**
 * One thumbnail of a theme carousel or masonry grid as a Gallery item. A video
 * is sometimes a lightbox link to the player and sometimes an iframe embedded
 * in the tile itself; both become the same item, whose poster is the frame the
 * image port fetched from Vimeo.
 */
function galleryItem(tile) {
	const anchor = tile.querySelector('a.pushed[data-lbox]');
	const iframe = tile.querySelector('iframe');
	const href = anchor?.getAttribute('href') ?? '';
	const { title, caption } = tileText(tile, anchor);

	const vimeoId = (VIMEO_URL.exec(href) ?? VIMEO_URL.exec(iframe?.getAttribute('src') ?? ''))?.[1];
	if (vimeoId) {
		const poster = vimeoPosters[vimeoId];
		return {
			kind: 'vimeo',
			path: '',
			vimeoId,
			poster: poster?.path ?? '',
			title: title || text(poster?.title ?? '').trim(),
			caption
		};
	}

	const path = anchor && (mediaPath(href) || mediaPath(tile.querySelector('img')?.getAttribute('data-guid')));
	return path ? { kind: 'image', path, vimeoId: '', poster: '', title, caption } : null;
}

/**
 * A tile linking to another page of the site as a Card. A tile pointing at a
 * page no later ticket has ported — a retired annotated-audio post, a
 * portfolio piece — yields nothing, because the prerenderer crawls the link.
 */
function cardBlock(tile) {
	const anchor = tile.querySelector('.t-entry-title a') ?? tile.querySelector('a.pushed[href]');
	const { href, internal } = rewriteHref(anchor?.getAttribute('href'));
	const image = mediaPath(tile.querySelector('img')?.getAttribute('data-guid'));
	if (!internal || !image) return null;
	const { title } = tileText(tile, null);
	return {
		type: 'card',
		attrs: {
			image,
			alt: altFor(image),
			title,
			blurb: text(tile.querySelector('.t-entry-excerpt')?.text ?? '').replace(/\s+/g, ' ').trim(),
			link: href,
			externalUrl: ''
		}
	};
}

/**
 * A carousel or masonry grid becomes a Gallery when its tiles are media, and a
 * Card row when they are links to other pages. A grid whose tiles are all
 * retired — the annotated-audio post lists — becomes nothing at all.
 */
function mediaGroup(container) {
	const tiles = container.querySelectorAll('.tmb');
	const items = tiles.map(galleryItem).filter(Boolean);
	if (items.length > 0) return { type: 'gallery', attrs: { commentary: '', items } };

	const cards = tiles.map(cardBlock).filter(Boolean);
	if (cards.length === 0) return null;
	// Two is the narrowest row the Block offers, so a lone card still sits in one.
	return { type: 'cardRow', attrs: { columns: Math.min(Math.max(cards.length, 2), 3) }, content: cards };
}

/**
 * A lone media module: a captioned photograph, or a single Vimeo clip. The clip
 * is sometimes an inline iframe and sometimes a lightbox link over a poster
 * crop; the latter is still a video, not the photograph it appears to be.
 */
function singleMedia(wrapper) {
	const iframe = wrapper.querySelector('iframe');
	const anchor = wrapper.querySelector('a.pushed[data-lbox]');
	const vimeoId = (
		VIMEO_URL.exec(iframe?.getAttribute('src') ?? '') ??
		VIMEO_URL.exec(anchor?.getAttribute('href') ?? '')
	)?.[1];
	if (!vimeoId) return figureBlock(wrapper);
	const poster = vimeoPosters[vimeoId];
	const tile = wrapper.querySelector('.tmb');
	const { title, caption } = tile ? tileText(tile, anchor) : { title: '', caption: '' };
	return {
		type: 'gallery',
		attrs: {
			commentary: '',
			items: [
				{
					kind: 'vimeo',
					path: '',
					vimeoId,
					poster: poster?.path ?? '',
					title: title || text(iframe?.getAttribute('title') ?? poster?.title ?? '').trim(),
					caption
				}
			]
		}
	};
}

/**
 * A page-builder heading sometimes holds a title span and a subtitle span with
 * nothing between them, the theme's stylesheet having made the second a line of
 * its own. Put the break back so the two do not run together.
 */
function splitHeadingLines(source) {
	const spans = source.childNodes.filter((node) => node.nodeType === 1 && node.tagName === 'SPAN');
	for (const span of spans.slice(1)) span.insertAdjacentHTML('beforebegin', '<br>');
}

function extractBody(root) {
	const blocks = [];
	let run = [];
	/** Whether the last node in `run` is a label introducing the next module. */
	let label = false;

	const flush = () => {
		if (run.length) blocks.push({ type: 'prose', content: run });
		run = [];
	};
	const write = (node) => {
		run.push(node);
		label = false;
	};
	const push = (block) => {
		if (!block) {
			// A label whose module is all retired material loses its module, and
			// would otherwise be left introducing whatever comes next.
			if (label) run.pop();
			label = false;
			return;
		}
		// Adjacent carousels with nothing between them are one gallery that the
		// theme happened to split; the headings mark the real groups.
		const previous = blocks.at(-1);
		if (block.type === 'gallery' && run.length === 0 && previous?.type === 'gallery') {
			previous.attrs.items.push(...block.attrs.items);
			return;
		}
		flush();
		blocks.push(block);
		label = false;
	};

	const walk = (el) => {
		for (const child of el.childNodes) {
			if (child.nodeType !== 1) continue;
			const tag = child.tagName;
			if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') continue;
			const classes = child.getAttribute('class') ?? '';

			// Some pages end with a hand-built copy of the site footer as an
			// ordinary content row. The site's own footer renders it now, and the
			// contact address is the one thing only that band carries.
			if (classes.includes('row-container') && child.querySelector('a[href^="mailto:"]')) continue;

			if (classes.includes('vc_custom_heading_wrap')) {
				const source = child.querySelector('h1, h2, h3, h4, h5, h6');
				if (!source) continue;
				splitHeadingLines(source);
				const level = Math.min(4, Math.max(2, Number(source.tagName.slice(1))));
				const node =
					text(source.text).trim().length > HEADING_TEXT_LIMIT
						? paragraph(source)
						: heading(source, level);
				if (node) {
					write(node);
					label = node.type === 'heading';
				}
			} else if (classes.includes('owl-carousel-wrapper') || classes.includes('isotope-system')) {
				push(mediaGroup(child));
			} else if (classes.includes('uncode-single-media')) {
				push(singleMedia(child));
			} else if (tag === 'IFRAME') {
				const src = child.getAttribute('src') ?? '';
				if (src.includes('soundcloud.com')) push(soundcloudBlock(src));
			} else if (FLOW_TAGS.has(tag)) {
				const node = flowNode(child);
				if (node) write(node);
			} else {
				walk(child);
			}
		}
	};

	walk(root);
	flush();
	return blocks;
}

/**
 * Link a page's first mention of a phrase, in place, at the page that inherited
 * the material the phrase's module used to point at.
 */
function repoint(blocks, slug) {
	const repointing = REPOINTED_PROSE[slug];
	if (!repointing) return;
	const { phrase, href } = repointing;
	const mark = { type: 'link', attrs: { href, target: null, rel: null, title: null, class: null } };

	const link = (nodes) => {
		for (const [index, node] of nodes.entries()) {
			if (node.type !== 'text') {
				if (node.content && link(node.content)) return true;
				continue;
			}
			const at = node.text.indexOf(phrase);
			if (at === -1 || node.marks?.length) continue;
			const parts = [
				{ type: 'text', text: node.text.slice(0, at) },
				{ type: 'text', marks: [mark], text: phrase },
				{ type: 'text', text: node.text.slice(at + phrase.length) }
			].filter((part) => part.text.length > 0);
			nodes.splice(index, 1, ...parts);
			return true;
		}
		return false;
	};

	for (const block of blocks) {
		if (block.content && link(block.content)) return;
	}
	throw new Error(`${slug}: no unlinked mention of "${phrase}" to repoint at ${href}`);
}

function heroBlock(document, title) {
	const banner = document.querySelector('#page-header .header-bg');
	const path = mediaPath(banner?.getAttribute('data-guid'));
	if (!path) return null;
	const headline = text(document.querySelector('#page-header .header-title')?.text ?? '').trim();
	return {
		type: 'hero',
		attrs: { image: path, alt: altFor(path), eyebrow: '', headline: headline || title, lede: '' }
	};
}

/**
 * Fold a retired post's gallery items into the page that inherits them. An
 * item the page already carries — the two pages shared a clip — is not
 * repeated.
 */
function absorb(blocks, slug) {
	const source = extractBody(
		parse(readFileSync(`${SOURCE_DIR}/${slug}.html`, 'utf8')).querySelector('.post-content')
	);
	const items = source.filter((block) => block.type === 'gallery').flatMap((block) => block.attrs.items);
	if (items.length === 0) return;

	const target = blocks.findLast((block) => block.type === 'gallery');
	if (!target) {
		blocks.push({ type: 'gallery', attrs: { commentary: '', items } });
		return;
	}
	const held = new Set(target.attrs.items.map((item) => item.path || item.vimeoId));
	target.attrs.items.push(...items.filter((item) => !held.has(item.path || item.vimeoId)));
}

/**
 * A portfolio piece is laid out as a media column beside an information
 * sidebar, and the sidebar is where its essay lives. The rebuilt page opens on
 * that prose and the media follows it, as every other page of the site does.
 * The Google Maps widget two of the pieces embed is a WordPress plugin and is
 * not carried across; the theme renders it from a script, so discarding the
 * script discards the map.
 */
function portfolioBody(document) {
	const body = document.querySelector('.portfolio-body');
	const sidebar = body.querySelector('.col-widgets-sidebar');
	const info = sidebar.querySelector('.info-content');
	// The piece's title is the page's own, and the share bar is theme chrome
	// whose label and value spans would otherwise read as a detail row.
	for (const el of info.querySelectorAll('.post-title-wrapper, .post-footer')) el.remove();
	const prose = extractBody(info);
	sidebar.remove();
	return [...prose, ...extractBody(body)];
}

function extract(slug) {
	const page = pagesFile.pages[slug];
	const document = parse(readFileSync(`${SOURCE_DIR}/${page?.source ?? slug}.html`, 'utf8'));
	const rawTitle = text(document.querySelector('title')?.text ?? '').trim();
	const title = rawTitle.endsWith(TITLE_SUFFIX) ? rawTitle.slice(0, -TITLE_SUFFIX.length) : rawTitle;
	const description = text(page?.description ?? '').trim();
	if (!title || !description) throw new Error(`${slug}: both a title and a description are required`);

	const hero = heroBlock(document, title);
	const body = document.querySelector('.post-content')
		? extractBody(document.querySelector('.post-content'))
		: portfolioBody(document);
	for (const source of ABSORBED[slug] ?? []) absorb(body, source);
	repoint(body, slug);

	return {
		type: 'doc',
		version: CURRENT_DOCUMENT_VERSION,
		meta: { title, description, ...SITE_WIDE_META },
		content: hero ? [hero, ...body] : body
	};
}

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(pagesFile.pages);
for (const slug of slugs) {
	const document = extract(slug);
	const file = `${CONTENT_DIR}/${slug}.json`;
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`);
	console.log(`${slug}: ${document.content.length} blocks`);
}

for (const path of [...unported].sort()) {
	console.warn(`not ported yet, link left absolute: ${path}`);
}
