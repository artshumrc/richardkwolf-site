// Port a preserved rendered page to a Content document.
//
// The point of doing this with a script rather than by hand is the
// orthography: the prose carries transliterated Tamil, Persian, Wakhi and
// Russian that retyping would corrupt. Text is carried across byte-faithfully
// (entities decoded, NFC-normalised) and everything the theme wrapped it in is
// discarded. The design is rebuilt by eye elsewhere.
//
// Usage: node scripts/extract-pages.mjs [slug...]   (default: every slug in
// migration/pages.json)

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'node-html-parser';
import { CURRENT_DOCUMENT_VERSION } from 'uncial/core';

const SOURCE_DIR = 'migration/source/pages';
const CONTENT_DIR = 'content';
const TITLE_SUFFIX = ' - Richard K. Wolf';

// Origins the source pages call themselves by. The bare IP is a leftover
// staging server; links to it are internal links written by accident.
const SELF_ORIGIN = /^https?:\/\/(?:www\.)?(?:richardkwolf\.com|159\.203\.177\.179)(?=[/?#]|$)/i;

// Offprints and handouts still live at their WordPress URLs; ticket 9 ports
// the files and rewrites these links.
const WP_UPLOADS = /^\/wp-content\//i;

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
	if (WP_UPLOADS.test(url.pathname)) return { href: raw, internal: false };
	const path = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
	if (!existsSync(`${CONTENT_DIR}/${path.slice(1, -1)}.json`)) {
		unported.add(path);
		return { href: raw, internal: false };
	}
	// The theme's named anchors are page-builder chrome and do not survive the
	// rebuild, so a fragment pointing at one would be a dead link.
	return { href: `${path}${url.search}`, internal: true };
}

function linkMark(el) {
	const { href, internal } = rewriteHref(el.getAttribute('href'));
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

function flowNode(el) {
	const tag = el.tagName;
	if (tag === 'P') return paragraph(el);
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

/**
 * A theme carousel of Vimeo clips becomes one Gallery. The poster is the
 * attachment the carousel's thumbnail was cropped from, which the image port
 * already carries, so no Vimeo request is needed to rebuild the page.
 */
function galleryBlock(wrapper) {
	const items = [];
	for (const anchor of wrapper.querySelectorAll('a[href*="vimeo.com"]')) {
		const vimeoId = /\/video\/(\d+)/.exec(anchor.getAttribute('href') ?? '')?.[1];
		if (!vimeoId) continue;
		const poster = mediaPath(anchor.querySelector('img')?.getAttribute('data-guid'));
		items.push({
			kind: 'vimeo',
			path: '',
			vimeoId,
			poster,
			title: text(anchor.getAttribute('data-title') ?? '').trim(),
			caption: text(anchor.getAttribute('data-caption') ?? '').replace(/\s+/g, ' ').trim()
		});
	}
	return items.length ? { type: 'gallery', attrs: { commentary: '', items } } : null;
}

function extractBody(root) {
	const blocks = [];
	let run = [];
	const flush = () => {
		if (run.length) blocks.push({ type: 'prose', content: run });
		run = [];
	};
	const push = (block) => {
		if (!block) return;
		flush();
		blocks.push(block);
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
				const level = Math.min(4, Math.max(2, Number(source.tagName.slice(1))));
				const node =
					text(source.text).trim().length > HEADING_TEXT_LIMIT
						? paragraph(source)
						: heading(source, level);
				if (node) run.push(node);
			} else if (classes.includes('owl-carousel-wrapper')) {
				push(galleryBlock(child));
			} else if (classes.includes('uncode-single-media')) {
				push(figureBlock(child));
			} else if (tag === 'IFRAME') {
				const src = child.getAttribute('src') ?? '';
				if (src.includes('soundcloud.com')) push(soundcloudBlock(src));
			} else if (FLOW_TAGS.has(tag)) {
				const node = flowNode(child);
				if (node) run.push(node);
			} else {
				walk(child);
			}
		}
	};

	walk(root);
	flush();
	return blocks;
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

function extract(slug) {
	const document = parse(readFileSync(`${SOURCE_DIR}/${slug}.html`, 'utf8'));
	const rawTitle = text(document.querySelector('title')?.text ?? '').trim();
	const title = rawTitle.endsWith(TITLE_SUFFIX) ? rawTitle.slice(0, -TITLE_SUFFIX.length) : rawTitle;
	const description = text(pagesFile.pages[slug]?.description ?? '').trim();
	if (!title || !description) throw new Error(`${slug}: both a title and a description are required`);

	const hero = heroBlock(document, title);
	const body = extractBody(document.querySelector('.post-content'));

	return {
		type: 'doc',
		version: CURRENT_DOCUMENT_VERSION,
		meta: { title, description },
		content: hero ? [hero, ...body] : body
	};
}

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(pagesFile.pages);
for (const slug of slugs) {
	const document = extract(slug);
	writeFileSync(`${CONTENT_DIR}/${slug}.json`, `${JSON.stringify(document, null, 2)}\n`);
	console.log(`${slug}: ${document.content.length} blocks`);
}

for (const path of [...unported].sort()) {
	console.warn(`not ported yet, link left absolute: ${path}`);
}
